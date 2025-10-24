// composables/useCalendar.ts
import { ref, computed, onMounted, watch } from 'vue';
import { useState } from 'nuxt/app';
import { useEventService } from '~/services/eventService';
import { useMaster } from '~/composables/master/useMaster';
import { printFirestoreDebugSummary } from '~/composables/firebase/useFirestore';

// --- Cache for master data ---
type CacheEntry = {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
};

export const masterDataCache = useState('masterDataCache', () => new Map<string, CacheEntry>());
const CACHE_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours (36000 seconds) for users/holidays
const DAILY_OPTIONS_CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes (3600 seconds) for dailyOptions
const MY_EVENTS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes (1800 seconds) for my events

/**
 * Get cached events for the current user (localStorage-based)
 * @param uid - User ID
 * @param dateRange - Date range for events
 * @returns Cached events array or null if cache miss/expired
 */
const getCachedMyEvents = (uid: string, dateRange: { startDate: string; endDate: string }): EventDisplay[] | null => {
  if (!import.meta.client) return null;
  
  try {
    const cacheKey = `my-events-cache:${uid}:${dateRange.startDate}:${dateRange.endDate}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      console.log('[EventCache] Miss - no cached data found');
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if ((now - timestamp) > MY_EVENTS_CACHE_DURATION_MS) {
      console.log('[EventCache] Miss - cache expired');
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log('[EventCache] Hit - returning cached events');
    return data;
  } catch (error) {
    console.warn('[EventCache] Error reading cache:', error);
    return null;
  }
};

/**
 * Set cached events for the current user (localStorage-based)
 * @param uid - User ID
 * @param dateRange - Date range for events
 * @param allEvents - All events to cache (will filter for user)
 */
const setCachedMyEvents = (uid: string, dateRange: { startDate: string; endDate: string }, allEvents: EventDisplay[]): void => {
  if (!import.meta.client) return;
  
  try {
    const cacheKey = `my-events-cache:${uid}:${dateRange.startDate}:${dateRange.endDate}`;
    const myEvents = allEvents.filter(event => event.participantIds?.includes(uid));
    const cacheData = {
      data: myEvents,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[EventCache] Cached ${myEvents.length} events for user ${uid}`);
  } catch (error) {
    console.warn('[EventCache] Error writing cache:', error);
  }
};


/**
 * Master data cache API with TTL, in-flight deduplication, and error handling
 * @param key - Cache key ('users' | 'holidays' | 'dailyOptions')
 * @param forceRefresh - Force refetch from Firestore, bypassing cache
 * @param options - Optional parameters (dateRange for dailyOptions)
 * @returns Promise with data, fromCache flag, and timestamp
 */
export const getMasterDataCacheAsync = async (
  key: 'users' | 'holidays' | 'dailyOptions',
  forceRefresh = false,
  options?: { startDate?: string; endDate?: string }
): Promise<{ data: any; fromCache: boolean; timestamp: number }> => {
  const now = Date.now();
  const { getListAsync: getHolidaysListAsync } = useMaster('holidays');
  const { getListAsync: getUsersListAsync } = useMaster('users');
  const { getListAsync: getDailyOptionsListAsync } = useMaster('daily_user_options');

  // Build cache key (include date range for dailyOptions)
  const cacheKey = key === 'dailyOptions' && options?.startDate && options?.endDate
    ? `${key}:${options.startDate}:${options.endDate}`
    : key;

  // Select appropriate TTL
  const cacheDuration = key === 'dailyOptions' ? DAILY_OPTIONS_CACHE_DURATION_MS : CACHE_DURATION_MS;

  // Check cache validity
  const cached = masterDataCache.value.get(cacheKey);
  if (!forceRefresh && cached && (now - cached.timestamp) < cacheDuration) {
    console.log(`[Cache] Hit for ${cacheKey}`);
    return { data: cached.data, fromCache: true, timestamp: cached.timestamp };
  }

  // In-flight deduplication: reuse existing promise if available
  if (cached?.promise) {
    console.log(`[Cache] In-flight dedup for ${cacheKey} - waiting for existing fetch`);
    try {
      const data = await cached.promise;
      return { data, fromCache: false, timestamp: masterDataCache.value.get(cacheKey)?.timestamp || now };
    } catch (error) {
      console.error(`[Cache] In-flight fetch failed for ${cacheKey}:`, error);
      throw error;
    }
  }

  // Cache miss - fetch from Firestore
  console.log(`[Cache] Miss for ${cacheKey} — fetching...`);
  
  const fetchPromise = (async () => {
    try {
      let data: any;
      if (key === 'users') {
        data = await (getUsersListAsync() as Promise<ExtendedUserProfile[]>);
      } else if (key === 'holidays') {
        data = await (getHolidaysListAsync() as Promise<Holiday[]>);
      } else if (key === 'dailyOptions') {
        // dailyOptions requires date range
        if (!options?.startDate || !options?.endDate) {
          throw new Error('[Cache] dailyOptions requires startDate and endDate in options');
        }
        const { where } = await import('firebase/firestore');
        data = await (getDailyOptionsListAsync(
          where('date', '>=', options.startDate),
          where('date', '<=', options.endDate)
        ) as Promise<DailyUserOption[]>);
      }
      
      // Update cache with fetched data
      const timestamp = Date.now();
      const ttlSeconds = Math.floor(cacheDuration / 1000);
      masterDataCache.value.set(cacheKey, { data, timestamp });
      console.log(`[Cache] Set for ${cacheKey} (ttl=${ttlSeconds}s)`);
      
      return data;
    } catch (error) {
      // On error, fallback to stale cache if available
      const staleCache = masterDataCache.value.get(cacheKey);
      if (staleCache?.data) {
        console.warn(`[Cache] Fetch failed for ${cacheKey}, using stale cache:`, error);
        return staleCache.data;
      }
      console.error(`[Cache] Fetch failed for ${cacheKey} and no stale cache available:`, error);
      throw error;
    } finally {
      // Clean up promise reference
      const entry = masterDataCache.value.get(cacheKey);
      if (entry) {
        delete entry.promise;
      }
    }
  })();

  // Store promise for in-flight dedup
  const entry = masterDataCache.value.get(cacheKey) || { data: null, timestamp: 0 };
  entry.promise = fetchPromise;
  masterDataCache.value.set(cacheKey, entry);

  const data = await fetchPromise;
  return { data, fromCache: false, timestamp: masterDataCache.value.get(cacheKey)?.timestamp || now };
};

