<template>
  <div class="calendar-grid w-100">
    <table class="calendar-table">
      <thead class="">
        <tr class="weekday-header">
          <td class="weekday sunday">日</td>
          <td class="weekday">月</td>
          <td class="weekday">火</td>
          <td class="weekday">水</td>
          <td class="weekday">木</td>
          <td class="weekday">金</td>
          <td class="weekday saturday">土</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(days, index) in chunk(calendarDataWithDetails, 7)" :key="`calendar-row-${index}`" style="height: 110px;">
          <td v-for="(day, index2) in days" :key="`calendar-col-${index}-${index2}`" :class="[
            'day-cell',
            {
              // 事前集約されたプロパティを利用
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'selected-day': day.isSelected
            }
          ]" :data-date="day.dateString" @click="onDayClick(day.date)">
            <div>
              <span :class="[
                'day-number',
                {
                  // 事前集約されたプロパティを利用
                  'today-number': day.isToday,
                  'sunday-number': day.date.getDay() === 0,
                  'holiday-number': day.holidayName,
                  'saturday-number': day.date.getDay() === 6
                }]"
                >
                {{ day.date.getDate() }}
              </span>
              <span v-if="day.holidayName" class="ml-2 holiday-name">
                {{ day.holidayName }}
              </span>
              <span class="position-absolute right-0 mr-2">
                <v-tooltip text="勤務形態" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="day.workStyleDetails.icon"
                      :color="day.workStyleDetails.color"
                      :size="day.workStyleDetails.size"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ランチ" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="day.lunchDetails.icon"
                      :color="day.lunchDetails.color"
                      :size="day.lunchDetails.size"
                      class="ml-2"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ディナー" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="day.dinnerDetails.icon"
                      :color="day.dinnerDetails.color"
                      :size="day.dinnerDetails.size"
                      class="ml-2"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
              </span>
            </div>

            <div v-if="day.allEvents.length > 0" class="day-events">
              <div v-for="(event, index) in day.visibleEvents" :key="event.id" class="day-event" :style="{ '--event-color': `${eventTypeDetails[event.eventType as keyof typeof eventTypeDetails]?.color}` }">
                <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>

              <div v-if="day.allEvents.length > 2" class="more-events">
                +{{ day.allEvents.length - 2 }}件
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useCalendar } from '~/composables/useCalendar';
import { useConstants } from '~/composables/common/useConstants'

const props = defineProps({
  calendarDays: {
    type: Array < any >, // { date: Date, currentMonth: boolean } の配列を想定
    required: true
  },
  selectedDate: {
    type: Date,
    default: null
  },
  events: {
    type: Array < EventDisplay >, // EventDisplay の型定義が必要です
    required: true
  },
  dailyOptions: {
    type: Array < DailyUserOption >, // DailyUserOption の型定義が必要です
    required: true
  }
});

const emit = defineEmits(['dayClick']);

const {
  eventTypeDetails,
  workstyleDetails,
  participationLunchStatusDetails,
  participationDinnerStatusDetails,
} = useConstants();

const {
  formatDate,
  getHolidayName
} = useCalendar();

// Dateオブジェクトを 'YYYY-MM-DD' 形式の文字列に変換するヘルパー関数
const dateToDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- パフォーマンス改善 1: 日次オプションのハッシュマップ化 (既存ロジックの活用) ---
const dailyOptionView = computed(() => {
  const result: Record<string, DailyUserOption> = {};
  props.dailyOptions.forEach(e => {
    // dailyOptionsのdateプロパティが既に 'YYYY-MM-DD' 形式であることを前提とします
    result[e.date] = e 
  });
  return result;
});

const getDailyOptions = (date: Date): DailyUserOption | undefined => {
  return dailyOptionView.value[dateToDateString(date)]
}

// --- パフォーマンス改善 2: イベントのハッシュマップ化 ---
// イベント配列を日付ごとのオブジェクトに変換
const eventsByDate = computed<Record<string, EventDisplay[]>>(() => {
  const result: Record<string, EventDisplay[]> = {};
  
  if (!props.events || !Array.isArray(props.events)) {
    return {};
  }

  props.events.forEach(event => {
    // イベントの date プロパティが 'YYYY-MM-DD' 形式であることを前提とします
    const dateKey = event.date; 
    
    if (dateKey) {
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push(event);
    }
  });
  return result;
});

