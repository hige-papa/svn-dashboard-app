// composables/useCalendar.ts
import { ref, computed, onMounted, watch } from 'vue';
import { useEventService } from '~/services/eventService';
import { useMaster } from '~/composables/master/useMaster';

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
  const isLoading = ref(false);

  // --- Utility Functions ---
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
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
    return ((hours - 8) * 60 + minutes) * (32 / 30);
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
    isLoading.value = true;
    try {
      const dateRange = getCurrentDateRange();
      const [eventsData, usersData, holidaysData] = await Promise.all([
        eventService.getEventsInRange(dateRange.startDate, dateRange.endDate),
        getUsersListAsync() as Promise<ExtendedUserProfile[]>,
        getHolidaysListAsync() as Promise<Holiday[]>,
      ]);
      events.value = eventsData;
      users.value = usersData.map(u => ({ ...u, visible: true }));
      holidays.value = holidaysData;
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
    for (let hour = 8; hour <= 20; hour++) {
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
  onMounted(loadData);
  watch([currentDate, currentView], loadData, { deep: true });

  return {
    currentDate,
    selectedDate,
    currentView,
    users,
    events,
    holidays,
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
    formatShortDate,
    timeToPixels,
    toggleUserVisibility,
    generateCalendarDays,
    generateWeekDays,
    timeSlots,
  };
};