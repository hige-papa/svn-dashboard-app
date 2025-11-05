<template>
  <div class="container">
    <CalendarHeader @go-to-today="handleGoToToday" @start-register="registerDialog=true" />

    <div class="sub-header">
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

      <div class="nav-wrapper">
        <NavControls :display-label="navDisplayLabel" :previous-label="navPreviousLabel" :next-label="navNextLabel"
          :loading="isLoading" @previous="handlePrevious" @next="handleNext" @change-date="handleSelectDay" />

        </div>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">読み込み中...</div>
    </div>

    <div v-if="currentView === 'daily'" class="daily-view">
      <h2 class="view-title">デイリースケジュール</h2>

      <div>
        <DailyTimeline :events="myCurrentDayEvents" :time-slots="timeSlots" :date="currentDate"
          :time-to-pixels="timeToPixels" @event-click="handleShowEventDetails" />
      </div>

      </div>

    <div v-else-if="currentView === 'weekly'" class="weekly-view">
      <v-row>
        <v-col cols="12" sm="6">
          <h2 class="view-title">グループスケジュール</h2>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="d-flex justify-end">
            <v-checkbox
              v-model="displayOption.isShowUser"
              label="ユーザー"
              density="compact"
              hide-details
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowCompany"
              label="会社"
              density="compact"
              hide-details
              class="ml-2"
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowFacility"
              label="施設"
              density="compact"
              hide-details
              class="ml-2"
            ></v-checkbox>
            <v-checkbox
              v-model="displayOption.isShowEquipment"
              label="備品"
              density="compact"
              hide-details
              class="ml-2"
            ></v-checkbox>
          </div>
        </v-col>
      </v-row>
      <div>
        <WeeklyCalendarView :users="visibleUsers" :company="company" :facilities="sortedFacilities" :equipments="sortedEquipments" :week-days="weekDays" :events="events" :daily-options="dailyOptions" :holidays="holidays"
          :get-user-schedules-for-day="getUserSchedulesForDay" @day-click="handleDayClickForWeekly" />
      </div>
      </div>

    <div v-else-if="currentView === 'monthly'" class="monthly-view pa-1">
      <h2 class="view-title">月間カレンダー</h2>

      <div>
        <CalendarGrid v-if="selectedDate && events" :calendar-days="calendarDays" :selected-date="selectedDate" :events="myEvents"
          :get-schedules-for-day="getSchedulesForDay" :is-holiday="isHoliday" :get-holiday-name="getHolidayName" :daily-options="myDailyOptions"
          @day-click="handleDayClickForMonthly" />
      </div>
      </div>

    <div v-if="currentView === 'daily'">
      <h3 class="list-title">{{ eventListSubtitle }}</h3>
      <EventsList class="events-list" :date="currentDate ?? new Date()" :events="myCurrentDayEvents" @event-click="handleShowEventDetails" />
    </div>

    <aw-dialog v-model="eventListDialog" :draggable="true" :resize="true" :overlay="false" :width="mobile ? '100%' : '50%'" :fullscreen="mobile">
      <template #title>
        <h3 class="list-title">{{ eventListSubtitle }}</h3>
      </template>
      <v-card flat tile color="transparent">
        <v-card-text>
          <EventsList v-if="currentView === 'weekly' && selectedDate && selectedUser" :date="selectedDate ?? new Date()" :events="selectedUserDayEvents" @event-click="handleShowEventDetails" :user="selectedUser" />
          <EventsList v-else-if="currentView === 'monthly' && selectedDate" :date="selectedDate ?? new Date()" :events="mySelectedDayEvents" @event-click="handleShowEventDetails" />
        </v-card-text>
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

    <aw-dialog v-model="dailyOptionDialog" :draggable="true" :resize="true" :overlay="false" width="50%" :fullscreen="mobile">
      <template #title>
        <h3>
          <p class="list-title">{{ dailyOptionSubtitle }}</p>
        </h3>
      </template>
      <DailyOptionForm v-if="selectedDate" :user="selectedUser" :date="getDateString(selectedDate)" @cancel="handleCancelDailyOption" @submit="handleSubmitDailyOption" :initial-data="dailyOption"></DailyOptionForm>
    </aw-dialog>

    <div class="footer">
      {{ currentDateTimeText }}
    </div>

    <aw-dialog v-model="viewDialog" :draggable="true" :resize="true" :overlay="false" width="50%" :fullscreen="mobile">
      <template #title>
        <p class="list-title">予定の詳細</p>
      </template>
      <EventView v-if="eventDetail" :event-data="eventDetail" @edit="handleEditEvent" @delete="handleDelete" @copy="handleCopy" @back="handleCloseView" />
    </aw-dialog>

    <AwDialog v-model="registerDialog" :draggable="true" :resize="true" :overlay="false" :initial-width="600" :fullscreen="mobile">
      <template #title>
        <p class="list-title">予定新規登録</p>
      </template>
      <EventRegister @registered="handleRegistered" :date="getDateString(selectedDate ?? new Date())" :participant-ids="selectedUser?.uid ? [selectedUser.uid] : undefined" @error="handleRegisterError" />
    </AwDialog>

    <AwDialog v-model="editorDialog" :draggable="true" :resize="true" :overlay="false" :initial-width="600" :fullscreen="mobile">
      <template #title>
        <p class="list-title">予定更新</p>
      </template>
      <EventEditor v-if="selectedEvent?.id" :event-id="selectedEvent.id" @updated="handleUpdated" @error="handleEditorError" />
    </AwDialog>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useCalendar } from '~/composables/useCalendar';
