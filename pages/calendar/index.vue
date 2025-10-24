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
          :loading="isLoading" @previous="handlePrevious" @next="handleNext" @change-date="handleSelectDay" />

        <!-- 週間ビュー用のユーザーフィルター -->
        <!-- <UserFilter 
          v-if="currentView === 'weekly'"
          :users="visibleUsers"
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

      <div>
        <DailyTimeline :events="myCurrentDayEvents" :time-slots="timeSlots" :date="currentDate"
          :time-to-pixels="timeToPixels" @event-click="handleShowEventDetails" />
      </div>

      <!-- <EventsList :events="currentDayEvents" @event-click="handleShowEventDetails" /> -->
    </div>

    <!-- 週間ビュー -->
    <div v-else-if="currentView === 'weekly'" class="weekly-view">
      <v-list-item class="pa-0">
        <template v-slot:prepend>
          <h2 class="view-title">グループスケジュール</h2>
        </template>
        <template v-slot:append>
          <div class="display-options-wrapper">
            <v-checkbox
              v-model="displayOption.isShowUser"
              label="ユーザー"
              hide-details
              density="compact"
              color="primary"
              class="custom-checkbox"
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowCompany"
              label="会社"
              hide-details
              density="compact"
              color="primary"
              class="custom-checkbox"
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowFacility"
              label="施設"
              hide-details
              density="compact"
              color="primary"
              class="custom-checkbox"
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowEquipment"
              label="備品"
              hide-details
              density="compact"
              color="primary"
              class="custom-checkbox"
            ></v-checkbox>
          </div>
        </template>
      </v-list-item>

      <div>
        <WeeklyCalendarView :users="visibleUsers" :company="company" :facilities="sortedFacilities" :equipments="sortedEquipments" :week-days="weekDays" :events="events" :daily-options="dailyOptions" :holidays="holidays" :is-holiday="isHoliday" :get-holiday-name="getHolidayName"
          :get-user-schedules-for-day="getUserSchedulesForDay" @day-click="handleDayClickForWeekly" />
      </div>
      <!-- WeeklyCalendarViewコンポーネントを使用 -->
      <!-- <WeeklyCalendarView :users="visibleUsers" :week-days="weekDays" :events="events"
        :get-user-schedules-for-day="getUserSchedulesForDay" @event-click="handleShowEventDetails" @day-click="handleDayClickForWeekly" /> -->
    </div>

    <!-- 月間ビュー -->
    <div v-else-if="currentView === 'monthly'" class="monthly-view pa-1">
      <h2 class="view-title">月間カレンダー</h2>

      <div>
        <CalendarGrid v-if="selectedDate && events" :calendar-days="calendarDays" :selected-date="selectedDate" :events="myEvents"
          :get-schedules-for-day="getSchedulesForDay" :is-holiday="isHoliday" :get-holiday-name="getHolidayName" :daily-options="myDailyOptions"
          @day-click="handleDayClickForMonthly" />
      </div>
      <!-- <WeekdayHeader /> -->

      <!-- <CalendarGrid v-if="selectedDate && events" :calendar-days="calendarDays" :selected-date="selectedDate" :events="myEvents"
        :get-schedules-for-day="getSchedulesForDay" :is-holiday="isHoliday" :get-holiday-name="getHolidayName"
        @day-click="handleDayClickForMonthly" @event-click="handleShowEventDetails" /> -->

      <!-- <SelectedDayDetail v-if="selectedDate" :selected-date="selectedDate" :events="selectedDayEvents" @event-click="handleShowEventDetails" /> -->
    </div>

    <!-- 一日のイベントリスト -->
    <div v-if="currentView === 'daily'">
      <h3 class="list-title">{{ eventListSubtitle }}</h3>
      <EventsList class="events-list" :date="currentDate ?? new Date()" :events="myCurrentDayEvents" @event-click="handleShowEventDetails" />
    </div>

    <!-- イベントリスト -->
    <aw-dialog v-model="eventListDialog" :draggable="true" :resize="true" :overlay="false" :width="mobile ? '100%' : '50%'" :fullscreen="mobile">
      <template #title>
        <h3 class="list-title">{{ eventListSubtitle }}</h3>
      </template>
      <v-card flat tile color="transparent">
        <v-card-text>
          <EventsList v-if="currentView === 'weekly' && selectedDate" :date="selectedDate ?? new Date()" :events="selectedUserDayEvents" @event-click="handleShowEventDetails" :user="selectedUser" />
          <EventsList v-else-if="currentView === 'monthly' && selectedDate" :date="selectedDate ?? new Date()" :events="mySelectedDayEvents" @event-click="handleShowEventDetails" />
        </v-card-text>
        <!-- <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" :size="mobile ? 'small' : 'auto'" @click="openDailyOptionDialog">日別ステータスを編集する</v-btn>
          <v-btn color="primary" variant="text" :size="mobile ? 'small' : 'auto'" @click="goToRegister()">予定を登録する</v-btn>
        </v-card-actions> -->
      </v-card>
      <template #footer>
        <div class="modal-footer">
          <button type="button" @click="openDailyOptionDialog" class="modal-footer-btn btn-primary">
            日別ステータス編集
          </button>
          <button type="button" @click="goToRegister()" class="modal-footer-btn btn-primary">
            予定登録
          </button>
        </div>
      </template>
    </aw-dialog>

    <!-- 日次オプション -->
    <aw-dialog v-model="dailyOptionDialog" :draggable="true" :resize="true" :overlay="false" width="50%" :fullscreen="mobile">
      <template #title>
        <h3>
          <p class="list-title">{{ dailyOptionSubtitle }}</p>
        </h3>
      </template>
      <DailyOptionForm v-if="selectedDate" :user="selectedUser" :date="getDateString(selectedDate)" @cancel="handleCancelDailyOption" @submit="handleSubmitDailyOption" :initial-data="dailyOption"></DailyOptionForm>
    </aw-dialog>

    <!-- フッター -->
    <div class="footer">
      {{ currentDateTimeText }}
    </div>

    <!-- イベント詳細ポップアップ -->
    <!-- <EventDetail v-if="showDetail" :event="selectedEvent" :visible="showDetail" :position="detailPosition"
      @close="hideEventDetails" /> -->

    <!-- 予定詳細 -->
    <aw-dialog v-model="viewDialog" :draggable="true" :resize="true" :overlay="false" width="50%" :fullscreen="mobile">
      <template #title>
        <p class="list-title">予定の詳細</p>
      </template>
      <EventView v-if="eventDetail" :event-data="eventDetail" @edit="handleEditEvent" @delete="handleDelete" @copy="handleCopy" @back="handleCloseView" />
    </aw-dialog>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useCalendar, getMasterDataCache } from '~/composables/useCalendar';
