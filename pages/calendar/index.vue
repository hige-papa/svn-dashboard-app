<template>
  <div class="container">
    <!-- ヘッダー -->
    <CalendarHeader @go-to-today="handleGoToToday" />

    <div class="sub-header">
      <!-- ビュー切り替え -->
      <div class="view-selector">
        <button class="view-btn" :class="{ 'active': currentView === 'daily' }" @click="switchView('daily')"
          :disabled="isLoading">
          日次
        </button>
        <button class="view-btn" :class="{ 'active': currentView === 'weekly' }" @click="switchView('weekly')"
          :disabled="isLoading">
          週次
        </button>
        <button class="view-btn" :class="{ 'active': currentView === 'monthly' }" @click="switchView('monthly')"
          :disabled="isLoading">
          月次
        </button>
      </div>

      <!-- ナビゲーションコントロール -->
      <div class="nav-wrapper">
        <NavControls :display-label="navDisplayLabel" :previous-label="navPreviousLabel" :next-label="navNextLabel"
          :loading="isLoading" @previous="handlePrevious" @next="handleNext" />

        <!-- 週間ビュー用のユーザーフィルター -->
        <!-- <UserFilter 
          v-if="currentView === 'weekly'"
          :users="users"
          @toggle-user="toggleUserVisibility"
        /> -->
      </div>
    </div>

    <!-- ローディング表示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">読み込み中...</div>
    </div>

    <!-- デイリービュー -->
    <div v-if="currentView === 'daily'" class="daily-view">
      <h2 class="view-title">デイリースケジュール</h2>

      <DailyTimeline :events="currentDayEvents" :time-slots="timeSlots" :date="currentDate"
        :time-to-pixels="timeToPixels" @event-click="showEventDetails" />

      <EventsList :events="currentDayEvents" @event-click="showEventDetails" />
    </div>

    <!-- 週間ビュー -->
    <div v-else-if="currentView === 'weekly'" class="weekly-view">
      <h2 class="view-title">グループスケジュール</h2>

      <!-- WeeklyCalendarViewコンポーネントを使用 -->
      <WeeklyCalendarView :users="users" :week-days="weekDays" :events="events"
        :get-user-schedules-for-day="getUserSchedulesForDay" @event-click="showEventDetails" />
    </div>

    <!-- 月間ビュー -->
    <div v-else-if="currentView === 'monthly'" class="monthly-view">
      <h2 class="view-title">月間カレンダー</h2>

      <WeekdayHeader />

      <CalendarGrid :calendar-days="calendarDays" :selected-date="selectedDate" :events="events"
        :get-schedules-for-day="getSchedulesForDay" :is-holiday="isHoliday" :get-holiday-name="getHolidayName"
        @day-click="handleDayClick" @event-click="showEventDetails" />

      <SelectedDayDetail :selected-date="selectedDate" :events="selectedDayEvents" @event-click="showEventDetails" />
    </div>

    <!-- フッター -->
    <div class="footer">
      {{ currentDateTimeText }}
    </div>

    <!-- イベント詳細ポップアップ -->
    <EventDetail v-if="showDetail" :event="selectedEvent" :visible="showDetail" :position="detailPosition"
      @close="hideEventDetails" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCalendar } from '~/composables/useCalendar';

// コンポーネントのインポート
// import CalendarHeader from '~/components/CalendarHeader.vue';
// import NavControls from '~/components/NavControls.vue';
// import EventDetail from '~/components/EventDetail.vue';

// デイリービュー用コンポーネント
// import DailyTimeline from '~/components/DailyView/DailyTimeline.vue';
// import EventsList from '~/components/DailyView/EventsList.vue';

// 週間ビュー用コンポーネント
// import WeeklyCalendarView from '~/components/WeeklyView/WeeklyCalendarView.vue';
// import UserFilter from '~/components/WeeklyView/UserFilter.vue';

// 月間ビュー用コンポーネント
// import WeekdayHeader from '~/components/MonthlyView/WeekdayHeader.vue';
// import CalendarGrid from '~/components/MonthlyView/CalendarGrid.vue';
// import SelectedDayDetail from '~/components/MonthlyView/SelectedDayDetail.vue';

