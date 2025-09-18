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
        <tr v-for="(days, index) in chunk(calendarDays, 7)" :key="`calendar-row-${index}`" style="height: 110px;">
          <td v-for="(day, index2) in days" :key="`calendar-col-${index}-${index2}`" :class="[
            'day-cell',
            {
              'other-month': !day.currentMonth,
              'today': isToday(day.date),
              'selected-day': isSelectedDay(day.date)
            }
          ]" :data-date="formatDate(day.date)" @click="onDayClick(day.date)">
            <div>
              <span :class="[
                'day-number',
                {
                  'today-number': isToday(day.date),
                  'sunday-number': day.date.getDay() === 0,
                  'holiday-number': getHolidayName(day.date),
                  'saturday-number': day.date.getDay() === 6
                }]"
                >
                {{ day.date.getDate() }}
              </span>
              <span v-if="getHolidayName(day.date)" class="ml-2 holiday-name">
                {{ getHolidayName(day.date) }}
              </span>
              <span class="position-absolute right-0 mr-2">
                <v-tooltip text="勤務形態" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="getWorkStyle(day.date).icon"
                      :color="getWorkStyle(day.date).color"
                      :size="getWorkStyle(day.date).size"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ランチ" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="getLunchParticipation(day.date).icon"
                      :color="getLunchParticipation(day.date).color"
                      :size="getLunchParticipation(day.date).size"
                      class="ml-2"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ディナー" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      :icon="getDinnerParticipation(day.date).icon"
                      :color="getDinnerParticipation(day.date).color"
                      :size="getDinnerParticipation(day.date).size"
                      class="ml-2"
                      >
                    </v-icon>
                  </template>
                </v-tooltip>
              </span>
            </div>

            <!-- <div v-if="getHolidayName(day.date)" class="holiday-name">
              {{ getHolidayName(day.date) }}
            </div> -->

            <div v-if="getEventsForDay(day.date).length > 0" class="day-events">
              <!-- <div v-for="(event, index) in getVisibleEvents(day.date)" :key="event.id" class="day-event" :style="{ '--event-color': `${eventTypeDetails[event.eventType]?.color}` }"
                @click.stop="onEventClick($event, event)">
                {{ event.startTime }} {{ event.title }}
              </div> -->
              <div v-for="(event, index) in getVisibleEvents(day.date, 2)" :key="event.id" class="day-event" :style="{ '--event-color': `${eventTypeDetails[event.eventType]?.color}` }">
                <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>

              <div v-if="getEventsForDay(day.date).length > 2" class="more-events">
                +{{ getEventsForDay(day.date).length - 2 }}件
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- <div class="calendar-grid">
    <div 
      v-for="day in calendarDays" 
      :key="`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`"
      :class="[
        'day-cell', 
        { 
          'other-month': !day.currentMonth,
          'today': isToday(day.date),
          'selected-day': isSelectedDay(day.date)
        }
      ]"
      :data-date="formatDate(day.date)"
      @click="onDayClick(day.date)"
    >
      <div 
        :class="[
          'day-number', 
          { 
            'today-number': isToday(day.date),
            'sunday-number': day.date.getDay() === 0,
            'saturday-number': day.date.getDay() === 6
          }
        ]"
      >
        {{ day.date.getDate() }}
      </div>
      
      <div v-if="getHolidayName(day.date)" class="holiday-name">
        {{ getHolidayName(day.date) }}
      </div>
      
      <div v-if="getEventsForDay(day.date).length > 0" class="day-events">
        <div 
          v-for="(event, index) in getVisibleEvents(day.date)" 
          :key="event.id" 
          class="day-event"
          @click.stop="onEventClick($event, event)"
        >
          {{ event.startTime }} {{ event.title }}
        </div>
        
        <div 
          v-if="getEventsForDay(day.date).length > 2" 
          class="more-events"
        >
          +{{ getEventsForDay(day.date).length - 2 }}件
        </div>
      </div>
    </div>
  </div> -->
</template>

<script setup lang="ts">
import { useCalendar } from '~/composables/useCalendar';
import { useConstants } from '~/composables/common/useConstants'

const props = defineProps({
  calendarDays: {
    type: Array < any >,
    required: true
  },
  selectedDate: {
    type: Date,
    default: null
  },
  events: {
    type: Array < EventDisplay >,
    required: true
  },
  dailyOptions: {
    type: Array < DailyUserOption >,
    required: true
  }
});

// const emit = defineEmits(['dayClick', 'eventClick']);
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

const dateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dailyOptionView = computed(() => {
  const result: Record<string, DailyUserOption> = {};
  props.dailyOptions.forEach(e => {
    result[e.date] = e
  });
  return result;
});

const getDailyOptions = (date: Date) => {
  return dailyOptionView.value[dateString(date)]
}

const getWorkStyle = (date: Date) => {
  const workStyle = getDailyOptions(date)?.workStyle;
  return workstyleDetails[workStyle ?? 'pending'];
}

const getLunchParticipation = (date: Date) => {
  const lunchParticipation = getDailyOptions(date)?.lunchParticipation;
  return participationLunchStatusDetails[lunchParticipation ?? 'pending'];
}

const getDinnerParticipation = (date: Date) => {
  const dinnerParticipation = getDailyOptions(date)?.dinnerParticipation;
  return participationDinnerStatusDetails[dinnerParticipation ?? 'pending'];
}

const chunk = <T extends any[]>(arr: T, size: number) => {
  return arr.reduce((preArr: T[][], current, index) => {
    if (index % size) {
      return preArr
    } else {
      return [...preArr, ...[arr.slice(index, index + size)]]
    }
  }, [] as T[][])
}

// 今日かどうかを判定
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// 選択中の日付かどうかを判定
const isSelectedDay = (date: Date) => {
  if (!props.selectedDate) return false;

  return date.getDate() === props.selectedDate.getDate() &&
    date.getMonth() === props.selectedDate.getMonth() &&
    date.getFullYear() === props.selectedDate.getFullYear();
};

// 特定の日付のイベントを取得（propsのeventsを使用）
const getEventsForDay = (date: Date) => {
  if (!props.events || !Array.isArray(props.events)) {
    return [];
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return props.events.filter(event => {
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
const getVisibleEvents = (date: Date, limit?: number) => {
  const events = getEventsForDay(date);
  return limit ? events.slice(0, limit) : events;
};

// 日付クリック時のイベント
const onDayClick = (date: Date) => {
  emit('dayClick', date);
};

// イベントクリック時のイベント
// const onEventClick = (event: Event, eventData: EventDisplay) => {
//   emit('eventClick', { event, eventData });
// };
</script>

<style scoped>
.calendar-grid {
  /* display: grid;
  grid-template-columns: repeat(7, 1fr); */
  /* gap: 10px; */
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
  /* display: grid;
  grid-template-columns: repeat(7, 1fr); */
  /* gap: 10px; */
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
  /* text-align: right; */
  font-size: 14px;
  /* font-weight: 500; */
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
  /* color: var(--event-color); */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  transition: var(--transition);
  cursor: pointer;
}

.day-event .event-time-range {
  font-size: 10px;
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