import { useDisplay } from 'vuetify'
import { useTransaction } from '~/composables/transaction/useTransaction'
import type { User } from 'firebase/auth';
import { padStart } from 'vuetify/lib/util/helpers.mjs';
import { useFacility } from '~/composables/useFacility'
import { useEquipment } from '~/composables/useEquipment'
import { useMasterData } from '~/composables/useMasterData';
import { useDailyOptionService } from '~/services/dailyOptionService';

// head設定
useHead({
  title: 'TASCAL - カレンダー'
});

const user = useState<ExtendedUserProfile>('userProfile')

const { getAsync, deleteAsync } = useTransaction('events')
const { getListAsync: getFacilitiesAsync } = useFacility()
const { getListAsync: getEquipmentsAsync } = useEquipment()

const { mobile } = useDisplay()

// コンポーネントのインポート
import CalendarHeader from '~/components/Calendar/CalendarHeader.vue';
import NavControls from '~/components/Calendar/NavControls.vue';
import EventView from '~/components/Calendar/EventView.vue';
import DailyOptionForm from '~/components/Calendar/DailyOptionForm.vue';
// import EventDetail from '~/components/EventDetail.vue';

// デイリービュー用コンポーネント
import DailyTimeline from '~/components/Calendar/DailyView/DailyTimeline.vue';
import EventsList from '~/components/Calendar/EventsList.vue';