// カレンダーの状態とユーティリティ関数
const {
  currentDate,
  selectedDate,
  currentView,
  users,
  events,
  holidays,
  isLoading,
  getDayOfWeek,
  formatDate,
  timeToPixels,
  getSchedulesForDay,
  getUserSchedulesForDay,
  previousDay,
  nextDay,
  previousWeek,
  nextWeek,
  previousMonth,
  nextMonth,
  goToToday,
  selectDay,
  generateCalendarDays,
  generateWeekDays,
  timeSlots,
  isHoliday,
  getHolidayName,
  toggleUserVisibility,
  loadData,
  refreshEvents,
  setView
} = useCalendar();

// イベント詳細表示用の状態
const showDetail = ref(false);
const selectedEvent = ref(null);
const detailPosition = ref({ top: 0, left: 0 });

// 各ビュー用のローカルイベントデータ
const currentDayEvents = ref([]);
const selectedDayEvents = ref([]);

// 初期化
onMounted(async () => {
  // 初期表示時にデータを読み込む
  await loadData();

  // 月間ビューの場合は現在の日を選択
  if (currentView.value === 'monthly') {
    selectDay(new Date(currentDate.value));
  }

  // 初期イベントデータを取得
  await updateCurrentDayEvents();
});

// 現在の日のイベントを更新
const updateCurrentDayEvents = async () => {
  if (currentView.value === 'daily') {
    currentDayEvents.value = await getSchedulesForDay(currentDate.value);
  }
};

// 選択中の日のイベントを更新
const updateSelectedDayEvents = async () => {
  if (selectedDate.value) {
    selectedDayEvents.value = await getSchedulesForDay(selectedDate.value);
  } else {
    selectedDayEvents.value = [];
  }
};

// イベントデータ変更の監視を追加
watch(events, () => {
  // eventsが変更された時に各ビューのイベントデータを更新
  updateCurrentDayEvents();
  updateSelectedDayEvents();
}, { deep: true });

// currentDateの変更を監視
watch(currentDate, async () => {
  await updateCurrentDayEvents();
});

// selectedDateの変更を監視
watch(selectedDate, async () => {
  await updateSelectedDayEvents();
});

// currentViewの変更を監視
watch(currentView, async () => {
  await updateCurrentDayEvents();
});

