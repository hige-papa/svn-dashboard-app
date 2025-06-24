// services/eventService.ts
import { useFirestore } from '~/composables/firebase/useFirestore'
import { useFirestoreGeneral } from '~/composables/firebase/useFirestoreGeneral'
import { where, orderBy, Timestamp } from 'firebase/firestore'

// 既存の型に合わせて拡張
interface EventData {
  id?: string
  title: string
  dateType: 'single' | 'range' | 'recurring'
  
  // 日付情報
  date?: string // 単一日用
  startDate?: string // 期間・繰り返し開始日
  endDate?: string // 期間終了日
  
  // 時間情報
  startTime: string
  endTime: string
  allDay?: boolean
  
  // 繰り返し情報
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays'
  selectedWeekdays?: number[]
  monthlyType?: 'date' | 'weekday'
  monthlyDate?: number
  monthlyWeek?: string
  monthlyWeekday?: number
  recurringEndType?: 'never' | 'date' | 'count'
  recurringEndDate?: string
  recurringCount?: number
  
  // その他の情報
  location?: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  participantIds?: string[]
  facilityIds?: string[]
  equipmentIds?: string[]
  
  // システム情報
  createdBy?: string
  createdAt?: any
  updatedAt?: any
}

interface RecurrenceRule {
  id?: string
  masterId: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  byDay?: number[]
  byMonthDay?: number
  bySetPos?: number
  until?: string
  count?: number
  exceptions?: string[]
  createdAt?: any
  updatedAt?: any
}

interface EventInstance {
  id?: string
  masterId: string
  instanceDate: string
  originalDate?: string
  isException: boolean
  isModified: boolean
  
  // オーバーライド可能フィールド
  title?: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
  participantIds?: string[]
  facilityIds?: string[]
  equipmentIds?: string[]
  
  status: 'active' | 'cancelled' | 'deleted'
  createdAt?: any
  updatedAt?: any
}

