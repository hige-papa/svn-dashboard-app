// composables/useRecurrence.ts

// RFC 5545準拠の繰り返しルール
interface RecurrenceRule {
  id: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  byDay?: number[] // 0=日曜, 1=月曜, ...
  byMonthDay?: number
  bySetPos?: number // 第n週
  until?: string // YYYY-MM-DD
  count?: number
  exceptions?: string[] // 除外日
}

interface RecurringEvent {
  id: string
  masterId: string
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  participantIds?: string[]
  facilityIds?: string[]
  equipmentIds?: string[]
  isException?: boolean
  originalDate?: string
}

export const useRecurrence = () => {
  
  // 繰り返しルールからイベントインスタンスを生成
  const generateRecurringEvents = (
    masterEvent: EventFormData,
    rule: RecurrenceRule,
    startDate: Date,
    endDate: Date
  ): RecurringEvent[] => {
    const events: RecurringEvent[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    
    // 終了条件の設定
    let maxDate = end
    if (rule.until) {
      maxDate = new Date(Math.min(end.getTime(), new Date(rule.until).getTime()))
    }
    
    let count = 0
    const maxCount = rule.count || Number.MAX_SAFE_INTEGER
    
    while (current <= maxDate && count < maxCount) {
      const dateStr = formatDateForDb(current)
      
      // 除外日チェック
      if (!rule.exceptions?.includes(dateStr)) {
        // 条件に合致するかチェック
        if (matchesRecurrencePattern(current, rule)) {
          events.push({
            id: `${masterEvent.title}-${dateStr}`,
            masterId: masterEvent.title, // 実際はmaster event ID
            title: masterEvent.title,
            startDate: dateStr,
            endDate: calculateEndDate(dateStr, masterEvent),
            startTime: masterEvent.startTime,
            endTime: masterEvent.endTime,
            location: masterEvent.location,
            description: masterEvent.description,
            priority: masterEvent.priority,
            participantIds: masterEvent.participantIds,
            facilityIds: masterEvent.facilityIds,
            equipmentIds: masterEvent.equipmentIds,
            isException: false
          })
          count++
        }
      }
      
      // 次の日付へ進む
      current.setDate(current.getDate() + 1)
    }
    
    return events
  }
  
  // パターンマッチング
  const matchesRecurrencePattern = (date: Date, rule: RecurrenceRule): boolean => {
    const ruleStartDate = new Date(rule.id) // 仮で rule.id を開始日とする
    
    switch (rule.frequency) {
      case 'DAILY':
        const daysDiff = Math.floor((date.getTime() - ruleStartDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff >= 0 && daysDiff % rule.interval === 0
        
      case 'WEEKLY':
        const weeksDiff = Math.floor((date.getTime() - ruleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
        const isCorrectWeek = weeksDiff >= 0 && weeksDiff % rule.interval === 0
        const isCorrectDay = rule.byDay?.includes(date.getDay()) ?? true
        return isCorrectWeek && isCorrectDay
        
      case 'MONTHLY':
        const monthsDiff = (date.getFullYear() - ruleStartDate.getFullYear()) * 12 + 
                          (date.getMonth() - ruleStartDate.getMonth())
        const isCorrectMonth = monthsDiff >= 0 && monthsDiff % rule.interval === 0
        
        if (rule.byMonthDay) {
          return isCorrectMonth && date.getDate() === rule.byMonthDay
        }
        
        if (rule.byDay && rule.bySetPos) {
          // 第n週の特定曜日
          return isCorrectMonth && isNthWeekdayOfMonth(date, rule.byDay[0], rule.bySetPos)
        }
        
        return isCorrectMonth && date.getDate() === ruleStartDate.getDate()
        
      case 'YEARLY':
        const yearsDiff = date.getFullYear() - ruleStartDate.getFullYear()
        const isCorrectYear = yearsDiff >= 0 && yearsDiff % rule.interval === 0
        const isSameMonthDay = date.getMonth() === ruleStartDate.getMonth() && 
                              date.getDate() === ruleStartDate.getDate()
        return isCorrectYear && isSameMonthDay
        
      default:
        return false
    }
  }
  
  // 第n週の特定曜日かチェック
  const isNthWeekdayOfMonth = (date: Date, weekday: number, n: number): boolean => {
    if (date.getDay() !== weekday) return false
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstWeekday = firstDay.getDay()
    const firstOccurrence = 1 + (weekday - firstWeekday + 7) % 7
    const nthOccurrence = firstOccurrence + (n - 1) * 7
    
    return date.getDate() === nthOccurrence
  }
  
  // EventFormDataから繰り返しルールを生成
  const createRecurrenceRule = (formData: EventFormData): RecurrenceRule | null => {
    if (formData.dateType !== 'recurring') return null
    
    const rule: RecurrenceRule = {
      id: formData.recurringStartDate,
      frequency: mapPatternToFrequency(formData.recurringPattern),
      interval: 1
    }
    
    // 曜日指定
    if (formData.recurringPattern === 'weekly' && formData.selectedWeekdays.length > 0) {
      rule.byDay = formData.selectedWeekdays
    }
    
    if (formData.recurringPattern === 'weekdays') {
      rule.frequency = 'WEEKLY'
      rule.byDay = [1, 2, 3, 4, 5] // 平日
    }
    
    // 月次パターン
    if (formData.recurringPattern === 'monthly') {
      if (formData.monthlyType === 'date') {
        rule.byMonthDay = formData.monthlyDate
      } else if (formData.monthlyType === 'weekday') {
        rule.byDay = [formData.monthlyWeekday]
        rule.bySetPos = parseInt(formData.monthlyWeek)
      }
    }
    
    // 終了条件
    if (formData.recurringEndType === 'date' && formData.recurringEndDate) {
      rule.until = formData.recurringEndDate
    } else if (formData.recurringEndType === 'count' && formData.recurringCount > 0) {
      rule.count = formData.recurringCount
    }
    
    return rule
  }
  
  // パターンをRFC 5545形式にマッピング
  const mapPatternToFrequency = (pattern: RecurringPattern): RecurrenceRule['frequency'] => {
    switch (pattern) {
      case 'daily':
      case 'weekdays':
        return 'DAILY'
      case 'weekly':
        return 'WEEKLY'
      case 'monthly':
        return 'MONTHLY'
      case 'yearly':
        return 'YEARLY'
      default:
        return 'DAILY'
    }
  }
  
  // 終了日を計算（期間予定の場合）
  const calculateEndDate = (startDate: string, formData: EventFormData): string => {
    if (formData.dateType === 'range') {
      const start = new Date(startDate)
      const originalStart = new Date(formData.startDate)
      const originalEnd = new Date(formData.endDate)
      const duration = originalEnd.getTime() - originalStart.getTime()
      const endDate = new Date(start.getTime() + duration)
      return formatDateForDb(endDate)
    }
    return startDate
  }
  
  // 日付フォーマット
  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // 繰り返し予定の例外処理
  const addException = (masterId: string, exceptionDate: string) => {
    // Firestoreの例外リストに追加
    // 実装は実際のサービス層に依存
  }
  
  const removeException = (masterId: string, exceptionDate: string) => {
    // Firestoreの例外リストから削除
  }
  
  // 特定のインスタンスを変更
  const updateRecurringInstance = (
    masterId: string, 
    instanceDate: string, 
    updateData: Partial<RecurringEvent>
  ) => {
    // 例外として保存し、カスタムデータで上書き
    addException(masterId, instanceDate)
    // カスタムインスタンスを保存
  }
  
  return {
    generateRecurringEvents,
    createRecurrenceRule,
    addException,
    removeException,
    updateRecurringInstance,
    matchesRecurrencePattern
  }
}