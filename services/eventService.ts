// services/eventService.ts
import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { where } from 'firebase/firestore'

export const useEventService = () => {
  const eventsService = useFirestoreGeneral('events')
  const rulesService = useFirestoreGeneral('recurrence_rules')
  const instancesService = useFirestoreGeneral('event_instances')

  // --- Date Utility Functions (Timezone Safe) ---
  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const parseDateAsLocal = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

  // --- Main Functions ---
  const createEvent = async (formData: EventFormData): Promise<string> => {
    // 1. 常に共通のフィールドから、保存するデータをクリーンに構築する
    const eventData: Partial<EventData> = {
      title: formData.title,
      eventType: formData.eventType,
      dateType: formData.dateType,
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

    // 2. dateTypeに応じてフィールドを追加
    if (formData.dateType === 'single') {
        eventData.date = formData.date;
    } else if (formData.dateType === 'range') {
        eventData.startDate = formData.startDate;
        eventData.endDate = formData.endDate;
    } else if (formData.dateType === 'recurring') {
        eventData.startDate = formData.recurringStartDate;
        eventData.recurringPattern = formData.recurringPattern;
        eventData.recurringEndType = formData.recurringEndType;

        // 3. 繰り返しパターンに応じて、必要なフィールドだけを追加する
        if (formData.recurringPattern === 'weekly' || formData.recurringPattern === 'custom' || formData.recurringPattern === 'weekdays') {
            eventData.selectedWeekdays = formData.selectedWeekdays;
        } else if (formData.recurringPattern === 'monthly') {
            eventData.monthlyType = formData.monthlyType;
            if (formData.monthlyType === 'date') {
                eventData.monthlyDate = formData.monthlyDate;
            } else { // 'weekday'
                eventData.monthlyWeek = formData.monthlyWeek;
                eventData.monthlyWeekday = formData.monthlyWeekday;
            }
        }

        // 4. 終了条件に応じて、必要なフィールドだけを追加する
        if (formData.recurringEndType?.toLowerCase() === 'date') {
            eventData.recurringEndDate = formData.recurringEndDate;
        } else if (formData.recurringEndType?.toLowerCase() === 'count') {
            eventData.recurringCount = formData.recurringCount;
        }
    }

    const masterEvent = await eventsService.addAsync(eventData);
    if (!masterEvent?.id) {
        throw new Error('Failed to create master event');
    }

    if (formData.dateType === 'recurring') {
        const rule = await createRecurrenceRule(masterEvent.id, formData);
        if (rule?.id) {
            await generateInitialInstances(masterEvent.id, formData);
        }
    }
    return masterEvent.id;
  };

  /**
   * 単発/期間イベントと、生成済みの繰り返しイベントのインスタンスを取得し、統合する。
   * クライアントでの複雑な繰り返し計算を避け、DBからの読み取りに集中する。
   */
  const getEventsInRange = async (startDate: string, endDate: string): Promise<EventDisplay[]> => {
    const preliminaryEvents: EventDisplay[] = [];
    try {
      // 1. 単発/期間イベントの取得とフィルタリング
      const nonRecurringEvents = await eventsService.getListAsync(where('dateType', 'in', ['single', 'range'])) as EventData[];
      for (const eventData of nonRecurringEvents) {
        if (eventData.dateType === 'single' && eventData.date && eventData.date >= startDate && eventData.date <= endDate) {
          preliminaryEvents.push(convertToEvent(eventData));
        } else if (eventData.dateType === 'range' && eventData.startDate) {
          const eventEndDate = eventData.endDate || eventData.startDate;
          if (eventData.startDate <= endDate && eventEndDate >= startDate) {
            preliminaryEvents.push(convertToEvent(eventData));
          }
        }
      }
      
      // 2. 繰り返しイベントのインスタンスを取得
      const instances = await instancesService.getListAsync(where('instanceDate', '>=', startDate), where('instanceDate', '<=', endDate)) as EventInstance[];
      const masterEventIds = [...new Set(instances.map(i => i.masterId))];
      const masterEventsData = new Map<string, EventData>();
      
      // 3. インスタンスに対応するマスターイベントの一括取得
      if (masterEventIds.length > 0) {
        const masterEvents = await eventsService.getListAsync(where('__name__', 'in', masterEventIds)) as EventData[];
        masterEvents.forEach(master => masterEventsData.set(master.id!, master));
      }
      
      // 4. インスタンスとマスターイベントの統合
      for (const instance of instances) {
        if (instance.status === 'active') {
          const masterEvent = masterEventsData.get(instance.masterId);
          if (masterEvent) preliminaryEvents.push(mergeInstanceWithMaster(instance, masterEvent));
        }
      }
      
      // 5. 不足している繰り返しイベントのインスタンスを生成・追加 (サーバーサイドへの移行推奨)
      await generateMissingRecurringEvents(startDate, endDate, preliminaryEvents); 
      
      // 6. 複数日イベントの展開と最終リスト作成
      const finalEvents: EventDisplay[] = [];
      for (const event of preliminaryEvents) {
        if (event.endDate && event.endDate > event.date) {
          const current = parseDateAsLocal(event.date);
          const end = parseDateAsLocal(event.endDate);
          while (current <= end) {
            const dateStr = formatDateForDb(current);
            if (dateStr >= startDate && dateStr <= endDate) {
              finalEvents.push({
                ...event, id: event.id, segmentId: `${event.id}-${dateStr}`, date: dateStr,
                isMultiDay: true, isFirstDay: dateStr === event.date, isLastDay: dateStr === event.endDate,
              });
            }
            current.setDate(current.getDate() + 1);
          }
        } else {
          if (event.date >= startDate && event.date <= endDate) {
            finalEvents.push({ ...event, id: event.id, segmentId: event.id, isMultiDay: false });
          }
        }
      }
      return finalEvents.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    } catch (error) {
      console.error('getEventsInRange Error:', error);
      throw error;
    }
  };

  const generateInitialInstances = async (masterId: string, formData: EventFormData, months: number = 3): Promise<void> => {
    const startDate = parseDateAsLocal(formData.recurringStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    const instances = generateRecurringDates(formData, startDate, endDate);
    for (const date of instances) {
      await instancesService.addAsync({ masterId, instanceDate: date, isException: false, isModified: false, status: 'active' });
    }
  };

  const createRecurrenceRule = async (masterId: string, formData: EventFormData): Promise<RecurrenceRule | null> => {
    if (formData.dateType !== 'recurring') return null;
    const rule: Omit<RecurrenceRule, 'id'> = {
      masterId, frequency: mapPatternToFrequency(formData.recurringPattern), interval: 1, exceptions: []
    };
    if (['custom', 'weekly'].includes(formData.recurringPattern)) {
      if (formData.selectedWeekdays?.length > 0) rule.byDay = formData.selectedWeekdays;
    } else if (formData.recurringPattern === 'weekdays') {
      rule.frequency = 'WEEKLY'; rule.byDay = [1, 2, 3, 4, 5];
    } else if (formData.recurringPattern === 'monthly') {
      if (formData.monthlyType === 'date') rule.byMonthDay = formData.monthlyDate;
      else if (formData.monthlyType === 'weekday') {
        rule.byDay = [formData.monthlyWeekday]; rule.bySetPos = parseInt(formData.monthlyWeek);
      }
    }
    if (formData.recurringEndType?.toLowerCase() === 'date' && formData.recurringEndDate) {
      rule.until = formData.recurringEndDate;
    } else if (formData.recurringEndType?.toLowerCase() === 'count' && formData.recurringCount > 0) {
      rule.count = formData.recurringCount;
    }
    return await rulesService.addAsync(rule) as RecurrenceRule | null;
  };
  
  const generateMissingRecurringEvents = async (startDate: string, endDate: string, preliminaryEvents: EventDisplay[]): Promise<void> => {
    const allRules = await rulesService.getListAsync() as RecurrenceRule[];
    // const recurringMasterEvents = await eventsService.getListAsync(where('dateType', '==', 'recurring')) as EventData[];
    const recurringMasterEvents = await eventsService.getListAsync(
        where('dateType', '==', 'recurring'),
        // イベント自体の開始日が表示終了日より後のものは除外
        where('startDate', '<=', endDate) 
    ) as EventData[];
    const masterEventsMap = new Map(recurringMasterEvents.map(e => [e.id!, e]));
    for (const rule of allRules) {
      const masterEvent = masterEventsMap.get(rule.masterId);
      if (!masterEvent || !masterEvent.startDate) continue;
      if (rule.until && rule.until < startDate) continue;
      if (masterEvent.startDate > endDate) continue;
      const formData = { ...masterEvent, recurringStartDate: masterEvent.startDate } as EventFormData;
      const recurringDates = generateRecurringDates(formData, parseDateAsLocal(startDate), parseDateAsLocal(endDate), rule.interval);
      for (const date of recurringDates) {
        if (rule.exceptions?.includes(date)) continue;
        if (preliminaryEvents.some(e => e.masterId === rule.masterId && e.date === date)) continue;
        preliminaryEvents.push(mergeInstanceWithMaster({ masterId: rule.masterId, instanceDate: date } as EventInstance, masterEvent));
      }
    }
  };

  const convertToEvent = (eventData: EventData): EventDisplay => {
    const correctStartDate = eventData.dateType === 'single' ? eventData.date! : eventData.startDate!;
    return {
      id: eventData.id!, title: eventData.title, date: correctStartDate,
      endDate: eventData.endDate, startTime: eventData.startTime, endTime: eventData.endTime,
      location: eventData.location, description: eventData.description, priority: eventData.priority,
      participantIds: eventData.participantIds || [], participants: eventData.participants,
      facilityIds: eventData.facilityIds || [], facilities: eventData.facilities,
      equipmentIds: eventData.equipmentIds || [], equipments: eventData.equipments,
      isRecurring: eventData.dateType === 'recurring',
      eventType: eventData.eventType, eventTypeName: eventData.eventTypeName, eventTypeColor: eventData.eventTypeColor,
      private: eventData.private,
    };
  };
  
  const calculateInstanceEndDate = (instanceStartDateStr: string, masterEvent: EventData): string | undefined => {
    if (masterEvent.startDate && masterEvent.endDate && masterEvent.startDate !== masterEvent.endDate) {
      const masterStart = parseDateAsLocal(masterEvent.startDate);
      const masterEnd = parseDateAsLocal(masterEvent.endDate);
      const durationMs = masterEnd.getTime() - masterStart.getTime();
      const instanceStart = parseDateAsLocal(instanceStartDateStr);
      const instanceEnd = new Date(instanceStart.getTime() + durationMs);
      return formatDateForDb(instanceEnd);
    }
    return undefined;
  };
  
  const mergeInstanceWithMaster = (instance: EventInstance, masterEvent: EventData): EventDisplay => {
    const instanceEndDate = calculateInstanceEndDate(instance.instanceDate, masterEvent);
    return {
      id: masterEvent.id!, title: instance.title || masterEvent.title, date: instance.instanceDate,
      endDate: instanceEndDate, startTime: instance.startTime || masterEvent.startTime,
      endTime: instance.endTime || masterEvent.endTime, location: instance.location || masterEvent.location,
      description: instance.description || masterEvent.description, priority: masterEvent.priority,
      participantIds: instance.participantIds || masterEvent.participantIds || [],
      participants: instance.participants || masterEvent.participants || [],
      facilityIds: instance.facilityIds || masterEvent.facilityIds || [],
      facilities: instance.facilities || masterEvent.facilities || [],
      equipmentIds: instance.equipmentIds || masterEvent.equipmentIds || [],
      equipments: instance.equipments || masterEvent.equipments || [],
      isRecurring: true, masterId: instance.masterId, isException: !!instance.isException,
      eventType: masterEvent.eventType, eventTypeName: masterEvent.eventTypeName, eventTypeColor: masterEvent.eventTypeColor,
      private: masterEvent.private,
    };
  };

  const generateRecurringDates = (
    formData: EventFormData,
    viewStartDate: Date,
    viewEndDate: Date,
    interval?: number
  ): string[] => {
    const resultDates: string[] = [];
    const recurrenceStartDate = parseDateAsLocal(formData.recurringStartDate);
    const current = new Date(recurrenceStartDate);
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
      if (formData.recurringEndType?.toLowerCase() !== 'count' && current > viewEndDate) break;
      if (matchesRecurrencePattern(current, formData, interval)) {
        generatedCount++;
        if (current >= viewStartDate && current <= viewEndDate) {
          resultDates.push(formatDateForDb(current));
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return resultDates;
  };

  const getDayDiff = (d1: Date, d2: Date): number => {
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  };

  const getWeekDiff = (d1: Date, d2: Date, startOfWeek: number = 0): number => {
      const date1 = new Date(d1.getTime());
      const date2 = new Date(d2.getTime());
      date1.setHours(0,0,0,0);
      date2.setHours(0,0,0,0);
      const day1 = (date1.getDay() - startOfWeek + 7) % 7;
      const day2 = (date2.getDay() - startOfWeek + 7) % 7;
      date1.setDate(date1.getDate() - day1);
      date2.setDate(date2.getDate() - day2);
      return Math.round((date2.getTime() - date1.getTime()) / (7 * 24 * 60 * 60 * 1000));
  };

  const matchesRecurrencePattern = (date: Date, formData: EventFormData, interval: number = 1): boolean => {
    const startDate = parseDateAsLocal(formData.recurringStartDate);
    if (date < startDate) return false;
    const effectiveInterval = interval > 0 ? interval : 1;
    switch (formData.recurringPattern) {
        case 'daily':
            return getDayDiff(startDate, date) % effectiveInterval === 0;
        case 'weekdays':
            if (effectiveInterval > 1) {
                 if(getWeekDiff(startDate, date, 1) % effectiveInterval !== 0) return false;
            }
            return date.getDay() >= 1 && date.getDay() <= 5;
        case 'custom':
        case 'weekly': {
            if (getWeekDiff(startDate, date, 1) % effectiveInterval !== 0) return false;
            if (!formData.selectedWeekdays || formData.selectedWeekdays.length === 0) {
              return date.getDay() === startDate.getDay();
            }
            return formData.selectedWeekdays.includes(date.getDay());
        }
        case 'monthly': {
            const monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + date.getMonth() - startDate.getMonth();
            if (monthDiff < 0 || monthDiff % effectiveInterval !== 0) return false;
            if (formData.monthlyType === 'date') {
                const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                const targetDate = Math.min(formData.monthlyDate, lastDayOfTargetMonth);
                return date.getDate() === targetDate;
            } else if (formData.monthlyType === 'weekday') {
                return isNthWeekdayOfMonth(date, formData.monthlyWeekday ?? 0, parseInt(formData.monthlyWeek ?? '1'));
            }
            return date.getDate() === startDate.getDate();
        }
        case 'yearly': {
            const yearDiff = date.getFullYear() - startDate.getFullYear();
            if (yearDiff < 0 || yearDiff % effectiveInterval !== 0) return false;
            if (startDate.getMonth() === 1 && startDate.getDate() === 29) {
                const isLeapYear = (year: number) => new Date(year, 1, 29).getDate() === 29;
                if (!isLeapYear(date.getFullYear())) {
                    return date.getMonth() === 1 && date.getDate() === 28;
                }
            }
            return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate();
        }
        default:
            return false;
    }
  };

  const mapPatternToFrequency = (pattern: RecurringPattern): RecurrenceRule['frequency'] => {
    switch (pattern) {
      case 'daily': return 'DAILY';
      case 'custom':
      case 'weekdays':
      case 'weekly': return 'WEEKLY';
      case 'monthly': return 'MONTHLY';
      case 'yearly': return 'YEARLY';
      default: return 'DAILY';
    }
  };

  const isNthWeekdayOfMonth = (date: Date, weekday: number, n: number): boolean => {
    if (date.getDay() !== weekday) return false;
    const dayOfMonth = date.getDate();
    if (n > 0) {
      return Math.ceil(dayOfMonth / 7) === n;
    } else {
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return Math.ceil((lastDay - dayOfMonth + 1) / 7) === Math.abs(n);
    }
  };

/**
   * リソース（施設または備品）と期間を指定してイベントを取得する内部ヘルパー関数
   */
  const getEventsByResourceInRange = async (
    resourceType: 'participant' | 'facility' | 'equipment',
    resourceId: string,
    startDate: string,
    endDate: string
  ): Promise<EventDisplay[]> => {
    const getFieldName = () => {
      switch (resourceType) {
        case 'participant':
          return 'participantIds'
        case 'facility':
          return 'facilityIds'
        case 'equipment':
          return 'equipmentIds'
      }
    }
    const fieldName = getFieldName()
    const preliminaryEvents: EventDisplay[] = [];
    try {
      // 1. 指定されたリソースIDを含む非繰り返しイベントを取得
      const nonRecurringEvents = await eventsService.getListAsync(
        where(fieldName, 'array-contains', resourceId),
        where('dateType', 'in', ['single', 'range'])
      ) as EventData[];

      for (const eventData of nonRecurringEvents) {
        if (eventData.dateType === 'single' && eventData.date && eventData.date >= startDate && eventData.date <= endDate) {
          preliminaryEvents.push(convertToEvent(eventData));
        } else if (eventData.dateType === 'range' && eventData.startDate) {
          const eventEndDate = eventData.endDate || eventData.startDate;
          if (eventData.startDate <= endDate && eventEndDate >= startDate) {
            preliminaryEvents.push(convertToEvent(eventData));
          }
        }
      }

      // 2. 指定されたリソースIDを含む繰り返しイベントのマスターを取得
      const recurringMasterEvents = await eventsService.getListAsync(
        where(fieldName, 'array-contains', resourceId),
        where('dateType', '==', 'recurring')
      ) as EventData[];
      const masterEventIds = recurringMasterEvents.map(e => e.id!);

      if (masterEventIds.length > 0) {
        const masterEventsData = new Map<string, EventData>();
        recurringMasterEvents.forEach(master => masterEventsData.set(master.id!, master));

        // 3. 該当マスターイベントのインスタンスを日付範囲で取得
        const instances = await instancesService.getListAsync(
          where('masterId', 'in', masterEventIds),
          where('instanceDate', '>=', startDate),
          where('instanceDate', '<=', endDate)
        ) as EventInstance[];

        for (const instance of instances) {
          if (instance.status === 'active') {
            const masterEvent = masterEventsData.get(instance.masterId);
            if (masterEvent) {
              preliminaryEvents.push(mergeInstanceWithMaster(instance, masterEvent));
            }
          }
        }
        
        // 4. まだインスタンスが生成されていない繰り返しイベントを検索して追加
        // NOTE: この処理は負荷が高いため、サーバーサイドへの移行を推奨します。
        const rules = await rulesService.getListAsync(where('masterId', 'in', masterEventIds)) as RecurrenceRule[];
        for (const rule of rules) {
            const masterEvent = masterEventsData.get(rule.masterId);
            if (!masterEvent || !masterEvent.startDate) continue;
            if (rule.until && rule.until < startDate) continue;
            if (masterEvent.startDate > endDate) continue;
      
            const formData = { ...masterEvent, recurringStartDate: masterEvent.startDate } as EventFormData;
            const recurringDates = generateRecurringDates(formData, parseDateAsLocal(startDate), parseDateAsLocal(endDate), rule.interval);
      
            for (const date of recurringDates) {
                if (rule.exceptions?.includes(date)) continue;
                if (preliminaryEvents.some(e => e.masterId === rule.masterId && e.date === date)) continue;
                preliminaryEvents.push(mergeInstanceWithMaster({ masterId: rule.masterId, instanceDate: date } as EventInstance, masterEvent));
            }
        }
      }

      // 5. 複数日にまたがるイベントを展開し、最終的なイベントリストを作成
      const finalEvents: EventDisplay[] = [];
      for (const event of preliminaryEvents) {
        if (event.endDate && event.endDate > event.date) {
          const current = parseDateAsLocal(event.date);
          const end = parseDateAsLocal(event.endDate);
          while (current <= end) {
            const dateStr = formatDateForDb(current);
            if (dateStr >= startDate && dateStr <= endDate) {
              finalEvents.push({
                ...event,
                id: event.id,
                segmentId: `${event.id}-${dateStr}`,
                date: dateStr,
                isMultiDay: true,
                isFirstDay: dateStr === event.date,
                isLastDay: dateStr === event.endDate,
              });
            }
            current.setDate(current.getDate() + 1);
          }
        } else {
          if (event.date >= startDate && event.date <= endDate) {
            finalEvents.push({ ...event, id: event.id, segmentId: event.id, isMultiDay: false });
          }
        }
      }

      return finalEvents.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    } catch (error) {
      console.error(`getEventsByResourceInRange (${resourceType}) Error:`, error);
      throw error;
    }
  };

  /**
   * ユーザーIDと期間を指定してイベントを取得する
   */
  const getEventsByParticipantInRange = async (uid: string, startDate: string, endDate: string): Promise<EventDisplay[]> => {
    return getEventsByResourceInRange('participant', uid, startDate, endDate);
  };

  /**
   * 施設IDと期間を指定してイベントを取得する
   */
  const getEventsByFacilityInRange = async (facilityId: string, startDate: string, endDate: string): Promise<EventDisplay[]> => {
    return getEventsByResourceInRange('facility', facilityId, startDate, endDate);
  };

  /**
   * 備品IDと期間を指定してイベントを取得する
   */
  const getEventsByEquipmentInRange = async (equipmentId: string, startDate: string, endDate: string): Promise<EventDisplay[]> => {
    return getEventsByResourceInRange('equipment', equipmentId, startDate, endDate);
  };
  
  return { createEvent, getEventsInRange, getEventsByParticipantInRange, getEventsByFacilityInRange, getEventsByEquipmentInRange };
};