export const useEventService = () => {
  const { 
    addWithBatch, 
    updateWithBatch, 
    deleteWithBatch,
    getCollectionAsync,
    getDocAsync
  } = useFirestore()
  
  const eventsService = useFirestoreGeneral('events')
  const rulesService = useFirestoreGeneral('recurrence_rules')
  const instancesService = useFirestoreGeneral('event_instances')

  // イベント作成（期間・繰り返し対応）
  const createEvent = async (formData: EventFormData): Promise<string> => {
    try {
      const eventData: EventData = {
        title: formData.title,
        dateType: formData.dateType,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        description: formData.description,
        priority: formData.priority,
        participantIds: formData.participantIds,
        facilityIds: formData.facilityIds,
        equipmentIds: formData.equipmentIds,
        createdBy: 'current-user', // 実際はauthから取得
      }

      // 日付タイプに応じた処理
      switch (formData.dateType) {
        case 'single':
          eventData.date = formData.date
          break
          
        case 'range':
          eventData.startDate = formData.startDate
          eventData.endDate = formData.endDate
          break
          
        case 'recurring':
          eventData.startDate = formData.recurringStartDate
          eventData.recurringPattern = formData.recurringPattern
          eventData.selectedWeekdays = formData.selectedWeekdays
          eventData.monthlyType = formData.monthlyType
          eventData.monthlyDate = formData.monthlyDate
          eventData.monthlyWeek = formData.monthlyWeek
          eventData.monthlyWeekday = formData.monthlyWeekday
          eventData.recurringEndType = formData.recurringEndType
          eventData.recurringEndDate = formData.recurringEndDate
          eventData.recurringCount = formData.recurringCount
          break
      }

      // マスターイベントを作成
      const masterEvent = await eventsService.addAsync(eventData)
      
      if (!masterEvent?.id) {
        throw new Error('マスターイベントの作成に失敗しました')
      }

      // 繰り返し予定の場合、ルールとインスタンスを作成
      if (formData.dateType === 'recurring') {
        const rule = await createRecurrenceRule(masterEvent.id, formData)
        if (rule?.id) {
          // 初期インスタンス生成（3ヶ月分）
          await generateInitialInstances(masterEvent.id, formData, 3)
        }
      }

      return masterEvent.id

    } catch (error) {
      console.error('イベント作成エラー:', error)
      throw error
    }
  }

  // 繰り返しルールの作成
  const createRecurrenceRule = async (
    masterId: string, 
    formData: EventFormData
  ): Promise<RecurrenceRule | null> => {
    if (formData.dateType !== 'recurring') return null

    const rule: RecurrenceRule = {
      masterId,
      frequency: mapPatternToFrequency(formData.recurringPattern),
      interval: 1,
      exceptions: []
    }

    // パターンに応じた設定
    switch (formData.recurringPattern) {
      case 'weekly':
        if (formData.selectedWeekdays.length > 0) {
          rule.byDay = formData.selectedWeekdays
        }
        break
        
      case 'weekdays':
        rule.frequency = 'WEEKLY'
        rule.byDay = [1, 2, 3, 4, 5] // 月-金
        break
        
      case 'monthly':
        if (formData.monthlyType === 'date') {
          rule.byMonthDay = formData.monthlyDate
        } else if (formData.monthlyType === 'weekday') {
          rule.byDay = [formData.monthlyWeekday]
          rule.bySetPos = parseInt(formData.monthlyWeek)
        }
        break
    }

    // 終了条件
    if (formData.recurringEndType === 'date' && formData.recurringEndDate) {
      rule.until = formData.recurringEndDate
    } else if (formData.recurringEndType === 'count' && formData.recurringCount > 0) {
      rule.count = formData.recurringCount
    }

    return await rulesService.addAsync(rule)
  }

  // 初期インスタンス生成
  const generateInitialInstances = async (
    masterId: string,
    formData: EventFormData,
    months: number = 3
  ): Promise<void> => {
    const startDate = new Date(formData.recurringStartDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months)

    const instances = generateRecurringDates(formData, startDate, endDate)
    
    const batchActions = instances.map(date => {
      const instance: EventInstance = {
        masterId,
        instanceDate: date,
        isException: false,
        isModified: false,
        status: 'active'
      }
      return { entity: instance, reference: null } // 実際の参照は内部で生成
    })

    // バッチで一括作成
    for (const instance of instances) {
      await instancesService.addAsync({
        masterId,
        instanceDate: instance,
        isException: false,
        isModified: false,
        status: 'active'
      })
    }
  }

  // 繰り返し日付生成
  const generateRecurringDates = (
    formData: EventFormData,
    startDate: Date,
    endDate: Date
  ): string[] => {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    
    // 終了条件の設定
    let maxDate = end
    if (formData.recurringEndType === 'date' && formData.recurringEndDate) {
      maxDate = new Date(Math.min(end.getTime(), new Date(formData.recurringEndDate).getTime()))
    }
    
    let count = 0
    const maxCount = formData.recurringEndType === 'count' ? formData.recurringCount : Number.MAX_SAFE_INTEGER

    while (current <= maxDate && count < maxCount) {
      if (matchesRecurrencePattern(current, formData)) {
        dates.push(formatDateForDb(current))
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  // パターンマッチング
  const matchesRecurrencePattern = (date: Date, formData: EventFormData): boolean => {
    const startDate = new Date(formData.recurringStartDate)
    
    switch (formData.recurringPattern) {
      case 'daily':
        return true
        
      case 'weekly':
        if (formData.selectedWeekdays.length > 0) {
          return formData.selectedWeekdays.includes(date.getDay())
        }
        return date.getDay() === startDate.getDay()
        
      case 'weekdays':
        const day = date.getDay()
        return day >= 1 && day <= 5
        
      case 'monthly':
        if (formData.monthlyType === 'date') {
          return date.getDate() === formData.monthlyDate
        } else if (formData.monthlyType === 'weekday') {
          return isNthWeekdayOfMonth(date, formData.monthlyWeekday, parseInt(formData.monthlyWeek))
        }
        return date.getDate() === startDate.getDate()
        
      case 'yearly':
        return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate()
        
      default:
        return false
    }
  }

  // 期間内のイベント取得
  const getEventsInRange = async (startDate: string, endDate: string): Promise<Event[]> => {
    const events: Event[] = []

    try {
      // 1. 単一・期間予定の取得
      const singleEvents = await eventsService.getListAsync()
      
      for (const eventData of singleEvents) {
        if (eventData.dateType === 'single') {
          if (eventData.date >= startDate && eventData.date <= endDate) {
            events.push(convertToEvent(eventData))
          }
        } else if (eventData.dateType === 'range') {
          const eventEndDate = eventData.endDate || eventData.startDate
          if (eventData.startDate <= endDate && eventEndDate >= startDate) {
            // 期間内の各日付でイベントを展開
            const rangeDates = getDateRangeArray(
              Math.max(eventData.startDate, startDate),
              Math.min(eventEndDate, endDate)
            )
            
            rangeDates.forEach(date => {
              events.push({
                ...convertToEvent(eventData),
                id: `${eventData.id}-${date}`,
                date
              })
            })
          }
        }
      }

      // 2. 繰り返し予定のインスタンス取得
      const instances = await instancesService.getListAsync()
      
      for (const instance of instances) {
        if (instance.instanceDate >= startDate && 
            instance.instanceDate <= endDate && 
            instance.status === 'active') {
          
          // マスターイベントを取得
          const masterEvent = await eventsService.getAsync(instance.masterId)
          if (masterEvent) {
            events.push(mergeInstanceWithMaster(instance, masterEvent))
          }
        }
      }

      // 3. 未生成の繰り返し予定を動的生成
      await generateMissingRecurringEvents(startDate, endDate, events)

      return events.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })

    } catch (error) {
      console.error('イベント取得エラー:', error)
      throw error
    }
  }

  // 競合チェック用のイベント取得
  const getEventsForConflictCheck = async (
    dateRange: { startDate: string; endDate: string },
    excludeEventId?: string
  ) => {
    const events = await getEventsInRange(dateRange.startDate, dateRange.endDate)
    
    return events
      .filter(event => event.id !== excludeEventId)
      .map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        participantIds: event.participantIds || [],
        facilityIds: event.facilityIds || [],
        equipmentIds: event.equipmentIds || []
      }))
  }

  // 繰り返し予定の例外処理
  const addRecurrenceException = async (
    masterId: string,
    instanceDate: string,
    action: 'delete' | 'modify',
    modifyData?: Partial<EventFormData>
  ): Promise<void> => {
    try {
      // 繰り返しルールに例外を追加
      const rules = await rulesService.getListAsync()
      const rule = rules.find(r => r.masterId === masterId)
      
      if (rule) {
        const exceptions = [...(rule.exceptions || []), instanceDate]
        await rulesService.updateAsync(rule.id, { exceptions })
      }

      // 修正の場合、カスタムインスタンスを作成
      if (action === 'modify' && modifyData) {
        const customInstance: EventInstance = {
          masterId,
          instanceDate,
          title: modifyData.title,
          startTime: modifyData.startTime,
          endTime: modifyData.endTime,
          location: modifyData.location,
          description: modifyData.description,
          participantIds: modifyData.participantIds,
          facilityIds: modifyData.facilityIds,
          equipmentIds: modifyData.equipmentIds,
          isException: true,
          isModified: true,
          status: 'active'
        }
        
        await instancesService.addAsync(customInstance)
      }

    } catch (error) {
      console.error('例外処理エラー:', error)
      throw error
    }
  }

  // ヘルパー関数
  const mapPatternToFrequency = (pattern: string): RecurrenceRule['frequency'] => {
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

  const isNthWeekdayOfMonth = (date: Date, weekday: number, n: number): boolean => {
    if (date.getDay() !== weekday) return false
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstWeekday = firstDay.getDay()
    const firstOccurrence = 1 + (weekday - firstWeekday + 7) % 7
    const nthOccurrence = firstOccurrence + (n - 1) * 7
    
    return date.getDate() === nthOccurrence
  }

  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateRangeArray = (startDate: string, endDate: string): string[] => {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    
    while (current <= end) {
      dates.push(formatDateForDb(current))
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  const convertToEvent = (eventData: any): Event => {
    return {
      id: eventData.id,
      title: eventData.title,
      date: eventData.date || eventData.startDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location,
      description: eventData.description,
      priority: eventData.priority,
      participantIds: eventData.participantIds || [],
      facilityIds: eventData.facilityIds || [],
      equipmentIds: eventData.equipmentIds || []
    }
  }

  const mergeInstanceWithMaster = (instance: EventInstance, masterEvent: any): Event => {
    return {
      id: instance.id,
      title: instance.title || masterEvent.title,
      date: instance.instanceDate,
      startTime: instance.startTime || masterEvent.startTime,
      endTime: instance.endTime || masterEvent.endTime,
      location: instance.location || masterEvent.location,
      description: instance.description || masterEvent.description,
      priority: masterEvent.priority,
      participantIds: instance.participantIds || masterEvent.participantIds || [],
      facilityIds: instance.facilityIds || masterEvent.facilityIds || [],
      equipmentIds: instance.equipmentIds || masterEvent.equipmentIds || []
    }
  }

  const generateMissingRecurringEvents = async (
    startDate: string,
    endDate: string,
    existingEvents: Event[]
  ): Promise<void> => {
    // 実装省略（複雑なロジックのため）
    // 既存インスタンスにない繰り返し予定を動的生成
  }

  return {
    createEvent,
    getEventsInRange,
    getEventsForConflictCheck,
    addRecurrenceException,
    generateRecurringDates,
    matchesRecurrencePattern
  }
}