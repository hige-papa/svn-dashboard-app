// composables/useCalendar.ts - 更新版
import { ref, computed } from 'vue'
import { useEventService } from '~/services/eventService'
import { useMaster } from '~/composables/master/useMaster'
import { where } from 'firebase/firestore'

const { getListAsync: getHolidaysListAsync } = useMaster('holidays')
const { getListAsync: getUsersListAsync } = useMaster('users')

// 日付範囲の型定義
interface DateRange {
  startDate: string
  endDate: string
}

// Event型の定義（拡張版）
interface Event {
  id: string
  title: string
  date: string // YYYY-MM-DD形式
  endDate?: string // 期間予定の場合
  startTime: string
  endTime: string
  userId?: string
  location?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  participantIds?: string[]
  facilityIds?: string[]
  equipmentIds?: string[]
  isRecurring?: boolean // 繰り返し予定かどうか
  masterId?: string // 繰り返し予定の場合のマスターID
}

// User型の拡張（表示制御用）
interface UserWithVisibility extends ExtendedUserProfile {
  visible: boolean
}

// カレンダー日の型定義
interface CalendarDay {
  date: Date
  currentMonth: boolean
}

// カレンダービューの型定義
type CalendarView = 'daily' | 'weekly' | 'monthly'

// useCalendarの戻り値の型定義
interface UseCalendarReturn {
  currentDate: Ref<Date>
  selectedDate: Ref<Date | null>
  currentView: Ref<CalendarView>
  users: Ref<UserWithVisibility[]>
  events: Ref<Event[]>
  holidays: Ref<Holiday[]>
  isLoading: Ref<boolean>
  getDayOfWeek: (date: Date) => string
  formatDate: (date: Date | null) => string
  formatShortDate: (date: Date | null) => string
  timeToPixels: (timeStr: string) => number
  getSchedulesForDay: (date: Date | null) => Promise<Event[]>
  getUserSchedulesForDay: (userId: string, date: Date | null) => Promise<Event[]>
  previousDay: () => void
  nextDay: () => void
  previousWeek: () => void
  nextWeek: () => void
  previousMonth: () => void
  nextMonth: () => void
  goToToday: () => void
  selectDay: (date: Date) => void
  generateCalendarDays: ComputedRef<CalendarDay[]>
  generateWeekDays: ComputedRef<Date[]>
  timeSlots: ComputedRef<string[]>
  isHoliday: (date: Date) => boolean
  getHolidayName: (date: Date) => string
  toggleUserVisibility: (userId: string) => void
  loadData: () => Promise<void>
  refreshEvents: () => Promise<void>
  setView: (view: CalendarView) => Promise<void>
  
  // 新機能
  getSchedulesForDateRange: (startDate: Date, endDate: Date) => Promise<Event[]>
  getEventDisplayData: (event: Event) => any
  getUserSchedulesForWeek: (userId: string, weekStartDate: Date) => Promise<Map<string, Event[]>>
  getMonthlyEventLayout: () => Map<string, Event[]>
  getEventConflicts: (eventId: string) => Promise<EventFormConflict[]>
}

