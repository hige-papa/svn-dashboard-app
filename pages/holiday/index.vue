<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">祝祭日設定</p>
      </div>
      
      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">

          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-file-document-multiple-outline icon"></i>
              CSV一括操作
            </h3>
            <p class="section-description">
              CSVファイルを使用して祝祭日を一括で登録・更新できます。インポートするCSVファイルの日付（YYYY-MM-DD形式）をキーとして、既存の祝日は更新、存在しない祝日は新規追加されます。
            </p>
            <div class="csv-actions">
              <button type="button" @click="handleDownloadTemplate" class="btn btn-secondary">
                <i class="mdi mdi-download icon"></i>
                テンプレート
              </button>
              <button type="button" @click="handleExportCsv" class="btn btn-secondary">
                <i class="mdi mdi-export icon"></i>
                CSVエクスポート
              </button>
              <input 
                ref="csvFileInput"
                type="file" 
                accept=".csv"
                class="file-input"
                @change="handleImportCsv"
              >
              <button type="button" @click="triggerCsvFileInput" class="btn btn-primary-outline">
                <i class="mdi mdi-import icon"></i>
                CSVインポート
              </button>
            </div>
          </div>

          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-calendar-star icon"></i>
              祝祭日リスト
            </h3>
            
            <div class="holiday-list">
              <div class="holiday-item header">
                <label class="form-label">日付</label>
                <label class="form-label">祝日名</label>
                <label class="form-label">操作</label>
              </div>

              <div v-for="(holiday, index) in holidays" :key="holiday.tempId" class="holiday-item" :class="{ error: holiday.error }">
                <div class="form-group">
                  <input 
                    type="date"
                    class="form-input"
                    v-model="holiday.date"
                  >
                </div>
                <div class="form-group">
                  <input 
                    type="text"
                    class="form-input"
                    placeholder="例：元日"
                    v-model="holiday.name"
                  >
                </div>
                <div class="item-actions">
                  <button type="button" @click="removeHoliday(index)" class="btn-icon">
                    <i class="mdi mdi-delete-outline"></i>
                  </button>
                </div>
              </div>
               <div v-if="holidays.length === 0 && !isLoading" class="empty-state">
                <i class="mdi mdi-calendar-search icon"></i>
                <p>登録されている祝祭日がありません。</p>
                <p>「行を追加」またはCSVインポートで新しい祝祭日を追加してください。</p>
              </div>
            </div>

            <button type="button" @click="addHolidayRow" class="btn btn-secondary add-row-btn">
              <i class="mdi mdi-plus-circle-outline icon"></i>
              行を追加
            </button>
          </div>
          
          <div class="form-actions">
            <NuxtLink to="/" class="btn btn-secondary">
              <i class="mdi mdi-close icon"></i>
              キャンセル
            </NuxtLink>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              <i v-if="isLoading" class="mdi mdi-loading icon loading-spin"></i>
              <i v-else class="mdi mdi-content-save icon"></i>
              {{ isLoading ? '保存中...' : 'すべての変更を保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i :class="`mdi ${notification.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'}`" class="icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import Papa from 'papaparse'
import { useMaster } from '~/composables/master/useMaster'
import { useCsvFirestore } from '~/composables/useCsvFirestore'

// SEOとスタイルシート
useHead({
  title: 'TASCAL - 祝祭日設定',
  meta: [
    { name: 'description', content: 'TASCALシステムで祝祭日を一括登録・編集します。' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// Holidayデータ型定義
interface Holiday {
  tempId: string; // Vueのkeyとして使用する一意なID
  date: string;
  name: string;
  error?: boolean;
}

// Composables
const { getListAsync, addWithIdAsync, updateAsync, deleteAsync } = useMaster('holidays')
const { exportCsv, generateCsvTemplate } = useCsvFirestore()

// リアクティブデータ
const holidays = ref<Holiday[]>([])
const originalHolidays = ref<Holiday[]>([]) // 変更比較用の元データ
const deletedHolidayIds = ref<string[]>([])
const isLoading = ref(false)
const csvFileInput = ref<HTMLInputElement | null>(null)
const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// CSVとマッピングするためのフィールド定義
const holidayFields: FieldDefinition[] = [
  { name: 'date', label: '日付', type: 'date', required: true, header: true, placeholder: 'YYYY-MM-DD' },
  { name: 'name', label: '祝日名', type: 'text', required: true, header: true, placeholder: '祝日の名前' }
]

/**
 * Firestoreから祝祭日データを読み込む
 */
const loadHolidays = async () => {
  isLoading.value = true
  deletedHolidayIds.value = []
  try {
    const data = await getListAsync()
    const mappedData = data
      .map((d: any) => ({
        tempId: d.id, // FirestoreのID(日付)をtempIdとして使用
        date: d.date,
        name: d.name,
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
    
    holidays.value = mappedData
    originalHolidays.value = JSON.parse(JSON.stringify(mappedData)) // ディープコピーで元データを保持
  } catch (err) {
    showNotification('データの読み込みに失敗しました', 'error')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// マウント時にデータを読み込み
onMounted(loadHolidays)

/**
 * 新しい祝日入力行を追加
 */
const addHolidayRow = () => {
  holidays.value.push({
    tempId: `new-${Date.now()}`, // 一時的なユニークID
    date: '',
    name: '',
  })
}

/**
 * 祝日入力行を削除
 * @param index 削除する行のインデックス
 */
const removeHoliday = (index: number) => {
  const holidayToRemove = holidays.value[index]
  // 'new-'で始まらないIDは既存データなので、削除リストに追加
  if (!holidayToRemove.tempId.startsWith('new-')) {
    deletedHolidayIds.value.push(holidayToRemove.date) // IDは日付
  }
  holidays.value.splice(index, 1)
}

/**
 * フォームのバリデーション
 */
const validateForm = (): boolean => {
  let isValid = true;
  holidays.value.forEach(h => {
    if (!h.date || !h.name) {
      h.error = true;
      isValid = false;
    } else {
      h.error = false;
    }
  });

  const dates = holidays.value.map(h => h.date);
  const hasDuplicates = dates.some((date, index) => dates.indexOf(date) !== index);

  if (hasDuplicates) {
    showNotification('日付が重複しています。日付はユニークである必要があります。', 'error')
    return false;
  }

  if (!isValid) {
    showNotification('日付と祝日名は必須です。', 'error');
  }
  return isValid;
}


/**
 * フォームの送信処理 (一括保存)
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  const promises: Promise<any>[] = []

  // 1. 削除処理
  deletedHolidayIds.value.forEach(id => {
    promises.push(deleteAsync(id))
  })

  // 2. 追加・更新処理
  holidays.value.forEach(current => {
    const original = originalHolidays.value.find(o => o.tempId === current.tempId)
    
    if (!original) { // 新規追加
      promises.push(addWithIdAsync(current.date, { date: current.date, name: current.name }))
    } else { // 既存データの更新チェック
      if (original.date !== current.date || original.name !== current.name) {
        // 日付(ID)が変更された場合は、古いものを削除して新しいものを追加
        if(original.date !== current.date) {
            promises.push(deleteAsync(original.date))
        }
        promises.push(addWithIdAsync(current.date, { date: current.date, name: current.name }))
      }
    }
  })
  
  try {
    await Promise.all(promises)
    showNotification('祝祭情報を保存しました', 'success')
    await loadHolidays() // データを再読み込みして状態をリフレッシュ
  } catch (err) {
    showNotification('保存中にエラーが発生しました', 'error')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// --- CSV関連の関数 ---

/**
 * CSVテンプレートをダウンロード
 */
const handleDownloadTemplate = () => {
  generateCsvTemplate('holidays', holidayFields)
}

/**
 * 現在の祝祭日データをCSVとしてエクスポート
 */
const handleExportCsv = async () => {
  if (originalHolidays.value.length === 0) {
    showNotification('エクスポートするデータがありません', 'error');
    return;
  }
  await exportCsv(originalHolidays.value, 'holidays', holidayFields, { filename: 'holidays_export.csv' })
}

/**
 * ファイル選択ダイアログを開く
 */
const triggerCsvFileInput = () => {
  csvFileInput.value?.click()
}

/**
 * CSVファイルをインポートして処理 (Upsert:あれば更新、なければ追加)
 * @param event ファイル選択イベント
 */
const handleImportCsv = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results: any) => {
      const promises: Promise<any>[] = []
      const importedRows = results.data as { [key: string]: string }[]

      for (const row of importedRows) {
        const date = row['日付']?.trim()
        const name = row['祝日名']?.trim()

        // YYYY-MM-DD形式のバリデーションを追加
        if (date && name && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          // 日付をIDとして追加/更新(Upsert)
          promises.push(addWithIdAsync(date, { date, name }))
        } else {
          console.warn('Skipping invalid or incomplete row in CSV:', row)
        }
      }

      if (promises.length === 0) {
          showNotification('CSVファイルに有効なデータが見つかりませんでした。ヘッダーが「日付」「祝日名」になっているか確認してください。', 'error')
          isLoading.value = false
          return
      }

      try {
        await Promise.all(promises)
        showNotification(`${promises.length}件の祝祭日をインポートしました`, 'success')
        await loadHolidays() // 画面を更新
      } catch (err) {
        showNotification('インポート処理中にエラーが発生しました', 'error')
        console.error(err)
      } finally {
        isLoading.value = false
      }
    },
    error: (err: any) => {
      showNotification('CSVファイルの解析に失敗しました', 'error')
      console.error(err)
      isLoading.value = false
    }
  })

  // 同じファイルを再度選択できるように値をリセット
  if (csvFileInput.value) csvFileInput.value.value = ''
}

/**
 * 通知を表示する
 * @param message 表示するメッセージ
 * @param type 通知の種類 ('success' or 'error')
 */
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.message = message
  notification.type = type
  notification.show = true
  setTimeout(() => { notification.show = false }, 4000)
}
</script>

<style scoped>
/* 提供されたCSSをベースに、このページ用に調整 */
:root {
  --background-light: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --background-white: #ffffff;
  --radius-lg: 12px;
  --radius-md: 8px;
  --radius-sm: 6px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --primary-color: #4361ee;
  --primary-hover: #3a53c4;
  --border-color: #dee2e6;
  --danger-color: #dc2626;
  --danger-light: #fde2e2;
  --transition: all 0.2s ease-in-out;
}

.page-container { background-color: var(--background-light); min-height: 100vh; padding: 24px; }
.container { max-width: 900px; margin: 0 auto; background-color: var(--background-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; }
.header { background: linear-gradient(135deg, #007bff, #6610f2); color: white; padding: 24px 40px; text-align: center; }
.page-subtitle { font-size: 20px; font-weight: 500; }
.form-content { padding: 40px; }
.form-grid { display: grid; gap: 32px; }

.form-section { background-color: #fcfdff; border-radius: var(--radius-md); padding: 24px; border: 1px solid var(--border-color); }
.section-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.section-description { font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }

/* CSV操作エリア */
.csv-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.file-input { display: none; }
.btn-primary-outline { background-color: transparent; color: var(--primary-color); border: 2px solid var(--primary-color); }
.btn-primary-outline:hover { background-color: var(--primary-color); color: white; }

/* 祝祭日リスト */
.holiday-list { display: flex; flex-direction: column; gap: 12px; }
.holiday-item { display: grid; grid-template-columns: 180px 1fr 60px; gap: 16px; align-items: center; transition: var(--transition); padding: 4px; border-radius: var(--radius-sm); border: 1px solid transparent; }
.holiday-item.header { border-bottom: 2px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px; }
.holiday-item.header .form-label { margin-bottom: 0; }
.holiday-item .form-group { margin-bottom: 0; }
.holiday-item.error { background-color: var(--danger-light); border-color: var(--danger-color); }

.form-label { font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 8px; }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 14px; transition: var(--transition); }
.form-input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2); }

.item-actions { text-align: center; }
.btn-icon { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); padding: 8px; border-radius: 50%; }
.btn-icon:hover { background-color: #e9ecef; color: var(--danger-color); }
.btn-icon .mdi { font-size: 20px; }

.add-row-btn { margin-top: 20px; }
.empty-state { text-align: center; color: var(--text-secondary); padding: 40px 20px; border: 2px dashed var(--border-color); border-radius: var(--radius-md); margin-top: 16px;}
.empty-state .icon { font-size: 48px; margin-bottom: 16px; color: var(--text-light); }

/* フォーム全体のアクション */
.form-actions { display: flex; gap: 16px; justify-content: flex-end; margin-top: 16px; padding-top: 24px; border-top: 1px solid var(--border-color); }
.btn { padding: 12px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; transition: var(--transition); border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
.btn-primary { background-color: var(--primary-color); color: white; }
.btn-primary:hover:not(:disabled) { background-color: var(--primary-hover); }
.btn-primary:disabled { background-color: #adb5bd; cursor: not-allowed; }
.btn-secondary { background-color: #e9ecef; color: var(--text-primary); border: 1px solid var(--border-color); }
.btn-secondary:hover { background-color: #dee2e6; }
.icon { font-size: 16px; line-height: 1; }
.loading-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 通知 */
.notification { position: fixed; top: 80px; right: 24px; background-color: #22c55e; color: white; padding: 16px 24px; border-radius: var(--radius-sm); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 12px; z-index: 1000; }
.notification.error { background-color: var(--danger-color); }
.notification .icon { font-size: 24px; }
.notification-enter-active, .notification-leave-active { transition: all 0.3s ease; }
.notification-enter-from, .notification-leave-to { transform: translateX(100%); opacity: 0; }
</style>