import { useDisplay } from 'vuetify'
import { useTransaction } from '~/composables/transaction/useTransaction'
import type { User } from 'firebase/auth';
import { padStart } from 'vuetify/lib/util/helpers.mjs';
import { useDailyOptions } from '~/composables/useDailyOptions'
// import { useFacility } from '~/composables/useFacility'
// import { useEquipment } from '~/composables/useEquipment'
import { useMasterData } from '~/composables/useMasterData';

// head設定
useHead({
  title: 'TASCAL - カレンダー'
});

// 型定義
type CalendarView = 'daily' | 'weekly' | 'monthly';


const user = useState<ExtendedUserProfile>('userProfile')

// getAsyncを削除し、ローカル検索に置き換え
// const { deleteAsync } = useTransaction('events') 
// const { getListAsync: getFacilitiesAsync } = useFacility()
// const { getListAsync: getEquipmentsAsync } = useEquipment()

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
  isLoading,
  deleteEventAndRefresh,
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
  loadData, // ★★★ useCalendar.tsからloadDataを取得 ★★★
  refreshEvents,
  setView,
  saveCalendarPosition,
  loadCalendarPosition,
  clearCalendarPosition,
} = useCalendar();

const {
  dailyOptions,
  getUserOptionForDay,
  loadDailyOptions,
  setDailyOption,
} = useDailyOptions(currentDate, currentView);

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
const isConflicted = (id: string, event: EventDisplay, allEvents: EventDisplay[]) => {
  // allEvents は、現在表示範囲内の全イベントとする
  const result = allEvents.some(e => {
    if (e.segmentId === event.segmentId) return false; // 同じイベントインスタンスは無視

    // 参加者、施設、備品のいずれかに重複IDが含まれているかチェック
    const isResourceMatch = 
      e.participantIds?.includes(id) ||
      e.facilityIds?.includes(id) ||
      e.equipmentIds?.includes(id);

    if (isResourceMatch) {
      // 日付が同じで時間が重複しているかチェック
      if (e.date === event.date) {
        // 時間文字列を数値に変換（分単位）
        const timeToMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const eStart = timeToMinutes(e.startTime);
        const eEnd = timeToMinutes(e.endTime);
        const eventStart = timeToMinutes(event.startTime);
        const eventEnd = timeToMinutes(event.endTime);

        // 重複条件: (eventStart < eEnd && eventEnd > eStart)
        return (eventStart < eEnd && eventEnd > eStart);
      }
    }
    return false;
  });
  return result;
}