// 週間ビュー用コンポーネント
import WeeklyCalendarView from '~/components/Calendar/WeeklyView/WeeklyCalendarView.vue';
// import UserFilter from '~/components/WeeklyView/UserFilter.vue';

// 月間ビュー用コンポーネント
// import WeekdayHeader from '~/components/MonthlyView/WeekdayHeader.vue';
import CalendarGrid from '~/components/Calendar/MonthlyView/CalendarGrid.vue';
// import SelectedDayDetail from '~/components/MonthlyView/SelectedDayDetail.vue';

// タブ状態保持用のキー
const CALENDAR_VIEW_STORAGE_KEY = 'calendar-current-view';

// カレンダーの状態とユーティリティ関数
const {
  currentDate,
  selectedDate,
  currentView,
  users,
  events,
  holidays,
  dailyOptions, // useCalendarからdailyOptionsを取得
  isLoading,
  getDayOfWeek,
  formatDate,
  formatDatetime,
  formatDateForDb,
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
  goToSelectDate,
  selectDay,
  generateCalendarDays,
  generateWeekDays,
  timeSlots,
  isHoliday,
  getHolidayName,
  toggleUserVisibility,
  loadData,
  refreshEvents,
  setView,
  saveCalendarPosition,
  loadCalendarPosition,
  clearCalendarPosition,
} = useCalendar();

// 週次の表示設定
const displayOption = ref<any>({
  isShowUser: true,
  isShowCompany: true,
  isShowFacility: false,
  isShowEquipment: false
})

const visibleUsers = computed(() => {
  if (displayOption.value.isShowUser === false) return []
  return users.value?.filter(u => { return u.status === 'active' })
})

const { data: companies } = useMasterData<OwnCompany>('own-company')

const company = computed(() => {
  if (displayOption.value.isShowCompany === false) return undefined
  return companies.value?.map(company => {
      return {
        id: company.id,
        code: company.code,
        name: company.displayName || '未設定',
        department: '',
        avatar: company.avatar,
      }
    })?.[0]
})

const facilitiesMaster = ref<MasterItem[]>([])

const sortedFacilities = computed(() => {
  if (displayOption.value.isShowFacility === false) return []
  return facilitiesMaster.value.sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } })
})

const equipmentMaster = ref<MasterItem[]>([])

const sortedEquipments = computed(() => {
  if (displayOption.value.isShowEquipment === false) return []
  return equipmentMaster.value.sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } })
})

const myDailyOptions = computed(() => {
  return dailyOptions.value.filter(e => { return e.uid === user.value.uid });
})

// --- DailyOption関連のヘルパー関数 ---
const dailyOptionService = useDailyOptionService();

/**
 * 特定のユーザーの特定の日付のオプションを取得
 */
const getUserOptionForDay = (userId: string, date: Date | null): DailyUserOption | undefined => {
  if (!date || !userId) return undefined;
  const dateString = formatDateForDb(date);
  return dailyOptions.value.find(option => option.uid === userId && option.date === dateString);
};

/**
 * ユーザーの日別ステータスを設定（作成/更新）
 */
