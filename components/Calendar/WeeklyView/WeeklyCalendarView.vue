<template>
  <!-- {{ props.weekDays }} -->
  <!-- {{ props.visibleUsers }} -->
  <!-- {{ props.events }} -->
  <div class="calendar-container">
    <div class="user-column">
      <div class="user-header">メンバー</div>
      <div class="user-list">
        <div 
          v-for="user in visibleUsers" 
          :key="user.uid"
          class="user-row"
        >
          <div :class="['user-icon', user.color]">{{ user.initial }}</div>
          <div class="user-name">{{ user.displayName }}</div>
        </div>
      </div>
    </div>
    
    <div class="calendar-grid-wrapper">
      <div class="calendar-header">
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
      </div>
      
      <div class="calendar-body">
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
                v-for="(event, index) in getUserEventsForDay(user.uid, day)" 
                :key="event.id"
                :class="['event', `event-type-${(event.userId || index % 5) + 1}`]"
                :style="{ top: `${10 + (index * 28)}px` }"
                @click="onEventClick($event, event)"
              >
                <span class="event-time">{{ event.startTime }}</span>
                <span class="event-title">{{ event.title }}</span>
              </div>
            </div>
          </div>
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
  },
  events: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['eventClick']);

const { 
  getDayOfWeek, 
  formatShortDate
} = useCalendar();

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

// 特定のユーザーと日付のイベントを取得（propsのeventsを使用）
const getUserEventsForDay = (userId, date) => {
  if (!props.events || !Array.isArray(props.events)) {
    return [];
  }
  
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  return props.events.filter(event => {
    // ユーザーIDでフィルタリング
    if (!event.participantIds.includes(userId)) {
      return false;
    }
    
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

// イベントクリック時のイベント
const onEventClick = (event, eventData) => {
  emit('eventClick', { event, eventData });
};
</script>

<style scoped>
.calendar-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 600px; /* 高さを増加 */
  width: 100%; /* 幅を100%に設定 */
}

.user-column {
  width: 180px; /* 少し幅を減らす */
  min-width: 120px;
  border-right: 1px solid var(--border-color);
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

.user-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px; /* 余白を少し縮小 */
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-color-1 { background-color: var(--event-1-bg); color: var(--event-1); }
.user-color-2 { background-color: var(--event-2-bg); color: var(--event-2); }
.user-color-3 { background-color: var(--event-3-bg); color: var(--event-3); }
.user-color-4 { background-color: var(--event-4-bg); color: var(--event-4); }
.user-color-5 { background-color: var(--event-5-bg); color: var(--event-5); }

.user-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  white-space: nowrap;
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
  flex: 1;
  height: 60px;
  background-color: var(--background-light);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
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
  display: flex;
  height: 80px;
  min-height: 80px;
  width: 100%;
}

.day-cell {
  flex: 1;
  position: relative;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
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
  left: 4px;
  right: 4px;
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

/* 日次・月次ビューと統一したイベントスタイル */
.event-type-1 {
  background-color: #e6f2ff; /* var(--event-1-bg) に近い色 */
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
}

@media (max-width: 768px) {
  .calendar-container {
    height: 500px;
  }
  
  .user-column {
    width: 80px;
    min-width: 80px;
  }
  
  .user-name {
    font-size: 12px;
  }
  
  .day-name, .day-date {
    font-size: 12px;
  }
}
</style>