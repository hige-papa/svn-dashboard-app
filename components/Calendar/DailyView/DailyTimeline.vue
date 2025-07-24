<template>
  <div class="day-schedule">
    <div class="time-column">
      <div 
        v-for="(time, index) in timeSlots" 
        :key="index" 
        class="time-slot" 
        :class="{
          'hour-slot': time.endsWith(':00'),
          'half-hour-slot': time.endsWith(':30')
        }"
      >
        {{ time.endsWith(':00') ? time : '' }}
      </div>
    </div>
    
    <div class="schedule-area">
      <div class="time-grid">
        <div 
          v-for="(time, index) in timeSlots" 
          :key="index" 
          class="time-grid-line" 
          :class="{
            'hour-line': time.endsWith(':00'),
            'half-hour-line': time.endsWith(':30')
          }"
          :style="{ top: `${index * 32}px` }"
        ></div>
      </div>
      
      <!-- 現在時刻インジケーター -->
      <div 
        v-if="isToday"
        class="current-time-indicator" 
        :style="{ top: `${currentTimePosition}px` }"
      >
        <div class="current-time-dot"></div>
      </div>
      
      <!-- スケジュールイベント -->
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event" 
        :style="{
          top: `${timeToPixels(event.startTime)}px`,
          height: `${timeToPixels(event.endTime) - timeToPixels(event.startTime)}px`,
          '--event-color': `${eventTypeDetails[event.eventType]?.color}`
        }"
        @click="onEventClick($event, event)"
      >
        <div class="event-title">{{ event.title }}</div>
        <div class="event-time">
          <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {{ event.startTime }} - {{ event.endTime }}
        </div>
        
        <div v-if="event.location" class="event-location">
          <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {{ event.location }}
        </div>
        
        <div v-if="event.participants && event.participants.length > 0" class="event-participants">
          <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {{ event.participants.join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useConstants } from '~/composables/common/useConstants'

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  timeSlots: {
    type: Array,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeToPixels: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['eventClick']);

const { eventTypeDetails } = useConstants()

// 今日の日付かどうか
const isToday = computed(() => {
  const today = new Date();
  return props.date.getDate() === today.getDate() &&
         props.date.getMonth() === today.getMonth() &&
         props.date.getFullYear() === today.getFullYear();
});

// 現在時刻の位置を計算
const currentTimePosition = ref(0);
let timerInterval = null;

const updateCurrentTimeIndicator = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // 8時から20時の間のみ表示
  if (hours >= 8 && hours <= 20) {
    currentTimePosition.value = props.timeToPixels(`${hours}:${minutes}`);
  }
};

// イベントのクリックハンドラ
const onEventClick = (event, eventData) => {
  emit('eventClick', { event, eventData });
};

onMounted(() => {
  // 初期位置を設定
  updateCurrentTimeIndicator();
  
  // 1分ごとに更新
  timerInterval = setInterval(updateCurrentTimeIndicator, 60000);
});

onBeforeUnmount(() => {
  // タイマーをクリア
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.day-schedule {
  display: flex;
  margin-bottom: 32px;
  background-color: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.time-column {
  width: 70px;
  border-right: 1px solid var(--border-color);
  background-color: var(--background-light);
  padding-right: 12px;
}

.time-slot {
  height: 32px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.hour-slot {
  border-top: 1px solid var(--border-color);
  font-weight: 600;
}

.half-hour-slot {
  border-top: 1px dashed var(--border-color);
}

.schedule-area {
  flex-grow: 1;
  position: relative;
  padding: 0 4px;
  min-height: 832px; /* 32px * 26 (全時間スロット) */
}

.time-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.time-grid-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 32px;
}

.hour-line {
  border-top: 1px solid var(--border-color);
}

.half-hour-line {
  border-top: 1px dashed rgba(0, 0, 0, 0.05);
}

.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--accent-color);
  z-index: 10;
}

.current-time-dot {
  position: absolute;
  left: 0;
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 50%;
  transform: translate(-5px, -4px);
  box-shadow: 0 0 0 2px white;
}

.event {
  position: absolute;
  left: 8px;
  right: 8px;
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-left: 4px solid var(--event-color);
  color: var(--event-color);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  overflow: hidden;
  cursor: pointer;
  z-index: 5;
  transition: var(--transition);
}

.event:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  background-color: var(--primary-light);
}

.event-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.event-time, .event-location, .event-participants {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.event-participants {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.small-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  flex-shrink: 0;
  opacity: 0.7;
}
</style>