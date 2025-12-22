// composables/useCalendar.ts
import { ref, computed, onMounted, watch } from 'vue';
import { useState } from 'nuxt/app';
import { useEventService } from '~/services/eventService';
import { useMaster } from '~/composables/master/useMaster';
import { printFirestoreDebugSummary } from '~/composables/firebase/useFirestore';
import moment from 'moment-timezone';
import { where } from 'firebase/firestore';
import type { User } from 'firebase/auth';

type CalendarView = 'daily' | 'weekly' | 'monthly';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface CalendarDay {
    date: Date;
    currentMonth: boolean;
}

// --- Cache for master data (既存ロジックを維持) ---
type CacheEntry = {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
};

export const masterDataCache = useState('masterDataCache', () => new Map<string, CacheEntry>());
const CACHE_DURATION_MS = 10 * 60 * 60 * 1000;
const DAILY_OPTIONS_CACHE_DURATION_MS = 60 * 60 * 1000;

type MasterDataKey = 'users' | 'holidays' | 'dailyOptions' | 'facilities' | 'equipments';

/**
 * DailyOptions専用のキャッシュキーを生成する
 * @param startDate 範囲の開始日 (YYYY-MM-DD)
 * @param endDate 範囲の終了日 (YYYY-MM-DD)
 * @returns キャッシュキー文字列
 */
const getDailyOptionsCacheKey = (startDate: string, endDate: string): string => {
    return `dailyOptions:${startDate}_${endDate}`;
};

/**
 * Master data cache API for dailyOptions (useDailyOptionsから利用)
 * 日付範囲をキャッシュキーに含めて、キャッシュを日付範囲ごとに分離する。
 */
export const getDailyOptionsCacheAsync = async (
    forceRefresh = false,
    options: { startDate: string; endDate: string } // options を必須にする
): Promise<{ data: any; fromCache: boolean; timestamp: number }> => {
    const { startDate, endDate } = options;
    const now = Date.now();
    const cacheKey = getDailyOptionsCacheKey(startDate, endDate); // 日付範囲をキーに含める
    const cache = masterDataCache.value.get(cacheKey);
    const duration = DAILY_OPTIONS_CACHE_DURATION_MS;

    if (!forceRefresh && cache && now - cache.timestamp < duration) {
        if (cache.promise) {
            await cache.promise;
            const updatedCache = masterDataCache.value.get(cacheKey);
            if (updatedCache) {
                return { data: updatedCache.data, fromCache: true, timestamp: updatedCache.timestamp };
            }
            return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
        }
        return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
    }

    // ここで useMaster('dailyOptions') を使う代わりに、専用の service を使用するロジックが必要だが、
    // useCalendar.tsでは useMaster() しか使えないため、この関数は useDailyOptionService に依存すべきではない。
    // useDailyOptions.ts で dailyOptionService.getDailyOptionsAsync(startDate, endDate) を直接呼ぶべき。

    // しかし、元のコードが getMasterDataCacheAsync を使っているため、マスターデータとして扱う前提を維持します。
    // ここでは、useMaster('dailyOptions') が日付範囲を自動的に処理することを期待します（元のコードの意図）。

    const masterService = useMaster('daily_user_options');
    // useMaster('dailyOptions') の getListAsync() が options を考慮する実装になっていることを期待
    const query = [
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    ]
    const fetchPromise = masterService.getListAsync(...query); // optionsを渡す

    masterDataCache.value.set(cacheKey, { data: [], timestamp: now, promise: fetchPromise });

    try {
        const data = await fetchPromise;

        const newCacheEntry = { data: data, timestamp: Date.now() };
        masterDataCache.value.set(cacheKey, newCacheEntry);

        return { data: data, fromCache: false, timestamp: newCacheEntry.timestamp };
    } catch (error) {
        console.error(`Failed to fetch dailyOptions for range: ${startDate} - ${endDate}`, error);
        masterDataCache.value.delete(cacheKey);
        throw error;
    }
};

