export { MasterItem, FormData, Conflict, Errors, Notification, Holiday };

declare global {

  // TypeScript型定義
  type DateType = 'single' | 'range' | 'recurring'
  type RecurringPattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom'
  type RecurringEndType = 'never' | 'date' | 'count'
  type MonthlyType = 'date' | 'weekday'
  type ModalType = 'participant' | 'facility' | 'equipment' | null

  interface MasterItem {
    id: string
    name: string
    department?: string
    capacity?: number
    quantity?: number
    isConflict?: boolean
    conflictInfo?: string
  }

  interface EventFormData {
    title: string
    dateType: DateType
    // 単一日
    date: string
    // 期間
    startDate: string
    endDate: string
    // 繰り返し
    recurringStartDate: string
    recurringPattern: RecurringPattern
    selectedWeekdays: number[]
    monthlyType: MonthlyType
    monthlyDate: number
    monthlyWeek: string
    monthlyWeekday: number
    recurringEndType: RecurringEndType
    recurringEndDate: string
    recurringCount: number
    // 共通
    startTime: string
    endTime: string
    location: string
    participantIds: string[]
    participants: string[]
    facilityIds: string[]
    equipmentIds: string[]
    priority: 'low' | 'medium' | 'high'
    description: string
  }

  interface EventFormConflict {
    type: 'participant' | 'facility' | 'equipment'
    id: string
    name: string
    date: string
    startTime: string
    endTime: string
    eventTitle: string
  }

  interface EventFormErrors {
    eventTitle?: string
    eventDate?: string
    startDate?: string
    endDate?: string
    recurringStartDate?: string
    time?: string
  }

  interface EventFormNotification {
    show: boolean
    message: string
    type: 'success' | 'error'
  }

  interface Holiday {
    id: string
    date: string
    name: string
  }
}