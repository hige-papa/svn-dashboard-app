<template>
  <!-- {{ props.weekDays }} -->
  <!-- {{ props.visibleUsers }} -->
  <!-- {{ props.events }} -->
  <div class="calendar-container w-100 table_box">
    <v-table class="table-field">
      <thead>
        <tr>
          <td class="day-header sticky corner">メンバー</td>
          <td v-for="day in weekDays" :key="`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`" :class="[
              'day-header', 
              { 'today-header': isToday(day) }
            ]">
            <div :class="[
                'day-name', 
                { 
                  'sunday': day.getDay() === 0,
                  'saturday': day.getDay() === 6,
                  'holiday': getHolidayName(day)
                }
              ]"
            >
              {{ getDayOfWeek(day) }}曜日<span v-if="getHolidayName(day)" class="holiday-indicator">（祝）</span>
            </div>
            <!-- 日付の横に出社人数を表示 -->
            <div class="d-flex align-center justify-center gap-3">
              <div class="day-date">{{ formatShortDate(day) }}</div>
              <v-chip v-if="getOfficeCount(day) > 0" size="small" color="primary" variant="outlined"
                class="office-count-chip">
                <v-icon icon="mdi-office-building" size="x-small" class="mr-1"></v-icon>
                {{ getOfficeCount(day) }}人
              </v-chip>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in sortedUser" :key="user.uid" class="schedule-row">
          <td class="user-cell sticky">
            <div class="d-flex align-center justify-center mb-2">
              <v-avatar color="grey">
                <v-img v-if="user.avatar" :src="user.avatar"></v-img>
                <v-icon v-else icon="mdi-account" size="x-large"></v-icon>
              </v-avatar>
            </div>
            <div class="user-name">{{ user.displayName }}</div>
            <div v-if="user.extension" class="user-extension">内線：{{ user.extension }}</div>
          </td>
          <td v-for="day in weekDays" :key="`${user.uid}-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`"
            :class="['day-cell', { 'today-cell': isToday(day) }]" @click="handleSelectDay(user, day)">
            <!-- <div 
                v-for="(event, index) in getVisibleEvents(getUserEventsForDay(user.uid, day))" 
                :key="event.id"
                :class="['event', 'event-type']"
                :style="{ top: `${10 + (index * 28)}px`, '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey' }"
                @click.stop="($event) => { if (isViewable(event)) { onEventClick($event, event) } }"
              > -->
            <div class="mt-1">
              <v-tooltip text="勤務形態" location="top">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" :icon="getWorkStyle(user.uid, day).icon"
                    :color="getWorkStyle(user.uid, day).color" :size="getWorkStyle(user.uid, day).size">
                  </v-icon>
                </template>
              </v-tooltip>
              <v-tooltip text="ランチ" location="top">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" :icon="getLunchParticipation(user.uid, day).icon"
                    :color="getLunchParticipation(user.uid, day).color"
                    :size="getLunchParticipation(user.uid, day).size" class="ml-2">
                  </v-icon>
                </template>
              </v-tooltip>
              <v-tooltip text="ディナー" location="top">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props" :icon="getDinnerParticipation(user.uid, day).icon"
                    :color="getDinnerParticipation(user.uid, day).color"
                    :size="getDinnerParticipation(user.uid, day).size" class="ml-2">
                  </v-icon>
                </template>
              </v-tooltip>
            </div>
            <div v-for="(event, index) in getVisibleEvents(getUserEventsForDay(user.uid, day))" :key="event.id"
              :class="['event', 'event-type']"
              :style="{ top: `${10 + (index * 50)}px`, '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey' }">
              <template v-if="isViewable(event)">
                <div v-if="isConflicted(user.uid, event)" class="pa-0 ma-0 d-flex align-center">
                  <v-icon icon="mdi-alert-circle" size="small" color="warning"
                    class="mr-1"></v-icon>
                  <span class="text-warning" style="font-size: 10px;">重複予定あり</span>
                </div>
                <!-- <div>conflicted:{{ isConflicted(user.uid, event) }}</div> -->
                <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                <div class="event-title">{{ event.title }}</div>
              </template>
              <template v-else>
                <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                <div class="event-title">予定あり</div>
              </template>
            </div>

            <!-- <div 
                v-if="getUserEventsForDay(user.uid, day).length > 2" 
                class="more-events"
              >
                +{{ getUserEventsForDay(user.uid, day).length - 2 }}件
              </div> -->
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCalendar } from '~/composables/useCalendar';
import { useConstants } from '~/composables/common/useConstants';
import type { User } from 'firebase/auth';

const user = useState<User>('user');

const props = defineProps({
  users: {
    type: Array<ExtendedUserProfile>,
    required: true
  },
  weekDays: {
    type: Array<Date>,
    required: true
  },
  events: {
    type: Array<EventDisplay>,
    required: true
  },
  dailyOptions: {
    type: Array < DailyUserOption >,
    required: true
  },
});

