// services/eventService.ts

import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { useFirestore } from '~/composables/firebase/useFirestore'
import { where } from 'firebase/firestore'
import moment from 'moment-timezone'
import { useUuid } from '~/composables/common/useUuid'

const { generateUuid } = useUuid()

// --- 定数 (Functionsと同期) ---
const TIME_ZONE = 'Asia/Tokyo';
const CACHE_BASE_URL = 'https://firebasestorage.googleapis.com/v0/b/';
const PROJECT_ID = 'tascal-app-a344b'; 
const CACHE_PATH = 'o/calendar-cache%2F';

export const useEventService = () => {
    const eventsService = useFirestoreGeneral('events')
    const { addWithBatch } = useFirestore()

    // --- Date Utility Functions ---
    const getCacheKeyForDate = (dateStr: string): string => {
        const date = moment.tz(dateStr, TIME_ZONE);
        const year = date.isoWeekYear();
        const week = date.isoWeek().toString().padStart(2, '0');
        return `${year}-${week}`;
    }
    
    const formatDateForDb = (date: Date): string => {
        return moment(date).tz(TIME_ZONE).format('YYYY-MM-DD');
    };
    const parseDateAsLocal = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

    const getDayDiff = (d1: Date, d2: Date): number => {
      const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
      const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
      return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    };

    // --- Recurrence Date Generation Utility (簡略化版を再構築) ---
    const generateRecurringDates = (
        formData: EventFormData,
        viewStartDate: Date,
        viewEndDate: Date,
        interval: number = 1
    ): string[] => {
        const resultDates: string[] = [];
        const recurrenceStartDate = parseDateAsLocal(formData.recurringStartDate);
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
            if (current > viewEndDate) break;

            let matches = false;
            const startDate = recurrenceStartDate;
            const effectiveInterval = interval > 0 ? interval : 1;
            const dayOfWeek = current.getDay();
            
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
                // 月次/年次ロジックは省略
                default:
                    matches = false;
                    break;
            }

            if (matches) {
                generatedCount++;
                if (current >= startDate) { 
                    resultDates.push(formatDateForDb(current));
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return resultDates.filter(dateStr => dateStr >= formatDateForDb(viewStartDate) && dateStr <= formatDateForDb(viewEndDate));
    };

    // --- キャッシュ取得ロジック ---
    const getEventsFromCacheAsync = async (cacheKey: string): Promise<EventDisplay[]> => {
        const fileName = `${cacheKey}-cache.json`;
        const url = `${CACHE_BASE_URL}${PROJECT_ID}.firebasestorage.app/${CACHE_PATH}${fileName}?alt=media`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) return [];
                throw new Error(`Failed to fetch cache (${response.status})`);
            }
            const cacheData = await response.json();
            return cacheData.events || [];

        } catch (error) {
            console.error(`getEventsFromCacheAsync Error for ${cacheKey}:`, error);
            return [];
        }
    };
    
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
            eventType: eventData.eventType as any, eventTypeName: eventData.eventTypeName, eventTypeColor: eventData.eventTypeColor,
            private: eventData.private,
            conflicted: false,
        } as EventDisplay;
    };


    // --- メイン関数: createEvent (バッチ登録ロジックの復元) ---
    
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
            dateType: 'single', // 実体化されたイベントは 'single' 相当として扱う
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
            eventTypeName: formData.eventTypeName,
            eventTypeColor: formData.eventTypeColor,
            private: formData.private,
        };

        let eventsToSave: (Partial<EventData> & { date: string })[] = [];
        
        // 複数イベントを関連付けるためのマスターIDを生成
        const masterRefForId = generateUuid(); 
        const masterId = formData.dateType !== 'single' ? masterRefForId : undefined;

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
                    startDate: formData.startDate, // 元の期間情報
                    endDate: formData.endDate,     // 元の期間情報
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
                    // 繰り返しルールの詳細も保持
                    selectedWeekdays: formData.selectedWeekdays,
                    monthlyType: formData.monthlyType,
                    monthlyDate: formData.monthlyDate,
                    monthlyWeek: formData.monthlyWeek,
                    recurringEndType: formData.recurringEndType,
                    recurringEndDate: formData.recurringEndDate,
                    recurringCount: formData.recurringCount,
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

    // --- EventForm.vue向け リソース別取得関数 (キャッシュからフィルタリング) ---

    /**
     * キャッシュからデータを取得し、指定された日付とリソースでフィルタリングする
     */
    const getEventsByResourceInRange = async (
        resourceType: 'participant' | 'facility' | 'equipment',
        resourceId: string,
        startDate: string, // 単日チェックを想定 (startDate === endDate)
        endDate: string
    ): Promise<EventDisplay[]> => {
        // 1. 該当日の週キャッシュキーを取得
        const cacheKey = getCacheKeyForDate(startDate);
        
        // 2. キャッシュファイルをロード
        const allEvents = await getEventsFromCacheAsync(cacheKey);

        // 3. 日付とリソースIDでフィルタリング
        const filteredEvents = allEvents.filter(event => {
            const isTargetDate = event.date >= startDate && event.date <= endDate;
            
            let isResourceMatch = false;
            // participantIds は配列として存在すると想定
            if (resourceType === 'participant' && event.participantIds?.includes(resourceId)) {
                isResourceMatch = true;
            } 
            // facilityIds, equipmentIds も同様に配列として存在すると想定
            else if (resourceType === 'facility' && event.facilityIds?.includes(resourceId)) {
                isResourceMatch = true;
            } else if (resourceType === 'equipment' && event.equipmentIds?.includes(resourceId)) {
                isResourceMatch = true;
            }

            return isTargetDate && isResourceMatch;
        });

        return filteredEvents.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    };

    /**
     * 全イベント取得 (キャッシュ利用) - useCalendar.tsで使用される
     */
    const getEventsInRange = async (startDate: string, endDate: string): Promise<EventDisplay[]> => {
         // この関数は useCalendar.ts の refreshEvents の方が効率的なため、エラーを返すか、キャッシュ取得ロジックに置き換える
         throw new Error("getEventsInRange は EventService では廃止されました。useCalendar.ts の refreshEvents を使用してください。");
    };

    return { 
        createEvent, // 復元
        
        // EventForm.vueが依存する関数をキャッシュベースで提供
        getEventsByParticipantInRange: (uid: string, startDate: string, endDate: string) => getEventsByResourceInRange('participant', uid, startDate, endDate),
        getEventsByFacilityInRange: (facilityId: string, startDate: string, endDate: string) => getEventsByResourceInRange('facility', facilityId, startDate, endDate),
        getEventsByEquipmentInRange: (equipmentId: string, startDate: string, endDate: string) => getEventsByResourceInRange('equipment', equipmentId, startDate, endDate),
        
        // useCalendar.ts が依存するユーティリティ
        getEventsFromCacheAsync,
        getCacheKeyForDate,
        getEventsInRange, // 互換性維持のため公開 (エラーをスローするが型は満たす)
    };
};