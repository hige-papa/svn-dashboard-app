export { };

declare global {

  type DateType = 'single' | 'range' | 'recurring';
  type RecurringPattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';
  type RecurringEndType = 'never' | 'date' | 'count';
  type MonthlyType = 'date' | 'weekday';
  type ModalType = 'participant' | 'facility' | 'equipment' | null;
  type CalendarView = 'daily' | 'weekly' | 'monthly';
  type EventType = 'meeting' | 'focus' | 'away' | 'other' | 'vacation' | 'normal';

  interface MasterItem {
    id: string;
    code: string;
    name: string;
    department?: string;
    capacity?: number;
    quantity?: number;
    isConflict?: boolean;
    conflictInfo?: string;
    avatar?: string;
  }

  interface EventFormData {
    title: string;
    dateType: DateType;
    date: string;
    startDate: string;
    endDate: string;
    recurringStartDate: string;
    recurringPattern: RecurringPattern;
    selectedWeekdays: number[];
    monthlyType: MonthlyType;
    monthlyDate: number;
    monthlyWeek: string;
    monthlyWeekday: number;
    recurringEndType: RecurringEndType;
    recurringEndDate: string;
    recurringCount: number;
    startTime: string;
    endTime: string;
    location: string;
    participantIds: string[];
    participants: string[];
    facilityIds: string[];
    facilities: string[];
    equipmentIds: string[];
    equipments: string[];
    priority: 'low' | 'medium' | 'high';
    description: string;
    /**
     * イベント種別コード
     */
    eventType: EventType;
    /**
     * イベント種別名 (日本語表示用)
     */
    eventTypeName: string;
    /**
     * イベント種別のカラーコード
     */
    eventTypeColor: string;
    /**
     * プライベート
     */
    private: boolean;
  }

  interface EventData {
    id?: string;
    masterId?: string;
    title: string;
    dateType: DateType;
    date?: string;
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    allDay?: boolean;
    recurringStartDate?: string;
    recurringPattern?: RecurringPattern;
    selectedWeekdays?: number[];
    monthlyType?: MonthlyType;
    monthlyDate?: number;
    monthlyWeek?: string;
    monthlyWeekday?: number;
    recurringEndType?: RecurringEndType;
    recurringEndDate?: string;
    recurringCount?: number;
    location?: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    participantIds?: string[];
    participants: string[];
    facilityIds?: string[];
    facilityIds: string[];
    facilities: string[];
    equipmentIds: string[];
    equipments: string[];
    createdBy?: string;
    createdAt?: any;
    updatedAt?: any;
    updatedBy?: string;
    /**
     * イベント種別コード
     */
    eventType: EventType;
    /**
     * イベント種別名 (日本語表示用)
     */
    eventTypeName: string;
    /**
     * イベント種別のカラーコード
     */
    eventTypeColor: string;
    /**
     * プライベート
     */
    private: boolean;
  }

  interface EventDisplay {
    id: string;
    segmentId?: string;
    originalStartDate?: string;
    title: string;
    date: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    userId?: string;
    location?: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    participantIds?: string[];
    participants: string[];
    facilityIds?: string[];
    facilityIds: string[];
    facilities: string[];
    equipmentIds: string[];
    equipments: string[];
    isRecurring?: boolean;
    masterId?: string;
    isException?: boolean;
    originalDate?: string;
    isMultiDay?: boolean;
    isFirstDay?: boolean;
    isLastDay?: boolean;
    createdBy?: string;
    createdAt?: any;
    updatedAt?: any;
    updatedBy?: string;
    /**
     * イベント種別コード
     */
    eventType: EventType;
    /**
     * イベント種別名 (日本語表示用)
     */
    eventTypeName: string;
    /**
     * イベント種別のカラーコード
     */
    eventTypeColor: string;
    /**
     * プライベート
     */
    private: boolean;
    /**
     * 他のイベントと時間が重複しているかどうか
     */
    conflicted: boolean;
  }

  interface RecurrenceRule {
    id: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    masterId: string;
    byDay?: number[];
    byMonthDay?: number;
    bySetPos?: number;
    until?: string;
    count?: number;
    exceptions?: string[];
  }

  interface EventInstance {
    id?: string;
    masterId: string;
    instanceDate: string;
    originalDate?: string;
    isException: boolean;
    isModified: boolean;
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    participantIds?: string[];
    participants: string[];
    facilityIds?: string[];
    facilityIds: string[];
    facilities: string[];
    equipmentIds: string[];
    equipments: string[];
    status: 'active' | 'cancelled' | 'deleted';
    createdAt?: any;
    updatedAt?: any;
  }

  interface ExtendedUserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    department?: string;
    position?: string;
  }

  interface UserWithVisibility extends ExtendedUserProfile {
    visible: boolean;
  }

  interface CalendarDay {
    date: Date;
    currentMonth: boolean;
  }

  interface DateRange {
    startDate: string;
    endDate: string;
  }

  interface Holiday {
    id: string;      // 祝日データの一意なID
    date: string;    // 日付 (例: "2025-01-01")
    name: string;    // 祝日名 (例: "元日")
  }

  export type EventRelatedPartyType = 'user' | 'facility' | 'equipment'

  interface EventRelatedParty {
    id: string
    type: EventRelatedPartyType
    name: string
    avatar: string
  }
}