// ハッシュマップからイベントを取得
const getEventsForDayFromMap = (date: Date): EventDisplay[] => {
  const dateKey = dateToDateString(date);
  return eventsByDate.value[dateKey] || [];
};

// --- パフォーマンス改善 3: 全表示データの事前集約 ---
const calendarDataWithDetails = computed(() => {
  const today = new Date();

  return props.calendarDays.map(day => {
    const date = day.date as Date;
    const dateStr = dateToDateString(date);

    // 1. 日次オプションを1回取得
    const dailyOption = getDailyOptions(date);

    // 2. イベントを1回取得
    const allEvents = getEventsForDayFromMap(date);

    return {
      ...day,
      dateString: formatDate(date),
      
      // 日付判定
      isToday: date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear(),
        
      isSelected: props.selectedDate ? (
        date.getDate() === props.selectedDate.getDate() &&
        date.getMonth() === props.selectedDate.getMonth() &&
        date.getFullYear() === props.selectedDate.getFullYear()
      ) : false,
      
      // 祝日名
      holidayName: getHolidayName(date),
      
      // アイコン詳細
      workStyleDetails: workstyleDetails[dailyOption?.workStyle ?? 'pending'],
      lunchDetails: participationLunchStatusDetails[dailyOption?.lunchParticipation ?? 'pending'],
      dinnerDetails: participationDinnerStatusDetails[dailyOption?.dinnerParticipation ?? 'pending'],
      
      // イベント詳細
      allEvents: allEvents,
      visibleEvents: allEvents.slice(0, 2), // 表示制限されたイベント
    };
  });
});


// 配列をチャンク化する関数（変更なし）
const chunk = <T extends any[]>(arr: T, size: number) => {
  return arr.reduce((preArr: T[][], current, index) => {
    if (index % size) {
      return preArr
    } else {
      return [...preArr, ...[arr.slice(index, index + size)]]
    }
  }, [] as T[][])
}

// 日付クリック時のイベント（変更なし）
const onDayClick = (date: Date) => {
  emit('dayClick', date);
};

</script>

<style scoped>
/* スタイル部分は変更なし */

.calendar-grid {
  height: 100%;
  overflow-x: auto;
}

.calendar-table {
  height: 60%;
  width: 100%;
  border-spacing: 2px 2px;
  /* table-layout: fixed; */
}

.weekday-header {
  text-align: center;
  margin-bottom: 10px;
  font-weight: 600;
  padding: 10px 0;
  border-radius: 10px;
  background-color: var(--background-light);
}

.weekday {
  padding: 6px 0;
  font-size: 14px;
}

.sunday {
  color: var(--accent-color);
}

.saturday {
  color: var(--primary-color);
}

.day-cell {
  border-radius: 10px;
  border: 1px solid var(--border-color);
  /* height: 100px; */
  min-width: 165px;
  margin: 5px;
  padding: 8px;
  position: relative;
  transition: var(--transition);
  vertical-align: top;
}

.day-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-color: var(--primary-color);
}

.other-month {
  background-color: #fafbfc;
  border-color: #ebeef2;
  opacity: 0.7;
}

.today {
  background-color: rgba(67, 97, 238, 0.05);
  border-color: var(--primary-color);
}

.selected-day {
  box-shadow: 0 0 0 2px var(--primary-color);
}

.day-number {
  font-size: 14px;
  margin-bottom: 6px;
}

.other-month .day-number {
  color: var(--text-light);
}

.sunday-number {
  color: var(--accent-color);
}

.holiday-number {
  color: var(--accent-color);
}

.saturday-number {
  color: var(--primary-color);
}

.holiday-name {
  font-size: 11px;
  color: var(--accent-color);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.day-events {
  margin-top: 8px;
}

.day-event {
  font-size: 11px;
  padding: 4px 8px;
  width: 157px;
  margin-bottom: 4px;
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-left: 3px solid var(--event-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  transition: var(--transition);
  cursor: pointer;
}

.day-event .event-time-range {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-event .event-title {
  font-size: 11px;
  line-height: 1.2;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-event:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.more-events {
  font-size: 11px;
  color: var(--primary-color);
  margin-top: 4px;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
}

.sticky {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 2;
}

@media (max-width: 768px) {
  .day-number {
    font-size: 11px;
  }

  .holiday-name {
    font-size: 10px;
  }
}
</style>