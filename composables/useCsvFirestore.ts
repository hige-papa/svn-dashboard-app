import { ref } from 'vue'
import { useFirestore } from '~/composables/firebase/useFirestore'
import Papa from 'papaparse'

// 動的データ型（フィールド定義から生成される）
export type DynamicData = Record<string, any>

// CSVインポート結果の型
export interface CsvImportResult {
  success: boolean
  data: DynamicData[]
  errors: string[]
  skippedRows: number
}

// CSVエクスポート設定の型
export interface CsvExportOptions {
  filename?: string
  includeHeaders?: boolean
  onlyHeaderFields?: boolean
}

export const useCsvFirestore = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 既存のFirestore composableを使用
  const {
    getCollectionAsync,
    addDocAsync,
    updateDocAsync,
    deleteDocAsync,
    getDocRef
  } = useFirestore()

  // ヘッダーフィールドのみを取得
  const getHeaderFields = (fieldDefinitions: FieldDefinition[]) => 
    fieldDefinitions.filter(field => field.header)

  // フィールド名のマッピング（name -> label）
  const getFieldLabelMap = (fieldDefinitions: FieldDefinition[]) => 
    fieldDefinitions.reduce((map, field) => {
      map[field.name] = field.label
      return map
    }, {} as Record<string, string>)

  // フィールド名のマッピング（label -> name）
  const getLabelFieldMap = (fieldDefinitions: FieldDefinition[]) => 
    fieldDefinitions.reduce((map, field) => {
      map[field.label] = field.name
      return map
    }, {} as Record<string, string>)

  // 値を適切な型に変換
  const convertValue = (value: any, fieldType: string): any => {
    if (value === null || value === undefined || value === '') {
      return null
    }

    switch (fieldType) {
      case 'number':
        const num = Number(value)
        return isNaN(num) ? null : num
      case 'date':
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]
      case 'month':
        // YYYY/MM形式をYYYY-MM形式に変換
        if (typeof value === 'string' && value.includes('/')) {
          const [year, month] = value.split('/')
          return `${year}-${month.padStart(2, '0')}`
        }
        return value
      default:
        return String(value).trim()
    }
  }

  // データバリデーション
  const validateData = (rowData: DynamicData, fieldDefinitions: FieldDefinition[]): string[] => {
    const errors: string[] = []
    
    fieldDefinitions.forEach(field => {
      const value = rowData[field.name]
      
      if (field.required && (value === null || value === undefined || value === '')) {
        errors.push(`${field.label}は必須項目です`)
      }
      
      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          errors.push(`${field.label}の形式が正しくありません`)
        }
      }
    })
    
    return errors
  }

  // Firestoreからデータを取得
  const fetchData = async (collectionName: string): Promise<DynamicData[]> => {
    loading.value = true
    error.value = null
    
    try {
      const querySnapshot = await getCollectionAsync(collectionName)
      
      const result = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return result
    } catch (err) {
      error.value = `データの取得に失敗しました: ${err}`
      console.error('Error fetching data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // CSVファイルをインポート
  const importCsv = async (
    file: File, 
    collectionName: string, 
    fieldDefinitions: FieldDefinition[]
  ): Promise<CsvImportResult> => {
    loading.value = true
    error.value = null
    
    // ファイルの存在確認
    if (!file || !(file instanceof File)) {
      error.value = 'ファイルが選択されていません'
      loading.value = false
      return {
        success: false,
        data: [],
        errors: ['ファイルが選択されていません'],
        skippedRows: 0
      }
    }
    
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const importResult: CsvImportResult = {
            success: false,
            data: [],
            errors: [],
            skippedRows: 0
          }

          try {
            const processedData: DynamicData[] = []
            const labelFieldMap = getLabelFieldMap(fieldDefinitions)
            
            for (let i = 0; i < results.data.length; i++) {
              const row = results.data[i] as Record<string, any>
              const processedRow: DynamicData = {}
              let hasValidData = false
              
              // CSVヘッダーをフィールド名に変換してデータを処理
              Object.keys(row).forEach(csvHeader => {
                const fieldName = labelFieldMap[csvHeader.trim()]
                if (fieldName) {
                  const field = fieldDefinitions.find(f => f.name === fieldName)
                  if (field) {
                    const convertedValue = convertValue(row[csvHeader], field.type)
                    processedRow[fieldName] = convertedValue
                    if (convertedValue !== null) hasValidData = true
                  }
                }
              })

              // 空の行をスキップ
              if (!hasValidData) {
                importResult.skippedRows++
                continue
              }

              // データバリデーション
              const validationErrors = validateData(processedRow, fieldDefinitions)
              if (validationErrors.length > 0) {
                importResult.errors.push(`行 ${i + 1}: ${validationErrors.join(', ')}`)
                continue
              }

              processedData.push(processedRow)
            }

            // Firestoreに保存
            for (const item of processedData) {
              const docRef = await addDocAsync(collectionName, item)
              if (!docRef) {
                throw new Error('ドキュメントの追加に失敗しました')
              }
            }

            importResult.success = true
            importResult.data = processedData
            
          } catch (err) {
            importResult.errors.push(`インポート処理中にエラーが発生しました: ${err}`)
            error.value = importResult.errors.join('\n')
          } finally {
            loading.value = false
          }
          
          resolve(importResult)
        },
        error: (parseError) => {
          loading.value = false
          const errorMessage = parseError?.message || 'CSVファイルの解析に失敗しました'
          error.value = errorMessage
          console.error('Papa parse error:', parseError)
          resolve({
            success: false,
            data: [],
            errors: [errorMessage],
            skippedRows: 0
          })
        }
      })
    })
  }

  // CSVファイルをエクスポート
  const exportCsv = async (
    data: DynamicData[],
    collectionName: string,
    fieldDefinitions: FieldDefinition[],
    options: CsvExportOptions = {}
  ): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      const {
        filename = `${collectionName}_${new Date().toISOString().split('T')[0]}.csv`,
        includeHeaders = true,
        onlyHeaderFields = false
      } = options

      // 使用するフィールドを決定
      const fieldsToExport = onlyHeaderFields ? getHeaderFields(fieldDefinitions) : fieldDefinitions
      
      // データを準備（null値や未定義値を空文字列に変換）
      const csvData = data.map(item => {
        const csvRow: Record<string, string> = {}
        fieldsToExport.forEach(field => {
          const value = item[field.name]
          // null, undefined, または空文字列の場合は空文字列に統一
          csvRow[field.label] = value === null || value === undefined ? '' : String(value)
        })
        return csvRow
      })

      // CSVを生成（全ての値をダブルクォーテーションで囲む）
      const csv = Papa.unparse(csvData, {
        header: includeHeaders,
        quotes: true,        // 全ての値をダブルクォーテーションで囲む
        quoteChar: '"',      // クォート文字
        escapeChar: '"',     // エスケープ文字（"" でダブルクォーテーションをエスケープ）
        delimiter: ',',      // 区切り文字
        newline: '\r\n'      // 改行文字（Windows互換）
      })

      // ファイルをダウンロード（BOMを追加してExcelでの文字化け防止）
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // URLオブジェクトを解放
      URL.revokeObjectURL(url)
      
    } catch (err) {
      error.value = `CSVエクスポートに失敗しました: ${err}`
      console.error('Error exporting CSV:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 単一データを追加
  const addData = async (
    newData: DynamicData, 
    collectionName: string, 
    fieldDefinitions: FieldDefinition[]
  ): Promise<string | null> => {
    loading.value = true
    error.value = null
    
    try {
      const validationErrors = validateData(newData, fieldDefinitions)
      if (validationErrors.length > 0) {
        error.value = validationErrors.join('\n')
        return null
      }

      const docRef = await addDocAsync(collectionName, newData)
      if (!docRef) {
        error.value = 'データの追加に失敗しました'
        return null
      }
      
      return docRef.id
    } catch (err) {
      error.value = `データの追加に失敗しました: ${err}`
      console.error('Error adding data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 単一データを更新
  const updateData = async (
    id: string, 
    updatedData: Partial<DynamicData>, 
    collectionName: string, 
    fieldDefinitions?: FieldDefinition[]
  ): Promise<boolean> => {
    loading.value = true
    error.value = null
    
    try {
      // 部分更新の場合はバリデーションをスキップ
      if (fieldDefinitions) {
        const validationErrors = validateData(updatedData as DynamicData, fieldDefinitions)
        if (validationErrors.length > 0) {
          error.value = validationErrors.join('\n')
          return false
        }
      }

      await updateDocAsync(collectionName, id, updatedData)
      return true
    } catch (err) {
      error.value = `データの更新に失敗しました: ${err}`
      console.error('Error updating data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 単一データを削除
  const deleteData = async (id: string, collectionName: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    
    try {
      await deleteDocAsync(collectionName, id)
      return true
    } catch (err) {
      error.value = `データの削除に失敗しました: ${err}`
      console.error('Error deleting data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // CSVテンプレートを生成
  const generateCsvTemplate = (collectionName: string, fieldDefinitions: FieldDefinition[]): void => {
    const templateData: Record<string, string>[] = [{}]
    const fieldsToInclude = getHeaderFields(fieldDefinitions)
    const fieldsForTemplate = fieldsToInclude.length > 0 ? fieldsToInclude : fieldDefinitions
    
    fieldsForTemplate.forEach(field => {
      templateData[0][field.label] = field.placeholder || ''
    })

    // テンプレートCSVも全ての値をダブルクォーテーションで囲む
    const csv = Papa.unparse(templateData, { 
      header: true,
      quotes: true,        // 全ての値をダブルクォーテーションで囲む
      quoteChar: '"',      // クォート文字
      escapeChar: '"',     // エスケープ文字
      delimiter: ',',      // 区切り文字
      newline: '\r\n'      // 改行文字（Windows互換）
    })
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${collectionName}_template.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // URLオブジェクトを解放
    URL.revokeObjectURL(url)
  }

  return {
    // リアクティブな状態
    loading,
    error,
    
    // ユーティリティ関数
    getHeaderFields,
    getFieldLabelMap,
    getLabelFieldMap,
    
    // メソッド
    fetchData,
    importCsv,
    exportCsv,
    addData,
    updateData,
    deleteData,
    generateCsvTemplate,
    
    // ユーティリティ
    validateData,
    convertValue
  }
}