export const getMasterDataCache = () => masterDataCache;

export const useCalendar = () => {
  // --- Services ---
  const eventService = useEventService();
  const { getListAsync: getHolidaysListAsync } = useMaster('holidays');
  const { getListAsync: getUsersListAsync } = useMaster('users');

  // --- State ---
  const currentDate = ref(new Date());
  const selectedDate = ref<Date | null>(new Date());
  const currentView = ref<CalendarView>('monthly');
  const users = ref<UserWithVisibility[]>([]);
  const events = ref<EventDisplay[]>([]);
  const holidays = ref<Holiday[]>([]);
  const dailyOptions = ref<DailyUserOption[]>([]); // DailyOptionsの状態を追加
  const isLoading = ref(false);

  // --- Utility Functions ---
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };
  // --- Utility Functions ---
  const formatDatetime = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  const formatShortDate = (date: Date | null): string => {
    if (!date) return '';
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };
  // ★★★ タイムゾーン問題を解決するための修正 ★★★
  const formatDateForDb = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getDayOfWeek = (date: Date): string => ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  const timeToPixels = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return ((hours - 9) * 60 + minutes) * (32 / 30);
  };

  const timeToPixelsForHorizontal = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    // 30分あたりの幅を32pxから96pxに変更
    return ((hours - 9) * 60 + minutes) * (96 / 30);
  };

  // --- Date Range Calculation ---
  const getCurrentDateRange = (): DateRange => {
    const d = new Date(currentDate.value);
    let startDate: Date, endDate: Date;

    if (currentView.value === 'monthly') {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      startDate.setDate(startDate.getDate() - startDate.getDay());
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

  // --- Core Data Loading ---
  const loadData = async () => {
    // Prevent duplicate calls if already loading
    if (isLoading.value) {
      console.log('[loadData] Already loading, skipping duplicate call');
      return;
    }
    
    isLoading.value = true;
    try {
      const dateRange = getCurrentDateRange();
      const currentUser = useState<ExtendedUserProfile>('userProfile');
      
      console.log(`[Phase1] Loading basic data for ${currentView.value} view (${dateRange.startDate} ~ ${dateRange.endDate})`);
      
      // === フェーズ1: 基本データの優先取得 ===
      // 週次ビューの場合のみキャッシュから自身のイベントを取得
      if (currentView.value === 'weekly' && currentUser.value?.uid) {
        const cachedEvents = getCachedMyEvents(currentUser.value.uid, dateRange);
        if (cachedEvents && cachedEvents.length > 0) {
          events.value = cachedEvents;
          console.log(`[Phase1] Cached events found - displaying ${cachedEvents.length} events immediately`);
        }
      }
      
      // マスターデータ（users, holidays）を並行取得
      const [usersResult, holidaysResult] = await Promise.all([
        getMasterDataCacheAsync('users'),
        getMasterDataCacheAsync('holidays'),
      ]);
      
      users.value = usersResult.data.map((u: ExtendedUserProfile) => ({ ...u, visible: true }));
      holidays.value = holidaysResult.data;
      console.log('[Phase1] Basic data loaded (users, holidays)');
      
      // === フェーズ2: 全イベントの取得（バックグラウンド） ===
      setTimeout(async () => {
        try {
          console.log('[Phase2] Loading all events in background...');
          let allEvents: EventDisplay[];
          
          if (currentView.value === 'weekly') {
            // 週次ビュー: 全ユーザーのイベントを取得
            allEvents = await eventService.getEventsInRange(dateRange.startDate, dateRange.endDate);
            // 自身のイベントをキャッシュ
            if (currentUser.value?.uid) {
              setCachedMyEvents(currentUser.value.uid, dateRange, allEvents);
            }
          } else {
            // 月次・日次ビュー: ログインユーザーのみのイベントを取得
            if (!currentUser.value?.uid) {
              console.error('[Phase2] User not authenticated - cannot load events');
              return;
            }
            allEvents = await eventService.getEventsByParticipantInRange(
              currentUser.value.uid,
              dateRange.startDate,
              dateRange.endDate
            );
          }
          
          events.value = allEvents;
          console.log(`[Phase2] All events loaded (${allEvents.length} events)`);
          
          // Auto-print profiler summary on first load (weekly view)
          if (currentView.value === 'weekly') {
            printFirestoreDebugSummary();
          }
        } catch (error) {
          console.error('[Phase2] Failed to load all events:', error);
        }
      }, 0);
      
      // === フェーズ3: DailyOptionの取得（最低優先度） ===
      setTimeout(async () => {
        try {
          console.log('[Phase3] Loading daily options...');
          const dailyOptionsResult = await getMasterDataCacheAsync('dailyOptions', false, {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          });
          dailyOptions.value = dailyOptionsResult.data;
          console.log(`[Phase3] Daily options loaded (${dailyOptions.value.length} options)`);
        } catch (error) {
          console.error('[Phase3] Failed to load daily options:', error);
          dailyOptions.value = []; // エラー時は空にする
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const refreshEvents = loadData;

  // --- Event Getters ---
  const getSchedulesForDay = (date: Date | null): EventDisplay[] => {
    if (!date) return [];
    const dateString = formatDateForDb(date);
    return events.value.filter(event => event.date === dateString);
  };
  
  const getUserSchedulesForDay = (userId: string, date: Date | null): EventDisplay[] => {
      if (!date) return [];
      const daySchedules = getSchedulesForDay(date);
      return daySchedules.filter(event => event.participantIds?.includes(userId));
  };

  // --- Navigation and View Control ---
  const setView = (view: CalendarView) => { currentView.value = view; };
  const previousDay = () => currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 1));
  const nextDay = () => currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 1));
  const previousWeek = () => currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 7));
  const nextWeek = () => currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 7));
  const previousMonth = () => currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1));
  const nextMonth = () => currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1));
  const goToToday = () => { currentDate.value = new Date(); };
  const goToSelectDate = (date: Date) => { currentDate.value = date; };

  // --- Calendar Position Persistence (週の位置保存) ---
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

  // --- Computed Properties for Views ---
  const generateWeekDays = computed<Date[]>(() => {
    const week: Date[] = [];
    const start = new Date(currentDate.value);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  });

  const generateCalendarDays = computed<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const d = currentDate.value;
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push({ date: day, currentMonth: day.getMonth() === month });
    }
    return days;
  });
  
  const timeSlots = computed(() => {
    const slots: string[] = [];
    // for (let hour = 8; hour <= 20; hour++) {
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

  // --- Lifecycle and Watchers ---
  // Note: onMounted(loadData) is removed - let page component control initial load timing
  watch([currentDate, currentView], loadData, { deep: true });

  return {
    currentDate,
    selectedDate,
    currentView,
    users,
    events,
    holidays,
    dailyOptions, // DailyOptionsを追加
    isLoading,
    loadData,
    refreshEvents,
    setView,
    selectDay: (date: Date) => { selectedDate.value = date; },
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
    getDayOfWeek,
    formatDate,
    formatDatetime,
    formatShortDate,
    formatDateForDb,
    timeToPixels,
    timeToPixelsForHorizontal,
    toggleUserVisibility,
    generateCalendarDays,
    generateWeekDays,
    timeSlots,
    saveCalendarPosition,
    loadCalendarPosition,
    clearCalendarPosition,
  };
};