const setDailyOption = async (optionData: Omit<DailyUserOption, 'id'>) => {
  try {
    await dailyOptionService.setDailyOption(optionData);
    
    // Clear dailyOptions cache (all date ranges)
    const masterDataCache = getMasterDataCache();
    const keysToDelete: string[] = [];
    masterDataCache.value.forEach((_, key) => {
      if (key.startsWith('dailyOptions:')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => masterDataCache.value.delete(key));
    console.log(`[Cache] Cleared ${keysToDelete.length} dailyOptions cache entries due to update`);
    
    // データを再読み込み
    await loadData();
  } catch (error) {
    console.error("Failed to set daily option:", error);
  }
};

// イベント詳細表示用の状態
// const showDetail = ref<boolean>(false);
// const selectedEvent = ref<EventDisplay | null>(null);
// const detailPosition = ref<{ top: number, left: number }>({ top: 0, left: 0 });

const dateString = computed(() => {
  let d: Date = new Date()
  switch (currentView.value) {
    case 'daily':
      d = currentDate.value
      break;
    case 'weekly':
      d = selectedDate.value || new Date()
      break;
    case 'monthly':
      d = selectedDate.value || new Date()
      break;
  }
  if (d.toLocaleDateString() === new Date().toLocaleDateString()) return '本日'
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  return `${year}年${month}月${date}日`
});

const eventListSubtitle = computed(() => {
    if (user.value && selectedUser.value && user.value.uid != selectedUser.value?.uid) {
        return `${selectedUser.value?.displayName}さんの${dateString.value}の予定一覧`;
    } else {
        return `${dateString.value}の予定一覧`;
    }
});

const dailyOptionSubtitle = computed(() => {
    if (selectedUser.value) {
        return `${selectedUser.value.displayName}さんの${ dailyOption.value ? '日別ステータスを更新' : '日別ステータスを登録' }`;
    } else {
        return dailyOption.value ? '日別ステータスを更新' : '日別ステータスを登録';
    }
});

// 各ビュー用のローカルイベントデータ
const currentDayEvents = ref<EventDisplay[]>([]);
const selectedDayEvents = ref<EventDisplay[]>([]);

// ユーザー、施設、備品の予定重複チェック
const isConflicted = (id: string, event: EventDisplay, events: EventDisplay[]) => {
  const result = events.some(e => {
    if (e.id === event.id) return false; // 同じイベントは無視
    if (e.participantIds?.includes(id) ||
      e.facilityIds?.includes(id) ||
      e.equipmentIds?.includes(id)) {
      // 日付が同じで時間が重複しているかチェック
      if (e.date === event.date) {
        const [eStartHour, eStartMinute] = e.startTime.split(':').map(Number);
        const [eEndHour, eEndMinute] = e.endTime.split(':').map(Number);
        const [eventStartHour, eventStartMinute] = event.startTime.split(':').map(Number);
        const [eventEndHour, eventEndMinute] = event.endTime.split(':').map(Number);

        const eStart = eStartHour * 60 + eStartMinute;
        const eEnd = eEndHour * 60 + eEndMinute;
        const eventStart = eventStartHour * 60 + eventStartMinute;
        const eventEnd = eventEndHour * 60 + eventEndMinute;

        return (eventStart < eEnd && eventEnd > eStart); // 時間が重複している場合
      }
    }
    return false;
  });
  return result;
}

const myCurrentDayEvents = computed(() => {
  const result = JSON.parse(JSON.stringify(currentDayEvents.value.filter(e => { return e.participantIds?.includes(user.value?.uid) }))) as EventDisplay[]
  // 重複チェックを実行
  result.forEach(event => {
    event.conflicted = isConflicted(user.value.uid, event, currentDayEvents.value);
  });
  return result
})

const myEvents = computed(() => {
  const result = JSON.parse(JSON.stringify(events.value.filter(e => { return e.participantIds?.includes(user.value?.uid) }))) as EventDisplay[]
  // 重複チェックを実行
  result.forEach(event => {
    event.conflicted = isConflicted(user.value.uid, event, events.value);
  });
  return result
})

const mySelectedDayEvents = computed(() => {
  const result = JSON.parse(JSON.stringify(selectedDayEvents.value.filter(e => { return e.participantIds?.includes(user.value?.uid) }))) as EventDisplay[]
  // 重複チェックを実行
  result.forEach(event => {
    event.conflicted = isConflicted(user.value.uid, event, selectedDayEvents.value);
  });
  return result
})

// タブ状態を保存する関数
const saveViewToStorage = (view: CalendarView) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, view);
    }
  } catch (error) {
    console.warn('Failed to save view to localStorage:', error);
  }
};