/**
 * Master data cache API (既存ロジックを流用)
 */
export const getMasterDataCacheAsync = async (
    key: MasterDataKey,
    forceRefresh = false,
    options?: { startDate?: string; endDate?: string }
): Promise<{ data: any; fromCache: boolean; timestamp: number }> => {
    const now = Date.now();
    const cacheKey = key;
    const cache = masterDataCache.value.get(cacheKey);
    const duration = key === 'dailyOptions' ? DAILY_OPTIONS_CACHE_DURATION_MS : CACHE_DURATION_MS;

    if (!forceRefresh && cache && now - cache.timestamp < duration) {
        if (cache.promise) {
            await cache.promise;
            const updatedCache = masterDataCache.value.get(cacheKey);
            if (updatedCache) {
                return { data: updatedCache.data, fromCache: true, timestamp: updatedCache.timestamp };
            }
            return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
        }
        return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
    }

    const masterService = useMaster(key);
    const fetchPromise = masterService.getListAsync();

    masterDataCache.value.set(cacheKey, { data: [], timestamp: now, promise: fetchPromise });

    try {
        const data = await fetchPromise;

        const newCacheEntry = { data: data, timestamp: Date.now() };
        masterDataCache.value.set(cacheKey, newCacheEntry);

        return { data: data, fromCache: false, timestamp: newCacheEntry.timestamp };
    } catch (error) {
        console.error(`Failed to fetch master data for key: ${key}`, error);
        masterDataCache.value.delete(cacheKey);
        throw error;
    }
};

export const getMasterDataCache = () => masterDataCache;

