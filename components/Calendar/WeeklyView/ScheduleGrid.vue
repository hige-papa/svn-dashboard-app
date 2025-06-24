<template>
  <div class="schedule-grid">
    <div 
      v-for="user in visibleUsers" 
      :key="user.uid"
      class="schedule-row"
    >
      <div 
        v-for="day in weekDays" 
        :key="`${user.uid}-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`"
        :class="['day-cell', { 'today-cell': isToday(day) }]"
      >
        <div 
          v-for="(event, index) in getUserSchedulesForDay(user.uid, day)" 
          :key="event.id"
          :class="['event', event.type]"
          :style="{ top: `${10 + (index * 28)}px` }"
          @click="onEventClick($event, event)"
        >
          <span class="event-time">{{ event.startTime }}</span>
          <span class="event-title">{{ event.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCalendar } from '~/composables/useCalendar';

const props = defineProps({
  users: {
    type: Array,
    required: true
  },
  weekDays: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['eventClick']);

const { getUserSchedulesForDay } = useCalendar();

// 表示するユーザー（visible=trueのもののみ）
const visibleUsers = computed(() => {
  return props.users.filter(user => user.visible);
});

// 今日かどうかを判定
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// イベントクリック時のイベント
const onEventClick = (event, eventData) => {
  emit('eventClick', { event, eventData });
};
</script>

<style scoped>
.schedule-grid {
  display: block; /* グリッド全体をブロック要素に */
  min-width: 100%;
  width: max-content; /* 内容に合わせて幅を設定 */
}

.schedule-row {
  display: flex;
  height: 80px;
  position: relative;
}

.day-cell {
  width: 170px;
  min-width: 170px;
  height: 100%;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  position: relative;
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
  position: absolute;
  height: 26px;
  width: calc(100% - 12px);
  border-radius: var(--radius-sm);
  padding: 0 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  z-index: 10;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
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

.event-title {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-type-1 {
  background-color: var(--event-1-bg);
  border-left: 3px solid var(--event-1);
  color: var(--event-1);
}

.event-type-2 {
  background-color: var(--event-2-bg);
  border-left: 3px solid var(--event-2);
  color: var(--event-2);
}

.event-type-3 {
  background-color: var(--event-3-bg);
  border-left: 3px solid var(--event-3);
  color: var(--event-3);
}

.event-type-4 {
  background-color: var(--event-4-bg);
  border-left: 3px solid var(--event-4);
  color: var(--event-4);
}

.event-type-5 {
  background-color: var(--event-5-bg);
  border-left: 3px solid var(--event-5);
  color: var(--event-5);
}
</style>