const myCurrentDayEvents = computed(() => {
  // events.value から currentDate に該当するイベントを取得
  const dayEvents = currentDayEvents.value;
  // ユーザーが参加しているイベントのみにフィルタリング
  const userEvents = dayEvents.filter(e => e.participantIds?.includes(user.value?.uid));
  
  // 重複チェックを実行（ディープコピーを避けるため、必要なデータのみで構成された新しい配列を作成）
  return userEvents.map(event => ({
    ...event,
    conflicted: isConflicted(user.value.uid, event, dayEvents) // allEventsとしてその日の全イベントを渡す
  })) as EventDisplay[]
})

const myEvents = computed(() => {
  // 月間ビューで使用されるため、カレンダー全体のイベントを基にフィルタリング
  const allEvents = events.value;
  const userEvents = allEvents.filter(e => e.participantIds?.includes(user.value?.uid));

  // 重複チェックは、月間ビューの表示ではシンプルにするため省略
  return userEvents.map(event => ({ ...event, conflicted: false })) as EventDisplay[]
})

const mySelectedDayEvents = computed(() => {
  // 選択日のイベントを取得
  const dayEvents = selectedDayEvents.value;
  const userEvents = dayEvents.filter(e => e.participantIds?.includes(user.value?.uid));

  // 重複チェックを実行
  return userEvents.map(event => ({
    ...event,
    conflicted: isConflicted(user.value.uid, event, dayEvents)
  })) as EventDisplay[]
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

  // getEquipmentsAsync().then(equipments => {
  //   equipmentMaster.value = (equipments as any[]).map(equipment => ({
  //     id: equipment.id,
  //     code: equipment.code,
  //     name: equipment.name,
  //     capacity: equipment.capacity,
  //     avatar: equipment.imageUrl,
  //   }))
  // })
  // getFacilitiesAsync().then(facilities => {
  //   facilitiesMaster.value = (facilities as any[]).map(facility => ({
  //     id: facility.id,
  //     code: facility.code,
  //     name: facility.name,
  //     capacity: facility.capacity,
  //     avatar: facility.imageUrl,
  //   }))
  // })

// ★★★ 修正: useCalendar.tsのonMountedがなくなったため、ここで一度だけloadDataを実行 ★★★
  await loadData(true); // onMountedでは常に強制リフレッシュ

  // 月間ビューの場合は現在の日を選択
  if (currentView.value === 'monthly') {
    selectDay(new Date(currentDate.value));
  }

  // 初期イベントデータを取得（loadData後に実行）
  // events の watch に任せる
  // await updateCurrentDayEvents();
});

// 現在の日のイベントを更新
const updateCurrentDayEvents = () => {
  if (currentView.value === 'daily') {
    // events.valueはloadData()で更新された後の最新データ
    currentDayEvents.value = getSchedulesForDay(currentDate.value);
  }
};

