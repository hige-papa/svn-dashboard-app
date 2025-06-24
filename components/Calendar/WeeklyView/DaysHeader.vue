<template>
  <div class="days-row">
    <div 
      v-for="day in weekDays" 
      :key="`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`"
      :class="[
        'day-header', 
        { 'today-header': isToday(day) }
      ]"
    >
      <div 
        :class="[
          'day-name', 
          { 
            'sunday': day.getDay() === 0,
            'saturday': day.getDay() === 6
          }
        ]"
      >
        {{ getDayOfWeek(day) }}曜日
      </div>
      <div class="day-date">{{ formatShortDate(day) }}</div>
    </div>
  </div>
</template>

<script setup>
import { useCalendar } from '~/composables/useCalendar';

const props = defineProps({
  weekDays: {
    type: Array,
    required: true
  }
});

const { getDayOfWeek, formatShortDate } = useCalendar();

// 今日かどうかを判定
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};
</script>

<style scoped>
.days-row {
  display: flex;
  min-width: 100%;
  width: max-content; /* 内容に合わせて幅を設定 */
}

.day-header {
  width: 170px;
  min-width: 170px;
  height: 60px;
  background-color: var(--background-light);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  flex-shrink: 0; /* ヘッダーは縮小しない */
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

.today-header {
  background-color: var(--primary-light);
  border-bottom: 2px solid var(--primary-color);
}
</style>