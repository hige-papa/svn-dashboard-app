<template>
  <div class="calendar-grid">
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
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCalendar } from '~/composables/useCalendar';

const props = defineProps({
  calendarDays: {
    type: Array,
    required: true
  },
  selectedDate: {
    type: Date,
    default: null
  },
  events: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['dayClick', 'eventClick']);

const { 
  formatDate, 
  getHolidayName 
} = useCalendar();

// 今日かどうかを判定
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// 選択中の日付かどうかを判定
const isSelectedDay = (date) => {
  if (!props.selectedDate) return false;
  
  return date.getDate() === props.selectedDate.getDate() &&
         date.getMonth() === props.selectedDate.getMonth() &&
         date.getFullYear() === props.selectedDate.getFullYear();
};

// 特定の日付のイベントを取得（propsのeventsを使用）
const getEventsForDay = (date) => {
  if (!props.events || !Array.isArray(props.events)) {
    return [];
  }
  
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  return props.events.filter(event => {
    // 日付でフィルタリング
    if (event.date === dateStr || event.startDate === dateStr) {
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
const getVisibleEvents = (date) => {
  const events = getEventsForDay(date);
  return events.slice(0, 2);
};

// 日付クリック時のイベント
const onDayClick = (date) => {
  emit('dayClick', date);
};

// イベントクリック時のイベント
const onEventClick = (event, eventData) => {
  emit('eventClick', { event, eventData });
};
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-cell {
  border-radius: 10px;
  border: 1px solid var(--border-color);
  min-height: 110px;
  padding: 8px;
  position: relative;
  transition: var(--transition);
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
  text-align: right;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 6px;
}

.other-month .day-number {
  color: var(--text-light);
}

.today-number {
  /* display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 600; */
}

.sunday-number {
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
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: rgba(76, 201, 240, 0.1);
  border-left: 3px solid var(--primary-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  transition: var(--transition);
  cursor: pointer;
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
</style>