export const useCalendar = (): UseCalendarReturn => {
  const { getEventsInRange, getEventsForConflictCheck } = useEventService()
  
  // 現在の日付
  const currentDate: Ref<Date> = ref(new Date())
  // 選択中の日付
  const selectedDate: Ref<Date | null> = ref(null)
  // 表示するビュー（日次/週次/月次）
  const currentView: Ref<CalendarView> = ref('daily')
  // ユーザーデータ（週間ビュー用）
  const users: Ref<UserWithVisibility[]> = ref([])
  // イベントデータ
  const events: Ref<Event[]> = ref([])
  // 祝日データ
  const holidays: Ref<Holiday[]> = ref([])
  // ローディング状態
  const isLoading: Ref<boolean> = ref(false)

  // 曜日を日本語で取得
  const getDayOfWeek = (date: Date): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  // 日付をYYYY/MM/DD形式でフォーマット
  const formatDate = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  // 日付をYYYY-MM-DD形式でフォーマット（DB用）
  const formatDateForDb = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 月日のみのフォーマット (MM/DD)
  const formatShortDate = (date: Date | null): string => {
    if (!date) return ''
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  }

  // 現在のビューに応じた日付範囲を計算
  const getCurrentDateRange = (): DateRange => {
    const today = new Date(currentDate.value)
    
    switch (currentView.value) {
      case 'daily': {
        const startDate = formatDateForDb(today)
        const endDate = formatDateForDb(today)
        return { startDate, endDate }
      }
      
      case 'weekly': {
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(today.setDate(diff))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        
        return {
          startDate: formatDateForDb(monday),
          endDate: formatDateForDb(sunday)
        }
      }
      
      case 'monthly': {
        const year = today.getFullYear()
        const month = today.getMonth()
        
        const firstDay = new Date(year, month, 1)
        const firstDayOfWeek = firstDay.getDay()
        const daysFromPrevMonth = firstDayOfWeek
        
        const startDate = new Date(year, month, 1 - daysFromPrevMonth)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 41)
        
        return {
          startDate: formatDateForDb(startDate),
          endDate: formatDateForDb(endDate)
        }
      }
      
      default:
        return {
          startDate: formatDateForDb(today),
          endDate: formatDateForDb(today)
        }
    }
  }

  // 時間文字列をピクセル位置に変換（デイリービュー用）
  const timeToPixels = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return ((hours - 8) * 60 + minutes) * (32 / 30)
  }

  // 特定の日のスケジュールを取得（期間予定対応）
  const getSchedulesForDay = async (date: Date | null): Promise<Event[]> => {
    if (!date) return []
    
    const dateString = formatDateForDb(date)
    
    return events.value.filter(event => {
      // 単一日・開始日が一致
      if (event.date === dateString) return true
      
      // 期間予定の場合：その日が期間内に含まれるかチェック
      if (event.endDate) {
        return event.date <= dateString && event.endDate >= dateString
      }
      
      return false
    })
  }

  // 期間範囲のスケジュール取得
  const getSchedulesForDateRange = async (
    startDate: Date,
    endDate: Date
  ): Promise<Event[]> => {
    const startDateStr = formatDateForDb(startDate)
    const endDateStr = formatDateForDb(endDate)
    
    return events.value.filter(event => {
      // 単一日の場合
      if (!event.endDate) {
        return event.date >= startDateStr && event.date <= endDateStr
      }
      
      // 期間予定の場合：重複チェック
      return event.date <= endDateStr && event.endDate >= startDateStr
    })
  }

  // 特定の日のユーザーごとのスケジュールを取得（週間ビュー用）
  const getUserSchedulesForDay = async (userId: string, date: Date | null): Promise<Event[]> => {
    if (!date) return []
    
    const dayEvents = await getSchedulesForDay(date)
    
    return dayEvents.filter(event => 
      event.participantIds?.includes(userId)
    )
  }

  // 週間ビュー用のユーザーごとのスケジュール取得（期間予定対応）
  const getUserSchedulesForWeek = async (
    userId: string,
    weekStartDate: Date
  ): Promise<Map<string, Event[]>> => {
    const weekSchedules = new Map<string, Event[]>()
    const weekDays = generateWeekDays.value
    
    for (const day of weekDays) {
      const dayEvents = await getUserSchedulesForDay(userId, day)
      weekSchedules.set(formatDateForDb(day), dayEvents)
    }
    
    return weekSchedules
  }

  // イベント表示用データ変換
  const getEventDisplayData = (event: Event) => {
    const isMultiDay = event.endDate && event.endDate !== event.date
    
    return {
      ...event,
      isMultiDay,
      displayDuration: isMultiDay 
        ? `${formatShortDate(new Date(event.date))} - ${formatShortDate(new Date(event.endDate!))}`
        : formatShortDate(new Date(event.date)),
      durationDays: isMultiDay 
        ? Math.ceil((new Date(event.endDate!).getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1
    }
  }

  // 月間ビューでの期間予定表示データ
  const getMonthlyEventLayout = (): Map<string, Event[]> => {
    const layout = new Map<string, Event[]>()
    const calendarDays = generateCalendarDays.value
    
    for (const calendarDay of calendarDays) {
      const dayStr = formatDateForDb(calendarDay.date)
      
      const dayEvents = events.value.filter(event => {
        if (!event.endDate) {
          return event.date === dayStr
        }
        
        // 期間予定：その日が期間内かつ表示対象の日かチェック
        const isInPeriod = event.date <= dayStr && event.endDate >= dayStr
        const isStartDay = event.date === dayStr
        const isVisibleDay = calendarDay.currentMonth || isStartDay
        
        return isInPeriod && isVisibleDay
      })
      
      layout.set(dayStr, dayEvents)
    }
    
    return layout
  }

  // イベントの競合状況を取得
  const getEventConflicts = async (eventId: string): Promise<EventFormConflict[]> => {
    try {
      const event = events.value.find(e => e.id === eventId)
      if (!event) return []

      const dateRange = {
        startDate: event.date,
        endDate: event.endDate || event.date
      }

      const existingEvents = await getEventsForConflictCheck(dateRange, eventId)
      
      // 簡易的な競合チェック（実際はuseConflictDetectionを使用）
      const conflicts: EventFormConflict[] = []
      
      for (const existingEvent of existingEvents) {
        if (isTimeOverlapping(event.startTime, event.endTime, existingEvent.startTime, existingEvent.endTime)) {
          // 参加者の競合
          for (const participantId of (event.participantIds || [])) {
            if (existingEvent.participantIds?.includes(participantId)) {
              conflicts.push({
                type: 'participant',
                id: participantId,
                name: `参加者 ${participantId}`,
                date: existingEvent.date,
                startTime: existingEvent.startTime,
                endTime: existingEvent.endTime,
                eventTitle: existingEvent.title
              })
            }
          }
        }
      }
      
      return conflicts
      
    } catch (error) {
      console.error('競合チェックエラー:', error)
      return []
    }
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

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // ナビゲーション関数群（データ再読み込み付き）
  const previousDay = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - 1)
    currentDate.value = newDate
    await loadData()
  }

  const nextDay = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + 1)
    currentDate.value = newDate
    await loadData()
  }

  const previousWeek = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() - 7)
    currentDate.value = newDate
    await loadData()
  }

  const nextWeek = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setDate(newDate.getDate() + 7)
    currentDate.value = newDate
    await loadData()
  }

  const previousMonth = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
    await loadData()
  }

  const nextMonth = async (): Promise<void> => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
    await loadData()
  }

  const goToToday = async (): Promise<void> => {
    currentDate.value = new Date()
    await loadData()
  }

  const selectDay = (date: Date): void => {
    selectedDate.value = date
  }

  const setView = async (view: CalendarView): Promise<void> => {
    currentView.value = view
    await loadData()
  }

  // 月のカレンダー日を生成
  const generateCalendarDays: ComputedRef<CalendarDay[]> = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysFromPrevMonth = firstDayOfWeek
    const totalDays = 42
    
    const days: CalendarDay[] = []
    
    // 前月の日を追加
    const prevMonthLastDate = new Date(year, month, 0).getDate()
    for (let i = prevMonthLastDate - daysFromPrevMonth + 1; i <= prevMonthLastDate; i++) {
      days.push({
        date: new Date(year, month - 1, i),
        currentMonth: false
      })
    }
    
    // 現在の月の日を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      })
    }
    
    // 次月の日を追加
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      })
    }
    
    return days
  })

  // 週の日付を生成
  const generateWeekDays: ComputedRef<Date[]> = computed(() => {
    const days: Date[] = []
    const today = new Date(currentDate.value)
    
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(new Date(monday).setDate(monday.getDate() + i))
      days.push(day)
    }
    
    return days
  })

  // 時間枠の生成（8:00から20:00）
  const timeSlots: ComputedRef<string[]> = computed(() => {
    const slots: string[] = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour}:00`)
      slots.push(`${hour}:30`)
    }
    return slots
  })

  // 祝日判定
  const isHoliday = (date: Date): boolean => {
    const dateString = formatDateForDb(date)
    return holidays.value.some(holiday => holiday.date === dateString)
  }

  const getHolidayName = (date: Date): string => {
    const dateString = formatDateForDb(date)
    const holiday = holidays.value.find(holiday => holiday.date === dateString)
    return holiday?.name || ''
  }

  const toggleUserVisibility = (userId: string): void => {
    const userIndex = users.value.findIndex(u => u.uid === userId)
    if (userIndex !== -1) {
      users.value[userIndex].visible = !users.value[userIndex].visible
    }
  }

  // データ読み込み（期間・繰り返し対応）
  const loadData = async (): Promise<void> => {
    try {
      isLoading.value = true
      
      const dateRange = getCurrentDateRange()
      
      const [eventsData, usersData, holidaysData] = await Promise.all([
        getEventsInRange(dateRange.startDate, dateRange.endDate),
        getUsersListAsync(),
        getHolidaysListAsync()
      ])
      
      events.value = eventsData
      users.value = usersData.map(user => ({
        ...user,
        visible: true
      }))
      
      // 日付範囲での祝日フィルタリング
      holidays.value = holidaysData.filter(holiday => 
        holiday.date >= dateRange.startDate && holiday.date <= dateRange.endDate
      )
      
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error)
    } finally {
      isLoading.value = false
    }
  }

  const refreshEvents = async (): Promise<void> => {
    try {
      isLoading.value = true
      const dateRange = getCurrentDateRange()
      const eventsData = await getEventsInRange(dateRange.startDate, dateRange.endDate)
      events.value = eventsData
    } catch (error) {
      console.error('イベントデータの更新に失敗しました:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentDate,
    selectedDate,
    currentView,
    users,
    events,
    holidays,
    isLoading,
    getDayOfWeek,
    formatDate,
    formatShortDate,
    timeToPixels,
    getSchedulesForDay,
    getUserSchedulesForDay,
    previousDay,
    nextDay,
    previousWeek,
    nextWeek,
    previousMonth,
    nextMonth,
    goToToday,
    selectDay,
    generateCalendarDays,
    generateWeekDays,
    timeSlots,
    isHoliday,
    getHolidayName,
    toggleUserVisibility,
    loadData,
    refreshEvents,
    setView,
    
    // 新機能
    getSchedulesForDateRange,
    getEventDisplayData,
    getUserSchedulesForWeek,
    getMonthlyEventLayout,
    getEventConflicts
  }
}