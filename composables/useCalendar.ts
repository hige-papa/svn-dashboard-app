// composables/useCalendar.ts
import { ref, computed, onMounted, watch } from 'vue';
import { useState } from 'nuxt/app';
import { useEventService } from '~/services/eventService';
import { useMaster } from '~/composables/master/useMaster';
import { printFirestoreDebugSummary } from '~/composables/firebase/useFirestore';
import moment from 'moment-timezone'; // 日付処理ライブラリの使用を想定

// --- 共通型定義 (EventForm.d.tsから参照) ---
// useCalendarが依存するインターフェースをローカルに定義またはインポート
// interface ExtendedUserProfile {
//     uid: string;
//     displayName: string;
//     email: string;
//     photoURL?: string;
//     department?: string;
//     position?: string;
// }

// interface UserWithVisibility extends ExtendedUserProfile {
//     visible: boolean;
// }

// interface Holiday {
//     id: string;
//     date: string; // YYYY-MM-DD
//     name: string;
// }

type CalendarView = 'daily' | 'weekly' | 'monthly';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface CalendarDay {
    date: Date;
    currentMonth: boolean;
}

// interface EventDisplay {
//     id: string; 
//     title: string;
//     date: string; // YYYY-MM-DD
//     endDate?: string;
//     startTime: string;
//     endTime: string;
//     priority: 'low' | 'medium' | 'high';
//     participantIds: string[];
//     participants: string[];
//     facilityIds?: string[];
//     facilities?: string[];
//     equipmentIds?: string[];
//     equipments?: string[];
    
//     eventTypeName: string;
//     eventTypeColor: string;
//     private: boolean;

//     segmentId?: string;
//     isRecurring?: boolean;
//     masterId?: string;
//     isException?: boolean;
//     isMultiDay?: boolean;
//     isFirstDay?: boolean;
//     isLastDay?: boolean;
//     conflicted: boolean; 
//     description?: string;
//     location?: string;
// }

// --- Cache for master data (既存ロジックを維持) ---
type CacheEntry = {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
};

export const masterDataCache = useState('masterDataCache', () => new Map<string, CacheEntry>());
const CACHE_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours for users/holidays
const DAILY_OPTIONS_CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes for dailyOptions

type MasterDataKey = 'users' | 'holidays' | 'dailyOptions' | 'facilities' | 'equipments'; // 👈 追加

/**
 * Master data cache API (既存ロジックを流用)
 * ※ useMaster.ts/useFirestore.ts に依存
 */
export const getMasterDataCacheAsync = async (
  key: MasterDataKey, // 👈 変更
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
            // Fallback to the previous cache entry if the updated one is missing
            return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
        }
        return { data: cache.data, fromCache: true, timestamp: cache.timestamp };
    }

    const masterService = useMaster(key); // ★ key をコレクション名として使用
    
    // DailyOptions の場合は、日付範囲フィルタリングが必要な可能性があるが、
    // useMaster.ts の getListAsync は QueryConstraint を受け取るため、ここでは汎用的に呼び出し
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
    const currentUserId = ref('dummy-user-id-001'); // 暫定的なユーザーID (ログインユーザーIDに置き換える)

    const eventService = useEventService();
    // useMaster は getMasterDataCacheAsync 内で利用されるため、ここでは省略
    
    // --- リアクティブな状態 ---
    const currentDate = ref(new Date());
    const selectedDate = ref(new Date());
    const currentView = ref<CalendarView>('monthly');
    const users = ref<UserWithVisibility[]>([]);
    const facilities = ref<MasterItem[]>([]); // 👈 追加: 施設マスター
    const equipments = ref<MasterItem[]>([]); // 👈 追加: 備品マスター
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
      // Firestoreの date フィールドは YYYY-MM-DD 形式
      return moment(date).tz(TIME_ZONE).format('YYYY-MM-DD');
    };

    const getDayOfWeek = (date: Date): string => ['日', '月', '火', '水', '木', '金', '土'][moment(date).tz(TIME_ZONE).day()];
    
    // timeToPixels: 9:00を0とする
    const timeToPixels = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return ((hours - 9) * 60 + minutes) * (32 / 30);
    };

    const timeToPixelsForHorizontal = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        // 30分あたりの幅を96pxとして計算
        return ((hours - 9) * 60 + minutes) * (96 / 30);
    };
    
    const getCacheKeyForDate = (dateStr: string): string => {
        // useEventService に依存するが、ここではユーティリティとして提供
        const date = moment.tz(dateStr, TIME_ZONE);
        const year = date.isoWeekYear();
        const week = date.isoWeek().toString().padStart(2, '0');
        return `${year}-${week}`;
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
        // 1. マスターデータのロード (既存ロジックを維持 - useMasterに依存)
        try {
             // 実際には useMaster().getMasterDataCacheAsync を呼び出す
            const usersResult = await getMasterDataCacheAsync('users', forceRefresh);
            const holidaysResult = await getMasterDataCacheAsync('holidays', forceRefresh);
            users.value = usersResult.data.map((u: ExtendedUserProfile) => ({ ...u, visible: true }));
            holidays.value = holidaysResult.data;
        } catch (e) {
            console.error("Failed to load master data:", e);
        }

        // 2. イベントデータのロード (キャッシュ取得に置き換え)
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
          // ユーザーの表示設定と参加者フィルタリング (ここではユーザーvisibleフラグは省略)
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
            const day = startDate.clone().add(i, 'days');
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
    onMounted(() => {
        loadData();
    });

    watch([currentDate, currentView], () => {
        loadData(false); 
    }, { deep: true });

    // --- 公開するプロパティと関数 ---
    return {
      currentDate,
      selectedDate,
      currentView,
      users,
      facilities, // 👈 公開
      equipments, // 👈 公開
      events,
      holidays,
      isLoading,
      
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
      toggleUserVisibility, // 既存コードで存在

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