// const emit = defineEmits(['eventClick', 'selectDay']);
const emit = defineEmits(['dayClick']);

const isViewable = (event: EventDisplay) => {
  return event.private ? (event.participantIds?.includes(user.value.uid)) ?? false : true
}

const {
  eventTypeDetails,
  workstyleDetails,
  participationLunchStatusDetails,
  participationDinnerStatusDetails,
} = useConstants()

const { 
  getDayOfWeek, 
  formatShortDate,
  getHolidayName
} = useCalendar();

const dateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDailyOptionView = (uid: string) => {
  const result: Record<string, DailyUserOption> = {};
  props.dailyOptions.filter(e => { return e.uid === uid }).forEach(e => {
    result[e.date] = e;
  });
  return result;
};

const getDailyOptions = (uid: string, date: Date) => {
  return getDailyOptionView(uid)[dateString(date)];
}

const getWorkStyle = (uid: string, date: Date) => {
  const workStyle = getDailyOptions(uid, date)?.workStyle;
  return workstyleDetails[workStyle ?? 'pending'];
}

const getLunchParticipation = (uid: string, date: Date) => {
  const lunchParticipation = getDailyOptions(uid, date)?.lunchParticipation;
  return participationLunchStatusDetails[lunchParticipation ?? 'pending'];
}

const getDinnerParticipation = (uid: string, date: Date) => {
  const dinnerParticipation = getDailyOptions(uid, date)?.dinnerParticipation;
  return participationDinnerStatusDetails[dinnerParticipation ?? 'pending'];
}

// 指定日の出社人数を集計
const getOfficeCount = (date: Date) => {
  return visibleUsers.value.filter(user => {
    const workStyle = getDailyOptions(user.uid, date)?.workStyle;
    return workStyle === 'office';
  }).length;
}

// 表示するユーザー（visible=trueのもののみ）
const visibleUsers = computed(() => {
  return props.users.filter(u => u.visible);
});

// ユーザーを並び替え ※本人が先頭、後は新しいルールで並び替え
const sortedUser = computed(() => {
  return visibleUsers.value.sort((a, b) => {
    // ログインユーザーを常に先頭に
    if (a.uid === user.value.uid && b.uid !== user.value.uid) return -1;
    if (b.uid === user.value.uid && a.uid !== user.value.uid) return 1;
    
    // ログインユーザー以外は新しいルールでソート
    // 1. sortOrder で比較（昇順）
    const sortOrderA = a.sortOrder || '';
    const sortOrderB = b.sortOrder || '';
    if (sortOrderA !== sortOrderB) {
      return sortOrderA.localeCompare(sortOrderB);
    }
    
    // 2. department でグループ化
    const group1Departments = ['営業部', 'システム部', '総務部'];
    const isGroup1A = group1Departments.includes(a.department || '');
    const isGroup1B = group1Departments.includes(b.department || '');
    
    if (isGroup1A && !isGroup1B) return -1;
    if (!isGroup1A && isGroup1B) return 1;
    
    // 3. code で比較（昇順）
    const codeA = a.code || '';
    const codeB = b.code || '';
    return codeA.localeCompare(codeB);
  });
})

// 今日かどうかを判定
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// 特定のユーザーと日付のイベントを取得（propsのeventsを使用）
const getUserEventsForDay = (userId: string, date: Date) => {
  if (!props.events || !Array.isArray(props.events)) {
    return [];
  }
  
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  return props.events.filter(event => {
    // ユーザーIDでフィルタリング
    if (!event.participantIds?.includes(userId)) {
      return false;
    }
    
    // 日付でフィルタリング
    if (event.date === dateStr) {
      return true;
    }
    
    // 他の日付フォーマットにも対応
    if (event.date) {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();
    }
    
    return false;
  });
};

// 各日ごとに表示するイベント（最初の2つまで）
const getVisibleEvents = (events: EventDisplay[], limit?: number) => {
  return limit ? events.slice(0, limit) : events;
};

// イベントクリック時のイベント
// const onEventClick = (event: Event, eventData: EventDisplay) => {
//   emit('eventClick', { event, eventData });
// };

const handleSelectDay = (user: ExtendedUserProfile, date: Date) => {
  emit('dayClick', { user: user, date: date })
}

