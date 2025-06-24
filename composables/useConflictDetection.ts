// composables/useConflictDetection.ts - 完全版
import { ref, computed } from 'vue'
import { useEventService } from '~/services/eventService'
import { useMaster } from '~/composables/master/useMaster'

interface ConflictResult {
  hasConflicts: boolean
  conflicts: EventFormConflict[]
  suggestions: ConflictSuggestion[]
  severity: 'low' | 'medium' | 'high'
}

interface ConflictSuggestion {
  type: 'time' | 'resource' | 'participant'
  suggestion: string
  alternativeSlots?: TimeSlot[]
  alternativeResources?: string[]
}

interface TimeSlot {
  date: string
  startTime: string
  endTime: string
  score: number // 競合の少なさスコア
}

interface ResourceAvailability {
  id: string
  name: string
  type: 'participant' | 'facility' | 'equipment'
  conflicts: ConflictPeriod[]
  availability: AvailabilityPeriod[]
}

interface ConflictPeriod {
  startTime: string
  endTime: string
  eventTitle: string
  severity: 'blocking' | 'warning'
}

interface AvailabilityPeriod {
  startTime: string
  endTime: string
  score: number
}

export const useConflictDetection = () => {
  const { getEventsForConflictCheck } = useEventService()
  const { getListAsync: getUsersAsync } = useMaster('users')
  const { getListAsync: getFacilitiesAsync } = useMaster('facilities')
  const { getListAsync: getEquipmentAsync } = useMaster('equipment')
  
  const conflicts = ref<EventFormConflict[]>([])
  const isCheckingConflicts = ref(false)
  const conflictSuggestions = ref<ConflictSuggestion[]>([])
  
  // メイン競合チェック関数
  const checkConflicts = async (
    formData: EventFormData,
    excludeEventId?: string
  ): Promise<ConflictResult> => {
    isCheckingConflicts.value = true
    conflicts.value = []
    conflictSuggestions.value = []
    
    try {
      // 1. 時間スロットを生成
      const timeSlots = await generateTimeSlots(formData)
      
      // 2. 各時間スロットで競合チェック
      const allConflicts: EventFormConflict[] = []
      
      for (const slot of timeSlots) {
        const slotConflicts = await checkSlotConflicts(
          slot,
          formData,
          excludeEventId
        )
        allConflicts.push(...slotConflicts)
      }
      
      // 3. 重複を除去し、重要度でソート
      const uniqueConflicts = deduplicateConflicts(allConflicts)
      conflicts.value = uniqueConflicts
      
      // 4. 解決案を生成
      if (uniqueConflicts.length > 0) {
        conflictSuggestions.value = await generateSuggestions(formData, uniqueConflicts)
      }
      
      // 5. 重要度を判定
      const severity = calculateSeverity(uniqueConflicts)
      
      return {
        hasConflicts: uniqueConflicts.length > 0,
        conflicts: uniqueConflicts,
        suggestions: conflictSuggestions.value,
        severity
      }
      
    } catch (error) {
      console.error('競合チェックエラー:', error)
      return {
        hasConflicts: false,
        conflicts: [],
        suggestions: [],
        severity: 'low'
      }
    } finally {
      isCheckingConflicts.value = false
    }
  }
  
  // 時間スロット生成（期間・繰り返し対応）
  const generateTimeSlots = async (formData: EventFormData): Promise<TimeSlot[]> => {
    const slots: TimeSlot[] = []
    
    switch (formData.dateType) {
      case 'single':
        if (formData.date) {
          slots.push({
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            score: 1.0
          })
        }
        break
        
      case 'range':
        if (formData.startDate && formData.endDate) {
          const current = new Date(formData.startDate)
          const end = new Date(formData.endDate)
          
          while (current <= end) {
            slots.push({
              date: formatDateForDb(current),
              startTime: formData.startTime,
              endTime: formData.endTime,
              score: 1.0
            })
            current.setDate(current.getDate() + 1)
          }
        }
        break
        
      case 'recurring':
        if (formData.recurringStartDate) {
          const recurringSlots = await generateRecurringSlots(formData)
          slots.push(...recurringSlots)
        }
        break
    }
    
    return slots
  }
  
  // 繰り返し予定のスロット生成
  const generateRecurringSlots = async (formData: EventFormData): Promise<TimeSlot[]> => {
    const slots: TimeSlot[] = []
    const startDate = new Date(formData.recurringStartDate)
    
    // 検索範囲を決定（最大6ヶ月）
    const endDate = new Date(startDate)
    if (formData.recurringEndType === 'date' && formData.recurringEndDate) {
      endDate.setTime(Math.min(
        new Date(formData.recurringEndDate).getTime(),
        startDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000) // 6ヶ月
      ))
    } else {
      endDate.setMonth(endDate.getMonth() + 6)
    }
    
    const current = new Date(startDate)
    let count = 0
    const maxCount = formData.recurringEndType === 'count' ? formData.recurringCount : 200
    
    while (current <= endDate && count < maxCount) {
      if (matchesRecurrencePattern(current, formData)) {
        // 将来の日付ほどスコアを下げる（競合チェックの優先度調整）
        const daysDiff = Math.floor((current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const score = Math.max(0.1, 1.0 - (daysDiff / 180)) // 6ヶ月でスコア0.1まで下降
        
        slots.push({
          date: formatDateForDb(current),
          startTime: formData.startTime,
          endTime: formData.endTime,
          score
        })
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return slots
  }
  
  // 特定スロットでの競合チェック
  const checkSlotConflicts = async (
    slot: TimeSlot,
    formData: EventFormData,
    excludeEventId?: string
  ): Promise<EventFormConflict[]> => {
    const slotConflicts: EventFormConflict[] = []
    
    try {
      // 既存イベントを取得
      const existingEvents = await getEventsForConflictCheck(
        { startDate: slot.date, endDate: slot.date },
        excludeEventId
      )
      
      // 時間が重複するイベントを抽出
      const overlappingEvents = existingEvents.filter(event =>
        isTimeOverlapping(slot.startTime, slot.endTime, event.startTime, event.endTime)
      )
      
      // 参加者の競合チェック
      const participantConflicts = await checkParticipantConflicts(
        formData.participantIds,
        overlappingEvents,
        slot.date
      )
      slotConflicts.push(...participantConflicts)
      
      // 施設の競合チェック
      const facilityConflicts = await checkFacilityConflicts(
        formData.facilityIds,
        overlappingEvents,
        slot.date
      )
      slotConflicts.push(...facilityConflicts)
      
      // 機材の競合チェック（数量管理）
      const equipmentConflicts = await checkEquipmentConflicts(
        formData.equipmentIds,
        overlappingEvents,
        slot.date,
        slot.startTime,
        slot.endTime
      )
      slotConflicts.push(...equipmentConflicts)
      
      // 施設定員チェック
      const capacityConflicts = await checkCapacityConflicts(
        formData.facilityIds,
        formData.participantIds.length,
        slot.date
      )
      slotConflicts.push(...capacityConflicts)
      
    } catch (error) {
      console.error('スロット競合チェックエラー:', error)
    }
    
    return slotConflicts
  }
  
  // 参加者競合チェック（詳細版）
  const checkParticipantConflicts = async (
    participantIds: string[],
    overlappingEvents: any[],
    date: string
  ): Promise<EventFormConflict[]> => {
    const conflicts: EventFormConflict[] = []
    
    try {
      const users = await getUsersAsync()
      const userMap = new Map(users.map(user => [user.uid, user]))
      
      for (const participantId of participantIds) {
        const conflictingEvents = overlappingEvents.filter(event =>
          event.participantIds?.includes(participantId)
        )
        
        for (const event of conflictingEvents) {
          const user = userMap.get(participantId)
          conflicts.push({
            type: 'participant',
            id: participantId,
            name: user?.displayName || user?.name || '不明なユーザー',
            date,
            startTime: event.startTime,
            endTime: event.endTime,
            eventTitle: event.title
          })
        }
      }
    } catch (error) {
      console.error('参加者競合チェックエラー:', error)
    }
    
    return conflicts
  }
  
  // 施設競合チェック（詳細版）
  const checkFacilityConflicts = async (
    facilityIds: string[],
    overlappingEvents: any[],
    date: string
  ): Promise<EventFormConflict[]> => {
    const conflicts: EventFormConflict[] = []
    
    try {
      const facilities = await getFacilitiesAsync()
      const facilityMap = new Map(facilities.map(facility => [facility.id, facility]))
      
      for (const facilityId of facilityIds) {
        const conflictingEvents = overlappingEvents.filter(event =>
          event.facilityIds?.includes(facilityId)
        )
        
        for (const event of conflictingEvents) {
          const facility = facilityMap.get(facilityId)
          conflicts.push({
            type: 'facility',
            id: facilityId,
            name: facility?.name || '不明な施設',
            date,
            startTime: event.startTime,
            endTime: event.endTime,
            eventTitle: event.title
          })
        }
      }
    } catch (error) {
      console.error('施設競合チェックエラー:', error)
    }
    
    return conflicts
  }
  
  // 機材競合チェック（数量管理対応）
  const checkEquipmentConflicts = async (
    equipmentIds: string[],
    overlappingEvents: any[],
    date: string,
    startTime: string,
    endTime: string
  ): Promise<EventFormConflict[]> => {
    const conflicts: EventFormConflict[] = []
    
    try {
      const equipment = await getEquipmentAsync()
      const equipmentMap = new Map(equipment.map(eq => [eq.id, eq]))
      
      for (const equipmentId of equipmentIds) {
        const item = equipmentMap.get(equipmentId)
        if (!item || !item.quantity) continue
        
        // 同時使用数をカウント
        const concurrentUsage = overlappingEvents.reduce((count, event) => {
          const usage = event.equipmentIds?.filter((id: string) => id === equipmentId).length || 0
          return count + usage
        }, 0)
        
        // 在庫不足の場合
        if (concurrentUsage >= item.quantity) {
          conflicts.push({
            type: 'equipment',
            id: equipmentId,
            name: `${item.name} (在庫不足: ${concurrentUsage + 1}/${item.quantity})`,
            date,
            startTime,
            endTime,
            eventTitle: '在庫不足'
          })
        }
      }
    } catch (error) {
      console.error('機材競合チェックエラー:', error)
    }
    
    return conflicts
  }
  
  // 施設定員チェック
  const checkCapacityConflicts = async (
    facilityIds: string[],
    participantCount: number,
    date: string
  ): Promise<EventFormConflict[]> => {
    const conflicts: EventFormConflict[] = []
    
    try {
      const facilities = await getFacilitiesAsync()
      
      for (const facilityId of facilityIds) {
        const facility = facilities.find(f => f.id === facilityId)
        if (facility?.capacity && participantCount > facility.capacity) {
          conflicts.push({
            type: 'facility',
            id: facilityId,
            name: `${facility.name} (定員超過: ${participantCount}/${facility.capacity}名)`,
            date,
            startTime: '00:00',
            endTime: '23:59',
            eventTitle: '定員超過'
          })
        }
      }
    } catch (error) {
      console.error('定員チェックエラー:', error)
    }
    
    return conflicts
  }
  
  // 解決案生成
  const generateSuggestions = async (
    formData: EventFormData,
    conflicts: EventFormConflict[]
  ): Promise<ConflictSuggestion[]> => {
    const suggestions: ConflictSuggestion[] = []
    
    // 1. 時間変更の提案
    const timeSlots = await suggestAlternativeTimeSlots(formData, conflicts)
    if (timeSlots.length > 0) {
      suggestions.push({
        type: 'time',
        suggestion: `他の時間帯での開催を検討してください（${timeSlots.length}件の候補があります）`,
        alternativeSlots: timeSlots.slice(0, 5) // 上位5件
      })
    }
    
    // 2. リソース変更の提案
    const alternativeResources = await suggestAlternativeResources(formData, conflicts)
    if (alternativeResources.length > 0) {
      suggestions.push({
        type: 'resource',
        suggestion: '代替のリソースを使用することを検討してください',
        alternativeResources
      })
    }
    
    // 3. 参加者調整の提案
    const participantConflicts = conflicts.filter(c => c.type === 'participant')
    if (participantConflicts.length > 0) {
      suggestions.push({
        type: 'participant',
        suggestion: `${participantConflicts.length}名の参加者に競合があります。参加者の調整を検討してください。`
      })
    }
    
    return suggestions
  }
  
  // 代替時間スロット提案
  const suggestAlternativeTimeSlots = async (
    formData: EventFormData,
    conflicts: EventFormConflict[]
  ): Promise<TimeSlot[]> => {
    const suggestions: TimeSlot[] = []
    const conflictDates = [...new Set(conflicts.map(c => c.date))]
    
    const originalDuration = calculateDuration(formData.startTime, formData.endTime)
    
    for (const date of conflictDates) {
      // 1時間前/後の時間帯を提案
      const alternatives = [
        shiftTime(formData.startTime, -60), // 1時間前
        shiftTime(formData.startTime, 60),  // 1時間後
        shiftTime(formData.startTime, -30), // 30分前
        shiftTime(formData.startTime, 30)   // 30分後
      ]
      
      for (const startTime of alternatives) {
        const endTime = addMinutes(startTime, originalDuration)
        
        if (isValidTimeSlot(startTime, endTime)) {
          // この時間帯での競合をチェック
          const score = await calculateTimeSlotScore(
            date,
            startTime,
            endTime,
            formData
          )
          
          if (score > 0.5) { // 50%以上のスコアで提案
            suggestions.push({
              date,
              startTime,
              endTime,
              score
            })
          }
        }
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }
  
  // 代替リソース提案
  const suggestAlternativeResources = async (
    formData: EventFormData,
    conflicts: EventFormConflict[]
  ): Promise<string[]> => {
    const suggestions: string[] = []
    
    // 施設の代替案
    const facilityConflicts = conflicts.filter(c => c.type === 'facility')
    if (facilityConflicts.length > 0) {
      const facilities = await getFacilitiesAsync()
      const availableFacilities = facilities.filter(facility => 
        !formData.facilityIds.includes(facility.id) &&
        (!facility.capacity || formData.participantIds.length <= facility.capacity)
      )
      
      suggestions.push(
        ...availableFacilities
          .slice(0, 3)
          .map(f => `施設: ${f.name}`)
      )
    }
    
    // 機材の代替案
    const equipmentConflicts = conflicts.filter(c => c.type === 'equipment')
    if (equipmentConflicts.length > 0) {
      const equipment = await getEquipmentAsync()
      const similarEquipment = equipment.filter(eq => 
        !formData.equipmentIds.includes(eq.id) &&
        eq.quantity && eq.quantity > 0
      )
      
      suggestions.push(
        ...similarEquipment
          .slice(0, 3)
          .map(eq => `機材: ${eq.name}`)
      )
    }
    
    return suggestions
  }
  
  // ヘルパー関数
  const deduplicateConflicts = (conflicts: EventFormConflict[]): EventFormConflict[] => {
    const seen = new Set<string>()
    return conflicts.filter(conflict => {
      const key = `${conflict.type}-${conflict.id}-${conflict.date}-${conflict.startTime}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  const calculateSeverity = (conflicts: EventFormConflict[]): 'low' | 'medium' | 'high' => {
    const participantConflicts = conflicts.filter(c => c.type === 'participant').length
    const facilityConflicts = conflicts.filter(c => c.type === 'facility').length
    const equipmentConflicts = conflicts.filter(c => c.type === 'equipment').length
    
    const totalConflicts = conflicts.length
    
    if (totalConflicts === 0) return 'low'
    if (totalConflicts >= 5 || facilityConflicts >= 2) return 'high'
    if (totalConflicts >= 2 || participantConflicts >= 2) return 'medium'
    return 'low'
  }
  
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
  
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
  
  const calculateDuration = (startTime: string, endTime: string): number => {
    return timeToMinutes(endTime) - timeToMinutes(startTime)
  }
  
  const shiftTime = (timeStr: string, minutes: number): string => {
    const totalMinutes = timeToMinutes(timeStr) + minutes
    return minutesToTime(Math.max(0, Math.min(1440, totalMinutes)))
  }
  
  const addMinutes = (timeStr: string, minutes: number): string => {
    const totalMinutes = timeToMinutes(timeStr) + minutes
    return minutesToTime(Math.min(1440, totalMinutes))
  }
  
  const isValidTimeSlot = (startTime: string, endTime: string): boolean => {
    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)
    
    // 営業時間内（8:00-20:00）かチェック
    return start >= 8 * 60 && end <= 20 * 60 && start < end
  }
  
  const calculateTimeSlotScore = async (
    date: string,
    startTime: string,
    endTime: string,
    formData: EventFormData
  ): Promise<number> => {
    try {
      // その時間帯での競合数を取得
      const events = await getEventsForConflictCheck({ startDate: date, endDate: date })
      const overlapping = events.filter(event =>
        isTimeOverlapping(startTime, endTime, event.startTime, event.endTime)
      )
      
      // 基本スコア（競合が少ないほど高い）
      let score = Math.max(0, 1.0 - (overlapping.length * 0.2))
      
      // 時間帯による調整（午前中は高スコア）
      const hour = parseInt(startTime.split(':')[0])
      if (hour >= 9 && hour <= 11) score += 0.2 // 午前中ボーナス
      if (hour >= 13 && hour <= 15) score += 0.1 // 午後前半ボーナス
      if (hour >= 17) score -= 0.1 // 夕方ペナルティ
      
      return Math.max(0, Math.min(1, score))
    } catch (error) {
      return 0.5 // エラー時はデフォルトスコア
    }
  }
  
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
  
  return {
    // 状態
    conflicts: readonly(conflicts),
    isCheckingConflicts: readonly(isCheckingConflicts),
    conflictSuggestions: readonly(conflictSuggestions),
    
    // メソッド
    checkConflicts,
    generateTimeSlots,
    generateSuggestions,
    
    // 計算プロパティ
    hasConflicts: computed(() => conflicts.value.length > 0),
    conflictCount: computed(() => conflicts.value.length),
    severityLevel: computed(() => calculateSeverity(conflicts.value))
  }
}