// タブ状態を読み込む関数
const loadViewFromStorage = (): CalendarView => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedView = localStorage.getItem(CALENDAR_VIEW_STORAGE_KEY) as CalendarView;
      if (savedView && ['daily', 'weekly', 'monthly'].includes(savedView)) {
        return savedView;
      }
    }
  } catch (error) {
    console.warn('Failed to load view from localStorage:', error);
  }
  return 'monthly'; // デフォルトビュー
};

// 初期化
onMounted(async () => {
  // 保存されたビューを読み込んで設定（watch トリガー前に直接設定）
  const savedView = loadViewFromStorage();
  if (savedView !== currentView.value) {
    currentView.value = savedView; // setView の代わりに直接設定（watch は次の loadData で処理）
  }

  // 保存された週の位置を復元（予定登録などから戻ってきた時のため）
  const savedPosition = loadCalendarPosition();
  if (savedPosition) {
    currentDate.value = savedPosition;
    console.log('[Calendar] Restored calendar position:', formatDateForDb(savedPosition));
  }

  
  getEquipmentsAsync().then(equipments => {
    equipmentMaster.value = (equipments as any[]).map(equipment => ({
      id: equipment.id,
      code: equipment.code,
      name: equipment.name,
      capacity: equipment.capacity,
      avatar: equipment.imageUrl,
    }))
  })
  getFacilitiesAsync().then(facilities => {
    facilitiesMaster.value = (facilities as any[]).map(facility => ({
      id: facility.id,
      code: facility.code,
      name: facility.name,
      capacity: facility.capacity,
      avatar: facility.imageUrl,
    }))
  })

  // 初期表示時にデータを読み込む（ビュー設定後に1回のみ）
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
// Note: loadData は composable 側の watch で実行されるため、ここでは UI 更新のみ
watch(currentDate, async () => {
  await updateCurrentDayEvents();
  // 週の位置を保存（予定登録などから戻ってきた時のため）
  saveCalendarPosition();
});

// selectedDateの変更を監視
watch(selectedDate, async () => {
  selectedDayEvents.value = [];
  selectedUser.value = undefined;
  await updateSelectedDayEvents();
});

// currentViewの変更を監視（ストレージへの保存を追加）
// Note: loadData は composable 側の watch で実行されるため、ここでは UI 更新と保存のみ
watch(currentView, async (newView) => {
  selectedDayEvents.value = [];
  selectedUser.value = undefined;
  await updateCurrentDayEvents();
  // ビューが変更された時にlocalStorageに保存
  saveViewToStorage(newView);
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
  return `${formatDatetime(now)} 現在の表示`;
});

// 週間ビュー用の日付配列
const weekDays = computed(() => {
  return generateWeekDays.value;
});

// 月間ビュー用のカレンダー日配列
const calendarDays = computed(() => {
  return generateCalendarDays.value;
});

const selectedUser = ref<ExtendedUserProfile>()

const selectedUserDayEvents = computed(() => {
  return selectedDayEvents.value.filter(e => { return e.participantIds?.includes(selectedUser.value?.uid ?? '') })
})

const eventListDialog = ref<boolean>(false)

// 日付選択ハンドラ（週間ビュー用）
const handleDayClickForWeekly = async (data: any) => {
  const { user, date } = data;
  selectDay(date);
  await updateSelectedDayEvents();
  // alert(`${user.displayName}: ${events.length}件の予定`);
  selectedUser.value = user;
  eventListDialog.value = true;
};

// 日付選択ハンドラ（月間ビュー用）
const handleDayClickForMonthly = async (date: Date) => {
  selectDay(date);
  await updateSelectedDayEvents();
  eventListDialog.value = true;
};

// ビューの切り替え
const switchView = async (view: CalendarView) => {
  if (isLoading.value) return; // ローディング中は無効

  // showDetail.value = false;
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

  // showDetail.value = false;

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

  // showDetail.value = false;

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

  // showDetail.value = false;
  await goToToday();

  // イベントデータを更新
  await updateCurrentDayEvents();

  // 月間ビューの場合は今日を選択
  if (currentView.value === 'monthly') {
    selectDay(new Date());
    await updateSelectedDayEvents();
  }
};

const handleSelectDay = async (date: Date) => {
  // alert(date);

  goToSelectDate(date);

  // イベントデータを更新/
  await updateCurrentDayEvents();

  // 月間ビューの場合は今日を選択
  if (currentView.value === 'monthly') {
    selectDay(date);
    await updateSelectedDayEvents();
  }
}

// const eventDetailDialog = ref<boolean>(false)

// const selectedEvent = ref<EventDisplay | null>(null)

// イベント詳細を表示
const handleShowEventDetails = (data: any) => {
  const { event, eventData } = data;

  getAsync(eventData.id).then(response  => {
    eventDetail.value = response
    viewDialog.value = true
  })

  // selectedEvent.value = eventData;

  // eventDetailDialog.value = true
}

// イベント詳細を非表示
// const handleCloseEventDetails = () => {
//   eventDetailDialog.value = false
// };

// イベント詳細を表示
// const showEventDetails = (data: any) => {
//   const { event, eventData } = data;
//   selectedEvent.value = eventData;

//   const rect = event.currentTarget.getBoundingClientRect();

//   // スクロール位置を考慮
//   const scrollTop = window.scrollY || document.documentElement.scrollTop;
//   const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

//   // ポップアップの位置を調整（画面外にはみ出さないように）
//   const viewportWidth = window.innerWidth;
//   const viewportHeight = window.innerHeight;
//   const detailsWidth = 320;

//   let leftPos = rect.left + scrollLeft - 70;
//   let topPos = rect.bottom + scrollTop - 70;

//   // 右端にはみ出る場合は左側に表示
//   if (leftPos + detailsWidth > viewportWidth - 50) {
//     leftPos = viewportWidth - detailsWidth - 150;
//   }

//   // 下端にはみ出る場合は上側に表示
//   if (topPos + 300 > viewportHeight + scrollTop - 20) {
//     topPos = rect.top + scrollTop - 300 - 10;
//   }

//   detailPosition.value = {
//     top: topPos,
//     left: leftPos
//   };

//   showDetail.value = true;
// };

// イベント詳細を非表示
// const hideEventDetails = () => {
//   showDetail.value = false;
// };

const viewDialog = ref<boolean>(false)

const eventDetail = ref<EventData>()

// const handleViewEvent = (event: EventDisplay) => {
//   // alert(`view => ${JSON.stringify(event)}`)
//   getAsync(event.id).then(response  => {
//     eventData.value = response
//     viewDialog.value = true
//   })
// };

const handleEditEvent = (event: EventDisplay | EventData) => {
  // alert(`edit => ${JSON.stringify(event)}`)
  // 予定編集ページに遷移する前に現在の週の位置を保存
  saveCalendarPosition();
  if (event?.id) navigateTo(`/calendar/${event.id}/edit`);
};

const handleCloseView = () => {
  viewDialog.value = false
}

const handleDelete = (id: string) => {
  deleteAsync(id).then(_ => {
    loadData()
    viewDialog.value = false
  })
}

// 登録画面へ
const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dailyOptionDialog = ref<boolean>(false);

const dailyOption = ref<DailyUserOption>();

const openDailyOptionDialog = () => {
  dailyOption.value = getUserOptionForDay(selectedUser.value?.uid ?? user.value.uid, selectedDate.value);
  dailyOptionDialog.value = true;
}

const handleSubmitDailyOption = (data: DailyUserOption) => {
  // alert(JSON.stringify(data));
  setDailyOption(data).then(() => {
    dailyOptionDialog.value = false;
  })
}

const handleCancelDailyOption = () => {
  dailyOptionDialog.value = false;
}

// const goToRegisterOption = () => {
//   navigateTo(`/calendar/register/option?date=${getDateString(selectedDate.value ?? new Date())}&uid=${selectedUser.value?.uid}`)
// }

const goToRegister = () => {
  // 予定登録ページに遷移する前に現在の週の位置を保存
  saveCalendarPosition();
  navigateTo(`/calendar/register?date=${getDateString(selectedDate.value ?? new Date())}&participantId=${selectedUser.value?.uid}`)
}

const handleCopy = () => {

}

// エラーハンドリング用のwatcher
watch(isLoading, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    // ローディング完了時の処理
    console.log('データの読み込みが完了しました');
  }
});