// 選択中の日のイベントを更新
const updateSelectedDayEvents = () => {
  if (selectedDate.value) {
    // events.valueはloadData()で更新された後の最新データ
    selectedDayEvents.value = getSchedulesForDay(selectedDate.value);
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

// currentDateの変更を監視 (daily/weeklyの切り替え時にlocal eventを更新)
watch(currentDate, async () => {
  // loadData()が先に実行されるため、ここではイベントのローカル処理のみ
  // updateCurrentDayEvents(); // watch(events) に任せる
  // 週の位置を保存（予定登録などから戻ってきた時のため）
  saveCalendarPosition();
});

// selectedDateの変更を監視 (monthly/weeklyで日付選択時にlocal eventを更新)
watch(selectedDate, () => {
  // 日付が変わったら一旦リセットする処理だけ残す
  // selectedDayEvents.value = [];
  // selectedUser.value = undefined;
  // ここで updateSelectedDayEvents() を呼ばないようにする
});

// currentViewの変更を監視（ストレージへの保存を追加）
// Note: loadData は composable 側の watch で実行されるため、ここでは UI 更新と保存のみ
watch(currentView, (newView) => {
  // selectedDayEvents.value = [];
  // selectedUser.value = undefined;
  // loadData()は useCalendar.ts の watch で実行される
  // updateCurrentDayEvents(); // watch(events) に任せる
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
  // mySelectedDayEventsと同様の重複チェックロジックを適用
  const dayEvents = selectedDayEvents.value;
  const userEvents = dayEvents.filter(e => { return e.participantIds?.includes(selectedUser.value?.uid ?? '') });
  const uid = selectedUser.value?.uid ?? '';
  
  return userEvents.map(event => ({
    ...event,
    conflicted: isConflicted(uid, event, dayEvents)
  })) as EventDisplay[]
})

const eventListDialog = ref<boolean>(false)

// 日付選択ハンドラ（週間ビュー用）
const handleDayClickForWeekly = async (data: any) => {
  const { user, date } = data;
  
  selectDay(date);
  selectedUser.value = user;

  // 1. イベントデータの取得・更新完了を待つ
  updateSelectedDayEvents(); 

  // 2. VueのリアクティブシステムがDOM更新（computedの再計算）を完了するのを待つ
  //    これにより、selectedUserDayEventsなどのcomputedが最新のselectedDayEventsを反映する
  await nextTick(); 
  
  // 3. 全てのデータが揃った後にダイアログを開く
  eventListDialog.value = true;
};

// 日付選択ハンドラ（月間ビュー用）
const handleDayClickForMonthly = async (date: Date) => {
  selectDay(date);

  // 1. イベントデータの取得・更新完了を待つ
  updateSelectedDayEvents();
  
  // 2. VueのリアクティブシステムがDOM更新（computedの再計算）を完了するのを待つ
  await nextTick();

  // 3. 全てのデータが揃った後にダイアログを開く
  eventListDialog.value = true;
};

// ビューの切り替え
const switchView = async (view: CalendarView) => {
  if (isLoading.value) return; // ローディング中は無効

  // currentView.value を更新（useCalendar.ts の watch が検知し、loadData が実行される）
  setView(view); 

  // loadData は composable 側の watch に任せる

  // ビュー切り替え後のローカルイベントデータ更新
  // watch(events) に任せる

  // 月間ビューに切り替えた場合は現在の日を選択
  if (view === 'monthly') {
    selectDay(new Date(currentDate.value));
  }
};

// 前へボタンのハンドラ
const handlePrevious = async () => {
  if (isLoading.value) return; // ローディング中は無効

  if (currentView.value === 'daily') {
    previousDay();
  } else if (currentView.value === 'weekly') {
    previousWeek();
  } else if (currentView.value === 'monthly') {
    previousMonth();
  }

  // loadData() の呼び出しを削除 (useCalendar.ts の watch(currentDate) に任せる)

  // イベントデータを更新（ローカルフィルタリング）
  // watch(events) に任せる

  // 月間ビューの場合、月変更後も選択状態を維持
  if (currentView.value === 'monthly') {
    if (selectedDate.value) {
      // selectDay(new Date(currentDate.value)); // 不要
      updateSelectedDayEvents(); // selectedDateのwatchが走らない場合は必要
    }
  }
};

// 次へボタンのハンドラ
const handleNext = async () => {
  if (isLoading.value) return; // ローディング中は無効

  if (currentView.value === 'daily') {
    nextDay();
  } else if (currentView.value === 'weekly') {
    nextWeek();
  } else if (currentView.value === 'monthly') {
    nextMonth();
  }

  // loadData() の呼び出しを削除 (useCalendar.ts の watch(currentDate) に任せる)

  // イベントデータを更新（ローカルフィルタリング）
  // watch(events) に任せる

  // 月間ビューの場合、月変更後も選択状態を維持
  if (currentView.value === 'monthly') {
    if (selectedDate.value) {
      // selectDay(new Date(currentDate.value)); // 不要
      updateSelectedDayEvents(); // selectedDateのwatchが走らない場合は必要
    }
  }
};

// 今日へ移動（async対応）
const handleGoToToday = async () => {
  if (isLoading.value) return; // ローディング中は無効

  goToToday();

  // loadData() の呼び出しを削除 (useCalendar.ts の watch(currentDate) に任せる)

  // イベントデータを更新（ローカルフィルタリング）
  // watch(events) に任せる

  // 月間ビューの場合は今日を選択
  if (currentView.value === 'monthly') {
    // selectDay() は goToToday() で既に呼ばれている
    updateSelectedDayEvents();
  }
};

const handleSelectDay = async (date: Date) => {
  // alert(date);

  goToSelectDate(date); // currentDate が変更されるため, watch が loadData を実行する

  // イベントデータを更新/
  // watch(events) に任せる

  // 月間ビューの場合は今日を選択
  if (currentView.value === 'monthly') {
    selectDay(date); // selectedDate が変更される
    // await updateSelectedDayEvents(); // watch(selectedDate) に任せる
  }
}

const viewDialog = ref<boolean>(false)

const eventDetail = ref<EventData>()

// イベント詳細を表示
const handleShowEventDetails = (data: any) => {
  const { eventData } = data; // eventDataはEventDisplay
  
  // 🚀 パフォーマンス改善: APIコールを避け、メモリ上のevents.valueから検索
  const foundEvent = events.value.find(e => e.id === eventData.id);

  if (foundEvent) {
    // EventDisplayをEventDataとして扱う
    eventDetail.value = foundEvent as unknown as EventData; 
    viewDialog.value = true;
  } else {
    // データがない場合は、データ取得が不完全な可能性をログに出力
    console.error('Event not found in the current loaded data:', eventData.id);
  }
}

const selectedEvent = ref<EventDisplay | EventData>()

const handleEditEvent = (event: EventDisplay | EventData) => {
  // alert(`edit => ${JSON.stringify(event)}`)
  // 予定編集ページに遷移する前に現在の週の位置を保存
  // saveCalendarPosition();
  // if (event?.id) navigateTo(`/calendar/${event.id}/edit`);
  selectedEvent.value = event;
  editorDialog.value = true;
};

const handleCloseView = () => {
  viewDialog.value = false
}

const handleDelete = (id: string) => {
  deleteEventAndRefresh(id).then(_ => {
    // 削除後はデータを強制的に再ロード (マスターデータキャッシュもリフレッシュ)
    loadData(true); 
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
    // 日別オプション登録後はデータを強制的に再ロード
    loadData(true);
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
  // saveCalendarPosition();
  // navigateTo(`/calendar/register?date=${getDateString(selectedDate.value ?? new Date())}&participantId=${selectedUser.value?.uid}`)
  registerDialog.value = true;
}

const handleCopy = () => {

}

const registerDialog = ref<boolean>(false);

const handleRegistered = () => {
  registerDialog.value = false;
  // 登録後はデータを強制的に再ロード
  loadData(true);
}

const handleRegisterError = (error: any) => {
  console.error('Event registration error:', error);
  alert('予定の登録中にエラーが発生しました。再度お試しください。');
}

const editorDialog = ref<boolean>(false);

const handleUpdated = (event: EventDisplay | EventData) => {
  editorDialog.value = false;
  // 更新後はデータを強制的に再ロード
  loadData(true);
};

const handleEditorError = (error: any) => {
  console.error('Event editing error:', error);
  alert('予定の編集中にエラーが発生しました。再度お試しください。');
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
/* スタイルは変更なし */
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
    margin-bottom: 0;
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