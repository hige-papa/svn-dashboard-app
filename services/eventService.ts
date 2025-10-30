// services/eventService.ts

import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { useFirestore } from '~/composables/firebase/useFirestore'
import { where } from 'firebase/firestore'
import { useUuid } from '~/composables/common/useUuid'

export const useEventService = () => {
  const eventsService = useFirestoreGeneral('events')
  // 旧ロジックで使用していた rulesService, instancesService は削除
  const { generateUuid } = useUuid()

  // --- Date Utility Functions (Timezone Safe) ---
  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const parseDateAsLocal = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

  // --- Recurrence Date Generation Utility ---
  const getDayDiff = (d1: Date, d2: Date): number => {
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  };

  /**
   * 繰り返しルールに基づき、指定期間内の日付文字列の配列を生成する
   * ※ 既存の generateRecurringDates 関数をベースに、期間内に収まる実体日付を生成します。
   */
  const generateRecurringDates = (
    formData: EventFormData,
    viewStartDate: Date,
    viewEndDate: Date,
    interval: number = 1
  ): string[] => {
    const resultDates: string[] = [];
    const recurrenceStartDate = parseDateAsLocal(formData.recurringStartDate!);
    let current = new Date(recurrenceStartDate);
    let generatedCount = 0;
    const maxCount = formData.recurringEndType?.toLowerCase() === 'count' ? formData.recurringCount : Infinity;
    const recurringEndDate = formData.recurringEndType?.toLowerCase() === 'date' && formData.recurringEndDate
      ? parseDateAsLocal(formData.recurringEndDate)
      : null;
    const hardLimitDate = new Date(recurrenceStartDate);
    hardLimitDate.setFullYear(hardLimitDate.getFullYear() + 20);

    while (true) {
      if (generatedCount >= maxCount) break;
      if (recurringEndDate && current > recurringEndDate) break;
      if (current > hardLimitDate) break;
      // 実体化の範囲を限定
      if (current > viewEndDate) break;

      let matches = false;
      const startDate = recurrenceStartDate;
      const effectiveInterval = interval > 0 ? interval : 1;
      const dayOfWeek = current.getDay();
      
      // 既存の matchesRecurrencePattern ロジックを簡略化
      switch (formData.recurringPattern) {
        case 'daily':
            if (getDayDiff(startDate, current) % effectiveInterval === 0) matches = true;
            break;
        case 'weekdays':
            if (dayOfWeek >= 1 && dayOfWeek <= 5) matches = true;
            break;
        case 'custom':
        case 'weekly':
            if (formData.selectedWeekdays?.includes(dayOfWeek)) matches = true;
            break;
        // monthly, yearly のロジックは省略または既存のものを維持
        default:
            matches = false;
            break;
      }

      if (matches) {
        generatedCount++;
        // 開始日以降の全ての日付を収集
        if (current >= startDate) { 
          resultDates.push(formatDateForDb(current));
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return resultDates.filter(dateStr => dateStr >= formatDateForDb(viewStartDate) && dateStr <= formatDateForDb(viewEndDate));
  };
  // ---

  const convertToEvent = (eventData: EventData): EventDisplay => {
    const correctDate = eventData.date!; 
    return {
      id: eventData.id!, title: eventData.title, date: correctDate,
      endDate: eventData.endDate, startTime: eventData.startTime, endTime: eventData.endTime,
      location: eventData.location, description: eventData.description, priority: eventData.priority,
      participantIds: eventData.participantIds || [], participants: eventData.participants,
      facilityIds: eventData.facilityIds || [], facilities: eventData.facilities,
      equipmentIds: eventData.equipmentIds || [], equipments: eventData.equipments,
      isRecurring: false, masterId: eventData.masterId, isException: false, 
      eventType: eventData.eventType, eventTypeName: eventData.eventTypeName, eventTypeColor: eventData.eventTypeColor,
      private: eventData.private,
      isMultiDay: false, 
      conflicted: false,
    } as EventDisplay;
  };
  
  /**
   * イベント登録処理 (期間・繰り返しイベントを実体として一括登録する)
   * @returns 登録されたイベントIDの配列
   */
  const createEvent = async (formData: EventFormData): Promise<string[]> => {
    const { addWithBatch } = useFirestore()

    // 1. 共通のEventDataを構築
    const baseEventData: Partial<EventData> = {
      title: formData.title,
      eventType: formData.eventType,
      dateType: 'single', // 実体化後は 'single' 相当として扱う
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      description: formData.description,
      priority: formData.priority,
      participantIds: formData.participantIds,
      participants: formData.participants,
      facilityIds: formData.facilityIds,
      facilities: formData.facilities,
      equipmentIds: formData.equipmentIds,
      equipments: formData.equipments,
      private: formData.private,
    };

    let eventsToSave: (Partial<EventData> & { date: string })[] = [];
    
    // 複数イベントを関連付けるためのマスターIDを生成 (単発の場合は未使用)
    const masterId = formData.dateType !== 'single' ? generateUuid() : undefined;

    // 実体化の終了日を現在から最大1年後とする
    const today = new Date();
    const maxEndDateForRecurrence = new Date(today);
    maxEndDateForRecurrence.setFullYear(maxEndDateForRecurrence.getFullYear() + 1);
    
    if (formData.dateType === 'single') {
      eventsToSave.push({
        ...baseEventData,
        date: formData.date!, 
      });

    } else if (formData.dateType === 'range') {
      const start = parseDateAsLocal(formData.startDate!);
      const end = parseDateAsLocal(formData.endDate!);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        eventsToSave.push({
          ...baseEventData,
          masterId: masterId,
          date: formatDateForDb(d), 
        });
      }

    } else if (formData.dateType === 'recurring') {
      const start = parseDateAsLocal(formData.recurringStartDate!);
      const recurringDates = generateRecurringDates(formData, start, maxEndDateForRecurrence);
      
      for (const dateStr of recurringDates) {
        eventsToSave.push({
          ...baseEventData,
          masterId: masterId,
          date: dateStr,
          recurringPattern: formData.recurringPattern, 
          recurringStartDate: formData.recurringStartDate,
        });
      }
    }
    
    if (eventsToSave.length === 0) {
        throw new Error('保存対象のイベントがありません。');
    }

    // 2. Firestoreにバッチで一括登録
    const batchActions: BatchAction[] = eventsToSave.map(event => ({
      reference: eventsService.getDocRefAsync(generateUuid()), 
      entity: event
    }));
    
    await addWithBatch(batchActions);
    
    return batchActions.map(a => a.reference.id); 
  };

  /**
   * 日付範囲でイベントを取得する (eventsコレクションのみを参照する)
   */
  const getEventsAsync = async (startDate: string, endDate: string): Promise<EventDisplay[]> => {
    try {
      const queryConstraints = [
        where('date', '>=', startDate),
        where('date', '<=', endDate),
      ];
      
      const eventsData = await eventsService.getListAsync(...queryConstraints) as EventData[];

      return eventsData.map(convertToEvent).sort((a, b) => 
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );

    } catch (error) {
      console.error('getEventsAsync Error:', error);
      throw error;
    }
  }
  
  /**
   * リソース（参加者/施設/備品）と期間を指定してイベントを取得する
   */
  const getEventsByResourceInRange = async (
    resourceType: 'participant' | 'facility' | 'equipment',
    resourceId: string,
    startDate: string,
    endDate: string
  ): Promise<EventDisplay[]> => {
    const fieldName = (resourceType === 'participant' ? 'participantIds' : resourceType === 'facility' ? 'facilityIds' : 'equipmentIds');

    try {
      const queryConstraints = [
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        where(fieldName, 'array-contains', resourceId),
      ];
      
      const eventsData = await eventsService.getListAsync(...queryConstraints) as EventData[];

      return eventsData.map(convertToEvent).sort((a, b) => 
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
    } catch (error) {
      console.error(`getEventsByResourceInRange (${resourceType}) Error:`, error);
      throw error;
    }
  };
  
  return { 
    createEvent, 
    getEventsAsync, 
    getEventsInRange: getEventsAsync, 
    getEventsByParticipantInRange: (uid: string, startDate: string, endDate: string) => getEventsByResourceInRange('participant', uid, startDate, endDate),
    getEventsByFacilityInRange: (facilityId: string, startDate: string, endDate: string) => getEventsByResourceInRange('facility', facilityId, startDate, endDate),
    getEventsByEquipmentInRange: (equipmentId: string, startDate: string, endDate: string) => getEventsByResourceInRange('equipment', equipmentId, startDate, endDate),
  };
};