// ユーザー、施設、備品の予定重複チェック
const isConflicted = (id: string, event: EventDisplay) => {
  const result = props.events.some(e => {
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
</script>

<style scoped>
.calendar-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  /* height: 600px; */
  width: 100%; /* 幅を100%に設定 */
}

.user-column {
  width: 180px; /* 少し幅を減らす */
  min-width: 120px;
  border-right: 1px solid var(--border-color);
}

.user-cell {
  flex: 1;
  text-align: center;
  vertical-align: middle;
  border-right: 1px solid var(--border-color);
  /* border-bottom: 1px solid var(--border-color); */
  max-width: 176.5px;
  overflow: hidden;
  background-color: #FFF;
  z-index: 30;
}

.user-header {
  height: 60px;
  background-color: var(--background-light);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding: 0 8px;
  color: var(--text-secondary);
}

.user-row {
  height: 80px;
  border-bottom: 1px solid var(--border-color);
  padding: 12px;
  display: flex;
  align-items: center;
}

.user-row:last-child {
  border-bottom: none;
}

/* .user-color-1 { background-color: var(--event-1-bg); color: var(--event-1); }
.user-color-2 { background-color: var(--event-2-bg); color: var(--event-2); }
.user-color-3 { background-color: var(--event-3-bg); color: var(--event-3); }
.user-color-4 { background-color: var(--event-4-bg); color: var(--event-4); }
.user-color-5 { background-color: var(--event-5-bg); color: var(--event-5); } */

.user-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  white-space: nowrap;
}

.user-extension {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 2px;
}

.calendar-grid-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-header {
  flex-shrink: 0;
}

.days-row {
  display: flex;
  width: 100%;
}

.day-header {
  /* flex: 1; */
  height: 60px;
  background-color: var(--background-light);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  /* display: flex; */
  /* flex-direction: column; */
  /* align-items: center; */
  /* justify-content: center; */
  /* padding: 8px 0; */
  min-width: 110px;
  text-align: center;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.day-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.sunday {
  color: var(--accent-color);
}

.saturday {
  color: var(--primary-color);
}

.holiday {
  color: var(--accent-color);
}

.holiday-indicator {
  color: var(--accent-color);
}

.today-header {
  background-color: var(--primary-light);
  border-bottom: 2px solid var(--primary-color);
}

.calendar-body {
  flex-grow: 1;
  overflow: auto;
}

.schedule-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.schedule-row {
  /* display: flex; */
  height: 105px;
  min-height: 80px;
  width: 100%;
  vertical-align: top;
}

.day-cell {
  flex: 1;
  /* position: relative; */
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  min-width: 174.5px;
  max-width: 174.5px;
  overflow: hidden;
}

.day-cell:last-child {
  border-right: none;
}

.schedule-row:last-child .day-cell {
  border-bottom: none;
}

.today-cell {
  background-color: var(--primary-light);
}

.event {
  /* position: absolute; */
  /* height: 26px; */
  /* left: 4px; */
  /* right: 4px; */
  border-radius: var(--radius-sm);
  margin-top: 5px;
  padding: 4px 8px;
  font-size: 11px;
  /* display: flex; */
  /* align-items: center; */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  z-index: 10;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.event:last-child {
  margin-bottom: 5px;
}

.event:hover {
  z-index: 20;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.event-time {
  margin-right: 6px;
  flex-shrink: 0;
  font-weight: 500;
}

.event-time-range {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-title {
  font-size: 11px;
  line-height: 1.2;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 日次・月次ビューと統一したイベントスタイル */
.event-type {
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-left: 4px solid var(--event-color);
  /* color: var(--event-color); */
}
/* .event-type-1 {
  background-color: #e6f2ff;
  border-left: 4px solid var(--primary-color);
  color: var(--text-primary);
}

.event-type-2 {
  background-color: var(--event-2-bg);
  border-left: 4px solid var(--event-2);
  color: var(--text-primary);
}

.event-type-3 {
  background-color: var(--event-3-bg);
  border-left: 4px solid var(--event-3);
  color: var(--text-primary);
}

.event-type-4 {
  background-color: var(--event-4-bg);
  border-left: 4px solid var(--event-4);
  color: var(--text-primary);
}

.event-type-5 {
  background-color: var(--event-5-bg);
  border-left: 4px solid var(--event-5);
  color: var(--text-primary);
} */

.table-field {
  width: 100%;
  table-layout: fixed;
}

.table_box {
  overflow-x: auto;
}

.sticky {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
}

.sticky.corner {
  z-index: 2;
}

@media (max-width: 768px) {
  .user-column {
    width: 80px;
    min-width: 80px;
  }

  .user-cell {
    max-width: 120px;
  }
  
  .user-name {
    font-size: 12px;
  }

  .user-extension {
    font-size: 10px;
    color: var(--text-secondary);
    text-align: center;
    margin-top: 2px;
  }

  .day-cell {
    min-width: 110px;
  }
  
  .day-name, .day-date {
    font-size: 12px;
  }
}

.more-events {
  /* position: absolute; */
  height: 26px;
  /* left: 4px; */
  /* right: 4px; */
  /* top: 65px; */
  margin-top: 5px;
  font-size: 11px;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
  text-align: center;
}
</style>