// --- メインコンポーザブル ---
export const useCalendar = () => {
    // const  currentUserId= ref('dummy-user-id-001');

    const user = useState<User>('user')

    const currentUserId = computed(() => {
        return user.value?.uid || 'dummy-user-id-001';
    });

    const eventService = useEventService();

    // --- リアクティブな状態 ---
    const currentDate = ref(new Date());
    const selectedDate = ref(new Date());
    const currentView = ref<CalendarView>('monthly');
    const users = ref<UserWithVisibility[]>([]);
    const facilities = ref<MasterItem[]>([]);
    const equipments = ref<MasterItem[]>([]);
    const events = ref<EventDisplay[]>([]);
    const holidays = ref<Holiday[]>([]);
    const isLoading = ref(false);

    // --- Utility Functions (EventForm.vueが依存する関数群) ---
    const TIME_ZONE = 'Asia/Tokyo';

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        return moment(date).tz(TIME_ZONE).format('YYYY/MM/DD');
    };

    const formatDatetime = (date: Date | null): string => {
        if (!date) return '';
        return moment(date).tz(TIME_ZONE).format('YYYY/MM/DD HH:mm:ss');
    };

    const formatShortDate = (date: Date | null): string => {
        if (!date) return '';
        return moment(date).tz(TIME_ZONE).format('MM/DD');
    };

    const formatDateForDb = (date: Date): string => {
        if (!date) return '';
        return moment(date).tz(TIME_ZONE).format('YYYY-MM-DD');
    };

    const getDayOfWeek = (date: Date): string => ['日', '月', '火', '水', '木', '金', '土'][moment(date).tz(TIME_ZONE).day()];

    const timeToPixels = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return ((hours - 9) * 60 + minutes) * (32 / 30);
    };

    const timeToPixelsForHorizontal = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return ((hours - 9) * 60 + minutes) * (96 / 30);
    };

    const getCacheKeyForDate = (dateStr: string): string => {
        const date = moment.tz(dateStr, TIME_ZONE);
        const year = date.isoWeekYear();
        const week = date.isoWeek().toString().padStart(2, '0');
        return `${year}-${week}`;
    };

    const convertFormDataToEventDisplay = (id: string, formData: EventFormData): EventDisplay => {
        // EventFormData には、登録時に EventService 側で設定された masterId などは含まれていないため、
        // 単一イベントの登録完了直後の画面更新に特化して、最低限の情報を変換します。
        // 期間/繰り返しイベントは実体化されるため、この変換は単一イベントにのみ適用することが最も安全です。

        const dateStr = formData.dateType === 'single' ? formData.date! : formData.startDate!
        const endDateStr = formData.dateType === 'single' ? formData.date : formData.endDate;

        return {
            id: id,
            title: formData.title,
            date: dateStr,
            endDate: endDateStr,
            startTime: formData.startTime || '09:00', // デフォルト値を想定
            endTime: formData.endTime || '18:00',     // デフォルト値を想定
            location: formData.location,
            description: formData.description,
            priority: formData.priority,
            participantIds: formData.participantIds || [],
            participants: formData.participants,
            facilityIds: formData.facilityIds || [],
            facilities: formData.facilities,
            equipmentIds: formData.equipmentIds || [],
            equipments: formData.equipments,
            isRecurring: false,
            masterId: undefined, // 直接登録の場合 masterId は設定されない
            isException: false,
            eventType: formData.eventType as any,
            eventTypeName: formData.eventTypeName,
            eventTypeColor: formData.eventTypeColor,
            private: formData.private,
            conflicted: false,
        } as EventDisplay;
    };

    /**
     * イベント登録を実行し、成功した場合にメモリ上のイベントリストを更新する
     * @param formData イベントフォームデータ
     * @returns 登録されたイベントIDの配列
     */
    const createEventAndRefresh = async (formData: EventFormData): Promise<string[]> => {
        // 1. Firestoreにイベントを登録し、IDを取得
        //    注: EventServiceは期間/繰り返しイベントを実体化し、複数のIDを返します
        const newIds = await eventService.createEvent(formData);

        // 2. メモリ上の events.value を直接更新
        if (formData.dateType === 'single' && newIds.length === 1) {
            // 単一イベントの場合のみ、即座にメモリに追加
            const newEvent = convertFormDataToEventDisplay(newIds[0], formData);

            // プライベートイベントのマスキング処理を実行
            const maskedEvent = filterPrivateEvents([newEvent], currentUserId.value)[0];

            events.value.push(maskedEvent);

            // 3. ソートして表示を更新
            events.value = events.value.sort((a, b) =>
                a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
            );
        }

        // 4. (非同期で) キャッシュの更新を待つ
        //    ⇒ 期間・繰り返しイベントはここで refreshEvents を呼んでも、キャッシュが未更新のため表示されない。
        //       そのため、更新は強制的に行わず、キャッシュ更新後に自動的に反映されるのを待つ。
        //       今回は単一イベントの即時反映のみに絞る。

        return newIds;
    };

    /**
     * イベント更新を実行し、成功した場合にメモリ上のイベントリストを更新する
     * @param initialData 更新前のイベントデータ (idを含む)
     * @param formData 更新するイベントフォームデータ
     * @returns 更新されたイベントIDの配列
     */
    const updateEventAndRefresh = async (initialData: EventData, formData: EventFormData): Promise<string[]> => {
        if (!initialData.id || initialData.dateType !== 'single' || formData.dateType !== 'single') {
            throw new Error('メモリ上の即時更新は単一イベントでのみサポートされています。');
        }

        // 1. Firestoreにイベントを更新
        const updatedIds = await eventService.updateEvent(initialData, formData);

        // 2. メモリ上の events.value を直接更新
        if (updatedIds.length === 1 && updatedIds[0] === initialData.id) {
            const updatedEvent = convertFormDataToEventDisplay(initialData.id, formData);

            // プライベートイベントのマスキング処理を実行
            const maskedEvent = filterPrivateEvents([updatedEvent], currentUserId.value)[0];

            const index = events.value.findIndex(e => e.id === initialData.id);
            if (index !== -1) {
                // 既存のイベントを新しいデータで置き換え
                events.value[index] = maskedEvent;
            } else {
                // IDが見つからない場合は追加 (日付が変わった場合などに備えて)
                events.value.push(maskedEvent);
            }

            // 3. ソートして表示を更新
            events.value = events.value.sort((a, b) =>
                a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
            );
        }

        return updatedIds;
    };

    /**
     * イベント削除を実行し、成功した場合にメモリ上のイベントリストを更新する
     * @param eventId 削除するイベントID
     * @param option 削除オプション: 'single', 'all', 'after', 'before'
     * @param targetDate 日付指定の際の基準日 (YYYY-MM-DD形式)
     */
    const deleteEventAndRefresh = async (
        eventId: string,
        option?: 'single' | 'all' | 'after' | 'before',
        targetDate?: string
    ): Promise<void> => {
        if (!eventId) return;

        // 1. Firestoreからイベントを削除 (オプションを渡す)
        const deletedIds = await eventService.deleteEvent(eventId, option, targetDate);

        // メモリ上の events.value から削除されたIDを反映
        if (deletedIds.length > 0) {
            events.value = events.value.filter(e => !deletedIds.includes(e.id!));
            console.log('Deleted event IDs:', deletedIds);
        }

        // // 2. メモリ上の events.value から該当IDのイベントを削除 (単一削除の場合のみ)
        // // ※ 'all' の場合は多数のイベントが削除されるため、ここではメモリ上の更新は諦め、
        // //    次の refreshEvents で全体のデータを再取得することが確実です。
        // if (option === 'single' || option === undefined) {
        //     events.value = events.value.filter(e => e.id !== eventId);
        // } else {
        //     // 大量削除の可能性がある場合は、データ全体をリフレッシュ
        //     await refreshEvents();
        // }
        
        // 3. 画面に反映
        // events.value の更新で自動的に画面が更新されます。
    };

    // --- Date Range Calculation (既存ロジックを維持) ---
    const getCurrentDateRange = (): DateRange => {
        const d = new Date(currentDate.value);
        let startDate: Date, endDate: Date;

        if (currentView.value === 'monthly') {
            const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const startDayIndex = firstDayOfMonth.getDay();

            startDate = new Date(firstDayOfMonth);
            startDate.setDate(firstDayOfMonth.getDate() - startDayIndex);

            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 41);
        } else if (currentView.value === 'weekly') {
            const dayOfWeek = d.getDay();
            startDate = new Date(d);
            startDate.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
        } else { // daily
            startDate = d;
            endDate = d;
        }
        return { startDate: formatDateForDb(startDate), endDate: formatDateForDb(endDate) };
    };

    // --- イベント取得キーの計算 ---
    const getWeeksInView = (date: Date, view: CalendarView): string[] => {
        const dateStr = formatDateForDb(date);
        let current = moment.tz(dateStr, TIME_ZONE);
        const keys = new Set<string>();

        if (view === 'weekly') {
            keys.add(getCacheKeyForDate(current.format('YYYY-MM-DD')));
        } else if (view === 'monthly') {
            const startOfMonth = current.clone().startOf('month').startOf('isoWeek');
            const endOfMonth = current.clone().endOf('month').endOf('isoWeek');

            let temp = startOfMonth.clone();
            while (temp.isSameOrBefore(endOfMonth)) {
                keys.add(getCacheKeyForDate(temp.format('YYYY-MM-DD')));
                temp.add(1, 'week');
            }
        } else if (view === 'daily') {
            keys.add(getCacheKeyForDate(current.format('YYYY-MM-DD')));
        }

        return Array.from(keys);
    };

    // --- プライベートイベントのフィルタリング/マスキング ---
    const filterPrivateEvents = (events: EventDisplay[], userId: string): EventDisplay[] => {
        return events.map(event => {
            if (event.private && !event.participantIds?.includes(userId)) {
                return {
                    ...event,
                    title: '予定あり (非公開)',
                    location: '',
                    description: '',
                    eventTypeName: 'Private',
                    eventTypeColor: '#9CA3AF',
                    participantIds: [],
                    participants: [],
                    facilityIds: [],
                    facilities: [],
                    equipmentIds: [],
                    equipments: [],
                } as EventDisplay;
            }
            return event;
        });
    };

    // --- イベントロード関数 (Core Logic) ---
    // eventService.tsでデフォルトtrueになっているため、常に最新を取得
    const refreshEvents = async (): Promise<void> => {
        if (isLoading.value) return;

        isLoading.value = true;
        try {
            // 1. 表示範囲から必要な週キーを計算
            const cacheKeys = getWeeksInView(currentDate.value, currentView.value);

            // 2. 全ての週のキャッシュを並列で取得
            const fetchPromises = cacheKeys.map(key => eventService.getEventsFromCacheAsync(key));
            const results = await Promise.all(fetchPromises);

            // 3. 結果を統合し、重複を排除
            let allEvents: EventDisplay[] = results.flat().reduce((acc, current) => {
                // IDで重複を排除
                if (!acc.some(item => item.id === current.id)) {
                    acc.push(current);
                }
                return acc;
            }, [] as EventDisplay[]);

            // 4. プライベートイベントのフィルタリング/マスキングを実行
            allEvents = filterPrivateEvents(allEvents, currentUserId.value);

            // 5. リアクティブな変数にセット
            events.value = allEvents.sort((a, b) =>
                a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
            );

            // 6. デバッグサマリーの表示 (既存コードで存在)
            printFirestoreDebugSummary();

        } catch (error) {
            console.error("Failed to load events from cache:", error);
            events.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    // --- データロード関数 (マスターデータ + イベント) ---
    const loadData = async (forceRefresh = false): Promise<void> => {
        // ロード中の多重実行を防ぐ
        if (isLoading.value) return;

        // 1. マスターデータのロード (forceRefresh に従う)
        try {
            const usersResult = await getMasterDataCacheAsync('users', forceRefresh);
            const holidaysResult = await getMasterDataCacheAsync('holidays', forceRefresh);
            users.value = usersResult.data.map((u: ExtendedUserProfile) => ({ ...u, visible: true }));
            holidays.value = holidaysResult.data;
        } catch (e) {
            console.error("Failed to load master data:", e);
        }

        // 2. イベントデータのロード (常にブラウザキャッシュを無視して実行)
        await refreshEvents();
    };


    // --- カレンダー操作関数 ---

    const setView = (view: CalendarView): void => {
        currentView.value = view;
    };

    const selectDay = (date: Date): void => {
        selectedDate.value = date;
    };

    // 日付移動ヘルパー (Moment.jsを使用)
    const moveDate = (unit: 'day' | 'week' | 'month', amount: number): void => {
        const newDate = moment(currentDate.value).add(amount, unit).toDate();
        currentDate.value = newDate;
        if (currentView.value === 'daily') {
            selectedDate.value = newDate;
        }
    };

    const goToToday = (): void => {
        const today = new Date();
        currentDate.value = today;
        selectedDate.value = today;
    };

    const goToSelectDate = (date: Date): void => {
        currentDate.value = date;
        selectedDate.value = date;
    };

    const previousDay = (): void => moveDate('day', -1);
    const nextDay = (): void => moveDate('day', 1);
    const previousWeek = (): void => moveDate('week', -1);
    const nextWeek = (): void => moveDate('week', 1);
    const previousMonth = (): void => moveDate('month', -1);
    const nextMonth = (): void => moveDate('month', 1);


    // --- イベント取得ヘルパー ---
    const getSchedulesForDay = (date: Date, userId?: string): EventDisplay[] => {
        const dateStr = formatDateForDb(date);
        let dayEvents = events.value.filter(e => e.date === dateStr);

        if (userId) {
            dayEvents = dayEvents.filter(e => e.participantIds?.includes(userId));
        }

        return dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getUserSchedulesForDay = (userId: string, date: Date | null): EventDisplay[] => {
        if (!date) return [];
        return getSchedulesForDay(date, userId);
    };

    // --- カレンダー描画用 Computed ---
    const generateWeekDays = computed<Date[]>(() => {
        const week: Date[] = [];
        const start = moment(currentDate.value).startOf('isoWeek');
        for (let i = 0; i < 7; i++) {
            week.push(start.clone().add(i, 'days').toDate());
        }
        return week;
    });

    const generateCalendarDays = computed<CalendarDay[]>(() => {
        const days: CalendarDay[] = [];
        const d = currentDate.value;
        const month = moment(d).month();
        const startDate = moment(d).startOf('month').startOf('isoWeek');

        for (let i = 0; i < 42; i++) {
            const day = startDate.clone().add(i - 1, 'days');
            days.push({ date: day.toDate(), currentMonth: day.month() === month });
        }
        return days;
    });

    const timeSlots = computed<string[]>(() => {
        const slots: string[] = [];
        for (let hour = 9; hour <= 18; hour++) {
            slots.push(`${hour}:00`);
            slots.push(`${hour}:30`);
        }
        return slots;
    });

    // --- Holiday Helpers ---
    const isHoliday = (date: Date): boolean => holidays.value.some(h => h.date === formatDateForDb(date));
    const getHolidayName = (date: Date): string => holidays.value.find(h => h.date === formatDateForDb(date))?.name || '';
    const toggleUserVisibility = (userId: string): void => {
        const user = users.value.find(u => u.uid === userId);
        if (user) user.visible = !user.visible;
    };

    // Calendar Position Persistence (既存ロジックを維持)
    const CALENDAR_POSITION_KEY = 'calendar-current-date';

    const saveCalendarPosition = () => {
        if (import.meta.client) {
            try {
                localStorage.setItem(CALENDAR_POSITION_KEY, formatDateForDb(currentDate.value));
            } catch (error) {
                console.warn('Failed to save calendar position:', error);
            }
        }
    };

    const loadCalendarPosition = (): Date | null => {
        if (import.meta.client) {
            try {
                const savedDate = localStorage.getItem(CALENDAR_POSITION_KEY);
                if (savedDate) {
                    const date = new Date(savedDate);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            } catch (error) {
                console.warn('Failed to load calendar position:', error);
            }
        }
        return null;
    };

    const clearCalendarPosition = () => {
        if (import.meta.client) {
            try {
                localStorage.removeItem(CALENDAR_POSITION_KEY);
            } catch (error) {
                console.warn('Failed to clear calendar position:', error);
            }
        }
    };


    // --- Lifecycle and Watchers ---
    let isInitialLoad = true;
    onMounted(() => {
        // ページロード時に強制リフレッシュ
        loadData(true);
    });

    // onMounted後の変更を監視し、ロード処理を実行
    watch([currentDate, currentView], () => {
        if (isInitialLoad) {
            isInitialLoad = false;
            return;
        }
        // 日付・ビュー変更時は、マスターはキャッシュ利用、イベントは最新を取得
        loadData(false);
    }, { deep: true });

    // --- 公開するプロパティと関数 ---
    return {
        currentDate,
        selectedDate,
        currentView,
        users,
        facilities,
        equipments,
        events,
        holidays,
        isLoading,

        createEventAndRefresh,
        updateEventAndRefresh,
        deleteEventAndRefresh,

        loadData,
        refreshEvents,

        setView,
        selectDay,

        previousDay,
        nextDay,
        previousWeek,
        nextWeek,
        previousMonth,
        nextMonth,

        goToToday,
        goToSelectDate,

        getSchedulesForDay,
        getUserSchedulesForDay,
        isHoliday,
        getHolidayName,
        toggleUserVisibility,

        // EventForm.vue や他のコンポーネントで必要とされるユーティリティ関数
        formatDate,
        formatDatetime,
        formatShortDate,
        formatDateForDb,
        getDayOfWeek,
        timeToPixels,
        timeToPixelsForHorizontal,

        generateCalendarDays,
        generateWeekDays,
        timeSlots,

        // Calendar Position Persistence (既存コードで存在)
        saveCalendarPosition,
        loadCalendarPosition,
        clearCalendarPosition,
    };
};