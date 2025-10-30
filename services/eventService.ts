// services/eventService.ts

import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { useFirestore } from '~/composables/firebase/useFirestore'
import { where } from 'firebase/firestore'
import moment from 'moment-timezone' // 日付処理ライブラリの使用を想定
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
    
    // YYYY-MM-DD形式
    const formatDateForDb = (date: Date): string => {
        return moment(date).tz(TIME_ZONE).format('YYYY-MM-DD');
    };
    const parseDateAsLocal = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

    // --- キャッシュ取得ロジック (useCalendar.tsと共通) ---
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
    
    // --- イベント登録 (EventForm.vueが依存) ---
    const createEvent = async (formData: EventFormData): Promise<string[]> => {
        // ... (既存のバッチ登録ロジックを全て維持) ...
        // createEvent の実装は、以前の改修案で提供されたバッチ登録ロジックを使用します
        
        const baseEventData: Partial<EventData> = { /* ... */ };
        let eventsToSave: (Partial<EventData> & { date: string })[] = [];

        // Date generation logic using parseDateAsLocal, formatDateForDb, and generateRecurringDates (assumed to be available)
        
        if (formData.dateType === 'single') {
            eventsToSave.push({ ...baseEventData, date: formData.date!, });
        } else if (formData.dateType === 'range') {
            // Range generation logic here
        } else if (formData.dateType === 'recurring') {
            // Recurrence generation logic here
        }

        if (eventsToSave.length === 0) { throw new Error('保存対象のイベントがありません。'); }

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
        startDate: string, // 実際は単日チェック (startDate === endDate) を想定
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
            if (resourceType === 'participant' && event.participantIds?.includes(resourceId)) {
                isResourceMatch = true;
            } else if (resourceType === 'facility' && event.facilityIds?.includes(resourceId)) {
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
        // 期間が複数週にまたがる場合、全ての週キーを取得する必要がある
        // ここでは useCalendar.ts の refreshEvents ロジックに任せるため、単一週の取得に限定（またはこの関数を廃止）
        // EventForm.vue はこの関数に依存していないため、今回はキャッシュ方式への移行で廃止します。
        throw new Error("getEventsInRange は EventService では廃止されました。useCalendar.ts の refreshEvents を使用してください。");
    };

    return { 
        createEvent, // 復活
        
        // EventForm.vueが依存する関数をキャッシュベースで提供
        getEventsByParticipantInRange: (uid: string, startDate: string, endDate: string) => getEventsByResourceInRange('participant', uid, startDate, endDate),
        getEventsByFacilityInRange: (facilityId: string, startDate: string, endDate: string) => getEventsByResourceInRange('facility', facilityId, startDate, endDate),
        getEventsByEquipmentInRange: (equipmentId: string, startDate: string, endDate: string) => getEventsByResourceInRange('equipment', equipmentId, startDate, endDate),
        
        // useCalendar.ts が依存するユーティリティ
        getEventsFromCacheAsync,
        getCacheKeyForDate,
    };
};