// head設定
useHead({
  title: 'TASCAL - カレンダー'
});

</script>

<style scoped>
.container {
  height: 100%;
  max-width: 100%;
  margin: 0 auto;
  background-color: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 24px 24px 48px 24px;
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
  background-color: var(--primary-color) !important;
  color: white !important;
  border-color: var(--primary-color) !important;
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.view-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 20px;
  background-color: var(--primary-color);
  margin-right: 10px;
  border-radius: 2px;
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
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 0;
  margin-top: 24px;
  padding: 4px 0;
  background-color: var(--background-light);
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-light);
  text-align: center;
  z-index: 100;
}

.daily-view,
.weekly-view,
.monthly-view {
  min-height: 400px;
  overflow-y: auto;
  transition: opacity 0.2s ease-in-out;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.list-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 20px;
  background-color: var(--primary-color);
  margin-right: 10px;
  border-radius: 2px;
}

.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end; height: 65px; padding: 12px;
  border-top: 1px solid #dee2e6; /* --border-color */
}

.modal-footer-btn {
  padding: 14px 28px; border-radius: 6px; /* --radius-sm */ font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease-in-out; /* --transition */ border: none; display: flex; align-items: center; gap: 8px;
}

.btn-primary { background-color: #4361ee; /* --primary-color */ color: white; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* --shadow-sm */ }
.btn-primary:hover {
  background-color: #3a53c4; /* --primary-hover */ box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); /* --shadow-md */
  transform: translateY(-1px);
}
.btn-primary:disabled { background-color: #adb5bd; /* --text-light */ cursor: not-allowed; transform: none; }

/* Display options (checkboxes) responsive styling */
.display-options-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* カスタムチェックボックスのスタイル（丸み + 青基調） */
.custom-checkbox :deep(.v-selection-control__input) {
  border-radius: 6px;
}

.custom-checkbox :deep(.v-selection-control__input .v-icon) {
  color: #4361ee;
}

.custom-checkbox :deep(.v-selection-control__wrapper) {
  border-radius: 6px;
}

.custom-checkbox :deep(.v-label) {
  color: var(--text-primary);
  font-weight: 500;
}

.custom-checkbox :deep(.v-selection-control--dirty .v-label) {
  color: #4361ee;
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
    font-size: 12px;
  }

  .view-title {
    font-size: 14px;
  }

  /* チェックボックスのモバイル対応 */
  .display-options-wrapper {
    width: 100%;
    justify-content: flex-start;
    gap: 2px;
  }

  .display-options-wrapper :deep(.v-checkbox) {
    flex: 0 1 auto;
  }

  .display-options-wrapper :deep(.v-label) {
    font-size: 11px !important;
    white-space: nowrap;
  }

  .display-options-wrapper :deep(.v-selection-control) {
    min-height: 32px;
  }
}
</style>