// ナビゲーションのラベル
const navDisplayLabel = computed(() => {
  if (currentView.value === 'daily') {
    return `${formatDate(currentDate.value)}（${getDayOfWeek(currentDate.value)}）`;
  } else if (currentView.value === 'weekly') {
    const startDate = weekDays.value[0];
    const endDate = weekDays.value[6];

    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${year}年${startMonth}月${startDay}日～${endDay}日`;
    } else {
      return `${year}年${startMonth}月${startDay}日～${endMonth}月${endDay}日`;
    }
  } else if (currentView.value === 'monthly') {
    return `${currentDate.value.getFullYear()}年 ${currentDate.value.getMonth() + 1}月`;
  }

  return '';
});

const navPreviousLabel = computed(() => {
  if (currentView.value === 'daily') return '前日';
  if (currentView.value === 'weekly') return '前週';
  if (currentView.value === 'monthly') return '前月';
  return '前へ';
});

const navNextLabel = computed(() => {
  if (currentView.value === 'daily') return '次日';
  if (currentView.value === 'weekly') return '次週';
  if (currentView.value === 'monthly') return '次月';
  return '次へ';
});

// 現在の日時（フッター用）
const currentDateTimeText = computed(() => {
  const now = new Date();
  return `${formatDate(now)} 現在の表示`;
});

// 週間ビュー用の日付配列
const weekDays = computed(() => {
  return generateWeekDays.value;
});

// 月間ビュー用のカレンダー日配列
const calendarDays = computed(() => {
  return generateCalendarDays.value;
});

// 日付選択ハンドラ（月間ビュー用）
const handleDayClick = async (date) => {
  selectDay(date);
  await updateSelectedDayEvents();
};

// ビューの切り替え
const switchView = async (view) => {
  if (isLoading.value) return; // ローディング中は無効

  showDetail.value = false;
  await setView(view);

  // ビュー切り替え後のデータ更新
  await updateCurrentDayEvents();

  // 月間ビューに切り替えた場合は現在の日を選択
  if (view === 'monthly') {
    selectDay(new Date(currentDate.value));
    await updateSelectedDayEvents();
  }
};

// 前へボタンのハンドラ
const handlePrevious = async () => {
  if (isLoading.value) return; // ローディング中は無効

  showDetail.value = false;

  if (currentView.value === 'daily') {
    await previousDay();
  } else if (currentView.value === 'weekly') {
    await previousWeek();
  } else if (currentView.value === 'monthly') {
    await previousMonth();
    // 月間ビューの場合、月変更後も選択状態を維持
    if (selectedDate.value) {
      selectDay(new Date(currentDate.value));
      await updateSelectedDayEvents();
    }
  }

  // イベントデータを更新
  await updateCurrentDayEvents();
};

// 次へボタンのハンドラ
const handleNext = async () => {
  if (isLoading.value) return; // ローディング中は無効

  showDetail.value = false;

  if (currentView.value === 'daily') {
    await nextDay();
  } else if (currentView.value === 'weekly') {
    await nextWeek();
  } else if (currentView.value === 'monthly') {
    await nextMonth();
    // 月間ビューの場合、月変更後も選択状態を維持
    if (selectedDate.value) {
      selectDay(new Date(currentDate.value));
      await updateSelectedDayEvents();
    }
  }

  // イベントデータを更新
  await updateCurrentDayEvents();
};

// 今日へ移動（async対応）
const handleGoToToday = async () => {
  if (isLoading.value) return; // ローディング中は無効

  showDetail.value = false;
  await goToToday();

  // イベントデータを更新
  await updateCurrentDayEvents();

  // 月間ビューの場合は今日を選択
  if (currentView.value === 'monthly') {
    selectDay(new Date());
    await updateSelectedDayEvents();
  }
};

// イベント詳細を表示
const showEventDetails = (data) => {
  const { event, eventData } = data;
  selectedEvent.value = eventData;

  const rect = event.currentTarget.getBoundingClientRect();

  // スクロール位置を考慮
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  // ポップアップの位置を調整（画面外にはみ出さないように）
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const detailsWidth = 320;

  let leftPos = rect.left + scrollLeft - 70;
  let topPos = rect.bottom + scrollTop - 70;

  // 右端にはみ出る場合は左側に表示
  if (leftPos + detailsWidth > viewportWidth - 50) {
    leftPos = viewportWidth - detailsWidth - 150;
  }

  // 下端にはみ出る場合は上側に表示
  if (topPos + 300 > viewportHeight + scrollTop - 20) {
    topPos = rect.top + scrollTop - 300 - 10;
  }

  detailPosition.value = {
    top: topPos,
    left: leftPos
  };

  showDetail.value = true;
};

// イベント詳細を非表示
const hideEventDetails = () => {
  showDetail.value = false;
};

// エラーハンドリング用のwatcher
watch(isLoading, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    // ローディング完了時の処理
    console.log('データの読み込みが完了しました');
  }
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
}

body {
  background-color: var(--background-light);
  padding: 20px;
  color: var(--text-primary);
  line-height: 1.5;
}
</style>

<style scoped>
.container {
  max-width: 100%;
  margin: 0 auto;
  background-color: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 24px;
  overflow: hidden;
  position: relative;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.view-selector {
  display: flex;
  gap: 8px;
}

.view-btn {
  padding: 8px 16px;
  background-color: var(--background-light);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.view-btn:hover:not(:disabled) {
  background-color: var(--primary-light);
}

.view-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.nav-wrapper {
  display: flex;
  align-items: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: var(--radius-lg);
}

.loading-spinner {
  padding: 16px 24px;
  background-color: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: 14px;
  color: var(--text-primary);
  border: 2px solid var(--primary-color);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-light);
  text-align: center;
}

.daily-view,
.weekly-view,
.monthly-view {
  min-height: 400px;
  transition: opacity 0.2s ease-in-out;
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .sub-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .nav-wrapper {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .view-selector {
    width: 100%;
  }

  .view-btn {
    flex: 1;
    text-align: center;
  }
}
</style>