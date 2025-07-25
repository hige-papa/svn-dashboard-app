// composables/useEventForm.ts
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useEventService } from '~/services/eventService'

interface ConflictCheckParams {
  formData: EventFormData
  existingEvents: Array<{
    id: string
    title: string
    date: string
    startTime: string
    endTime: string
    participantIds?: string[]
    facilityIds?: string[]
    equipmentIds?: string[]
  }>
  excludeEventId?: string
}

export const useEventForm = (initialData?: EventFormData) => {
  const { createEvent } = useEventService()
  
  // フォームデータ
  const formData = reactive<EventFormData>({
    title: '',
    dateType: 'single',
    date: '',
    startDate: '',
    endDate: '',
    recurringStartDate: '',
    recurringPattern: 'weekly',
    selectedWeekdays: [],
    monthlyType: 'date',
    monthlyDate: 1,
    monthlyWeek: '1',
    monthlyWeekday: 1,
    recurringEndType: 'never',
    recurringEndDate: '',
    recurringCount: 10,
    startTime: '',
    endTime: '',
    location: '',
    participantIds: [],
    participants: [],
    facilityIds: [],
    equipmentIds: [],
    priority: 'low',
    description: '',
    equipments: [],
    facilities: [],
    eventType: 'normal',
    eventTypeName: '',
    eventTypeColor: '',
    private: false
  })

  // 状態管理
  const errors = reactive<any>({})
  const conflicts = ref<any[]>([])
  const isLoading = ref(false)
  const isCheckingConflicts = ref(false)

  // 通知
  const notification = reactive({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  })

  // デフォルト値設定
  const setDefaultValues = (data?: EventFormData) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // 現在時刻から1時間後を開始時間に設定
    const startTime = new Date(now.getTime() + 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    
    Object.assign(formData, {
      title: data?.title || '',
      dateType: data?.dateType || 'single',
      date: data?.date || today,
      startDate: data?.startDate || today,
      endDate: data?.endDate || today,
      recurringStartDate: data?.recurringStartDate || today,
      recurringPattern: data?.recurringPattern || 'weekly',
      selectedWeekdays: data?.selectedWeekdays || [],
      monthlyType: data?.monthlyType || 'date',
      monthlyDate: data?.monthlyDate || 1,
      monthlyWeek: data?.monthlyWeek || '1',
      monthlyWeekday: data?.monthlyWeekday || 1,
      recurringEndType: data?.recurringEndType || 'never',
      recurringEndDate: data?.recurringEndDate || '',
      recurringCount: data?.recurringCount || 10,
      startTime: data?.startTime || startTime.toTimeString().slice(0, 5),
      endTime: data?.endTime || endTime.toTimeString().slice(0, 5),
      location: data?.location || '',
      participantIds: data?.participantIds || [],
      participants: data?.participants || [],
      facilityIds: data?.facilityIds || [],
      equipmentIds: data?.equipmentIds || [],
      priority: data?.priority || 'low',
      description: data?.description || ''
    })

    // 繰り返しの終了日を3ヶ月後に設定
    if (!data?.recurringEndDate) {
      const threeMonthsLater = new Date(now)
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
      formData.recurringEndDate = threeMonthsLater.toISOString().split('T')[0]
    }
  }

  // バリデーション
  const validateField = (fieldName: keyof any) => {
    switch (fieldName) {
      case 'eventTitle':
        if (!formData.title.trim()) {
          errors.eventTitle = '予定タイトルを入力してください'
        }
        break
        
      case 'eventDate':
        if (!formData.date) {
          errors.eventDate = '日付を選択してください'
        }
        break
        
      case 'startDate':
        if (!formData.startDate) {
          errors.startDate = '開始日を選択してください'
        }
        break
        
      case 'endDate':
        if (!formData.endDate) {
          errors.endDate = '終了日を選択してください'
        } else if (formData.startDate && formData.endDate < formData.startDate) {
          errors.endDate = '終了日は開始日以降を選択してください'
        }
        break
        
      case 'recurringStartDate':
        if (!formData.recurringStartDate) {
          errors.recurringStartDate = '開始日を選択してください'
        }
        break
        
      case 'time':
        if (!formData.startTime || !formData.endTime) {
          errors.time = '開始時間と終了時間を入力してください'
        } else if (formData.startTime >= formData.endTime) {
          errors.time = '終了時間は開始時間より後に設定してください'
        }
        break
    }
  }

  const validateForm = (): boolean => {
    // エラーをクリア
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof any]
    })

    // 必須フィールドチェック
    validateField('eventTitle')
    
    // 日付タイプに応じたバリデーション
    switch (formData.dateType) {
      case 'single':
        validateField('eventDate')
        break
      case 'range':
        validateField('startDate')
        validateField('endDate')
        break
      case 'recurring':
        validateField('recurringStartDate')
        
        // 週単位の場合、曜日が選択されているかチェック
        if (formData.recurringPattern === 'weekly' && formData.selectedWeekdays.length === 0) {
          showNotification('曜日を選択してください', 'error')
          return false
        }
        break
    }
    
    validateField('time')
    
    return Object.keys(errors).length === 0
  }

  const clearError = (fieldName: keyof any) => {
    if (errors[fieldName]) {
      delete errors[fieldName]
    }
  }

  // 競合チェック
  const checkConflicts = async () => {
    if (isCheckingConflicts.value) return
    
    try {
      isCheckingConflicts.value = true
      await nextTick()
      
      // 日付範囲を取得
      const dateRange = getDateRangeForConflictCheck()
      if (!dateRange) {
        conflicts.value = []
        return
      }

      // // 既存イベントを取得
      // const existingEvents = await getEventsForConflictCheck(dateRange)
      
      // // 競合チェック実行
      // const foundConflicts = await performConflictCheck({
      //   formData,
      //   existingEvents
      // })
      
      // conflicts.value = foundConflicts
      
    } catch (error) {
      console.error('競合チェックエラー:', error)
      conflicts.value = []
    } finally {
      isCheckingConflicts.value = false
    }
  }

  // 競合チェック用の日付範囲取得
  const getDateRangeForConflictCheck = (): { startDate: string; endDate: string } | null => {
    switch (formData.dateType) {
      case 'single':
        if (!formData.date) return null
        return { startDate: formData.date, endDate: formData.date }
        
      case 'range':
        if (!formData.startDate || !formData.endDate) return null
        return { startDate: formData.startDate, endDate: formData.endDate }
        
      case 'recurring':
        if (!formData.recurringStartDate) return null
        // 繰り返し予定は3ヶ月先まで確認
        const endDate = new Date(formData.recurringStartDate)
        endDate.setMonth(endDate.getMonth() + 3)
        return { 
          startDate: formData.recurringStartDate, 
          endDate: endDate.toISOString().split('T')[0] 
        }
        
      default:
        return null
    }
  }

  // 実際の競合チェック処理
  const performConflictCheck = async (params: ConflictCheckParams): Promise<any[]> => {
    const foundConflicts: any[] = []
    const timeSlots = generateTimeSlots(params.formData)
    
    for (const slot of timeSlots) {
      const slotConflicts = checkConflictsForTimeSlot(
        slot,
        params.formData,
        params.existingEvents,
        params.excludeEventId
      )
      foundConflicts.push(...slotConflicts)
    }
    
    return foundConflicts
  }

  // 時間スロット生成
  const generateTimeSlots = (data: EventFormData): Array<{
    date: string
    startTime: string
    endTime: string
  }> => {
    const slots: Array<{ date: string; startTime: string; endTime: string }> = []
    
    switch (data.dateType) {
      case 'single':
        if (data.date) {
          slots.push({
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime
          })
        }
        break
        
      case 'range':
        if (data.startDate && data.endDate) {
          const current = new Date(data.startDate)
          const end = new Date(data.endDate)
          
          while (current <= end) {
            slots.push({
              date: formatDateForDb(current),
              startTime: data.startTime,
              endTime: data.endTime
            })
            current.setDate(current.getDate() + 1)
          }
        }
        break
        
      case 'recurring':
        if (data.recurringStartDate) {
          const recurringSlots = generateRecurringTimeSlots(data)
          slots.push(...recurringSlots)
        }
        break
    }
    
    return slots
  }

  // 繰り返し時間スロット生成（簡易版）
  const generateRecurringTimeSlots = (data: EventFormData): Array<{
    date: string
    startTime: string
    endTime: string
  }> => {
    const slots: Array<{ date: string; startTime: string; endTime: string }> = []
    const startDate = new Date(data.recurringStartDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 3) // 3ヶ月先まで
    
    const current = new Date(startDate)
    
    while (current <= endDate) {
      if (matchesRecurrencePattern(current, data)) {
        slots.push({
          date: formatDateForDb(current),
          startTime: data.startTime,
          endTime: data.endTime
        })
      }
      current.setDate(current.getDate() + 1)
    }
    
    return slots
  }

  // 繰り返しパターンマッチング
  const matchesRecurrencePattern = (date: Date, data: EventFormData): boolean => {
    const startDate = new Date(data.recurringStartDate)
    
    switch (data.recurringPattern) {
      case 'daily':
        return true
        
      case 'weekly':
        if (data.selectedWeekdays.length > 0) {
          return data.selectedWeekdays.includes(date.getDay())
        }
        return date.getDay() === startDate.getDay()
        
      case 'weekdays':
        const day = date.getDay()
        return day >= 1 && day <= 5
        
      case 'monthly':
        if (data.monthlyType === 'date') {
          return date.getDate() === data.monthlyDate
        } else if (data.monthlyType === 'weekday') {
          return isNthWeekdayOfMonth(date, data.monthlyWeekday, parseInt(data.monthlyWeek))
        }
        return date.getDate() === startDate.getDate()
        
      case 'yearly':
        return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate()
        
      default:
        return false
    }
  }

  // 特定時間スロットでの競合チェック
  const checkConflictsForTimeSlot = (
    slot: { date: string; startTime: string; endTime: string },
    data: EventFormData,
    existingEvents: Array<{
      id: string
      title: string
      date: string
      startTime: string
      endTime: string
      participantIds?: string[]
      facilityIds?: string[]
      equipmentIds?: string[]
    }>,
    excludeEventId?: string
  ): any[] => {
    const slotConflicts: any[] = []
    
    // 同日の既存イベントをフィルタ
    const eventsOnDate = existingEvents.filter(event => 
      event.date === slot.date && event.id !== excludeEventId
    )
    
    for (const event of eventsOnDate) {
      // 時間の重複チェック
      if (isTimeOverlapping(slot.startTime, slot.endTime, event.startTime, event.endTime)) {
        
        // 参加者の競合チェック
        for (const participantId of data.participantIds) {
          if (event.participantIds?.includes(participantId)) {
            slotConflicts.push({
              type: 'participant',
              id: participantId,
              name: `参加者 ${participantId}`, // 実際は名前をマスタから取得
              date: slot.date,
              startTime: event.startTime,
              endTime: event.endTime,
              eventTitle: event.title
            })
          }
        }
        
        // 施設の競合チェック
        for (const facilityId of data.facilityIds) {
          if (event.facilityIds?.includes(facilityId)) {
            slotConflicts.push({
              type: 'facility',
              id: facilityId,
              name: `施設 ${facilityId}`,
              date: slot.date,
              startTime: event.startTime,
              endTime: event.endTime,
              eventTitle: event.title
            })
          }
        }
        
        // 備品の競合チェック
        for (const equipmentId of data.equipmentIds) {
          if (event.equipmentIds?.includes(equipmentId)) {
            slotConflicts.push({
              type: 'equipment',
              id: equipmentId,
              name: `備品 ${equipmentId}`,
              date: slot.date,
              startTime: event.startTime,
              endTime: event.endTime,
              eventTitle: event.title
            })
          }
        }
      }
    }
    
    return slotConflicts
  }

  // 時間重複チェック
  const isTimeOverlapping = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const startTime1 = timeToMinutes(start1)
    const endTime1 = timeToMinutes(end1)
    const startTime2 = timeToMinutes(start2)
    const endTime2 = timeToMinutes(end2)
    
    return startTime1 < endTime2 && startTime2 < endTime1
  }

  // イベント保存
  const saveEvent = async (): Promise<boolean> => {
    if (!validateForm()) {
      showNotification('入力内容を確認してください', 'error')
      return false
    }
    
    // 重複がある場合の確認
    if (conflicts.value.length > 0) {
      const confirmMessage = `${conflicts.value.length}件の重複があります。このまま保存しますか？`
      if (!confirm(confirmMessage)) {
        return false
      }
    }
    
    isLoading.value = true
    
    try {
      const eventId = await createEvent(formData)
      showNotification('予定が正常に保存されました！')
      return true
      
    } catch (error) {
      console.error('保存エラー:', error)
      showNotification('保存に失敗しました', 'error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 通知表示
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    notification.message = message
    notification.type = type
    notification.show = true
    
    setTimeout(() => {
      notification.show = false
    }, 3000)
  }

  // 競合クリア
  const clearConflicts = () => {
    conflicts.value = []
  }

  // フォームリセット
  const resetForm = () => {
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof any]
    })
    
    conflicts.value = []
    setDefaultValues()
  }

  // ヘルパー関数
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
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

  // 自動競合チェック
  watch([
    () => formData.dateType,
    () => formData.date,
    () => formData.startDate,
    () => formData.endDate,
    () => formData.recurringStartDate,
    () => formData.startTime,
    () => formData.endTime,
    () => formData.participantIds,
    () => formData.facilityIds,
    () => formData.equipmentIds,
    () => formData.recurringPattern,
    () => formData.selectedWeekdays
  ], () => {
    checkConflicts()
  }, { deep: true })

  // 初期化
  setDefaultValues(initialData)

  return {
    // データ
    formData: readonly(formData),
    errors: readonly(errors),
    conflicts: readonly(conflicts),
    notification: readonly(notification),
    
    // 状態
    isLoading: readonly(isLoading),
    isCheckingConflicts: readonly(isCheckingConflicts),
    
    // メソッド
    validateField,
    validateForm,
    clearError,
    checkConflicts,
    clearConflicts,
    saveEvent,
    showNotification,
    resetForm,
    setDefaultValues,
    
    // 計算プロパティ
    isValid: computed(() => Object.keys(errors).length === 0),
    hasConflicts: computed(() => conflicts.value.length > 0)
  }
}