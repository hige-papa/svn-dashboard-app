<template>
  <div class="horizontal-schedule">
    <div class="time-row">
      <div 
        v-for="(time, index) in timeSlots" 
        :key="index" 
        class="time-slot" 
        :class="{
          'hour-slot': time.endsWith(':00'),
          'half-hour-slot': time.endsWith(':30')
        }"
        :style="{ left: `${index * 32}px` }"
      >
        <span v-if="time.endsWith(':00')" class="time-label">{{ time }}</span>
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
          :style="{ left: `${index * 32}px` }"
        ></div>
      </div>
      
      <div 
        v-if="isToday"
        class="current-time-indicator" 
        :style="{ left: `${currentTimePosition}px` }"
      >
        <div class="current-time-dot"></div>
      </div>
      
      <div 
        v-for="(event, index) in events"
        :key="event.id"
        class="event"
        :style="{
          top: `${getEventTopPosition(index)}px`,
          left: `${timeToPixels(event.startTime)}px`,
          width: `${timeToPixels(event.endTime) - timeToPixels(event.startTime)}px`,
          '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey',
        }"
        @click="onEventClick($event, event)"
      >
        <div class="event-details">
          <div class="event-title">{{ isViewable(event) ? event.title : '予定あり' }}</div>
          <div class="event-time">
            <svg class="small-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {{ event.startTime }} - {{ event.endTime }}
          </div>
          <div v-if="event.location" class="event-location">
             <svg class="small-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {{ event.location }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConstants } from '~/composables/common/useConstants';
import type { User } from 'firebase/auth';

const user = useState<User>('user');

const props = defineProps({
  events: {
    type: Array<EventDisplay>,
    required: true
  },
  timeSlots: {
    type: Array<string>,
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

const { eventTypeDetails } = useConstants();

const isViewable = (event: EventDisplay) => {
  return event.private ? (event.participantIds?.includes(user.value.uid)) ?? false : true;
}

const isToday = computed(() => {
  const today = new Date();
  return props.date.getDate() === today.getDate() &&
         props.date.getMonth() === today.getMonth() &&
         props.date.getFullYear() === today.getFullYear();
});

const currentTimePosition = ref(0);
let timerInterval: NodeJS.Timeout | string | number | undefined = undefined;

const updateCurrentTimeIndicator = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  if (hours >= 8 && hours <= 20) {
    currentTimePosition.value = props.timeToPixels(`${hours}:${minutes}`);
  }
};

const getEventTopPosition = (index: number) => {
  // イベントが重ならないように表示するための簡易的なtop位置計算
  return (index % 3) * 65 + 5; // 3段まで表示し、それ以降は折り返す
};

const onEventClick = (event: Event, eventData: EventDisplay) => {
  emit('eventClick', { event, eventData });
};

onMounted(() => {
  updateCurrentTimeIndicator();
  timerInterval = setInterval(updateCurrentTimeIndicator, 60000);
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.horizontal-schedule {
  display: flex;
  flex-direction: column;
  background-color: var(--background-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow-x: auto;
  overflow-y: hidden;
}

.time-row {
  position: relative;
  display: flex;
  height: 40px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-light);
  min-width: 832px; /* 32px * 26 slots */
}

.time-slot {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  padding-left: 8px;
  width: 64px; /* 1時間分 */
}

.hour-slot {
  border-left: 1px solid var(--border-color);
  font-weight: 600;
}

.half-hour-slot {
  border-left: 1px dashed var(--border-color);
}

.time-label {
  transform: translateY(-5px);
}

.schedule-area {
  position: relative;
  flex-grow: 1;
  min-height: 220px;
  min-width: 832px; /* 32px * 26 slots */
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
  top: 0;
  bottom: 0;
  width: 1px;
}

.hour-line {
  border-left: 1px solid var(--border-color);
}

.half-hour-line {
  border-left: 1px dashed rgba(0, 0, 0, 0.05);
}

.current-time-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--accent-color);
  z-index: 10;
}

.current-time-dot {
  position: absolute;
  top: 0;
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 50%;
  transform: translate(-4px, -5px);
  box-shadow: 0 0 0 2px white;
}

.event {
  position: absolute;
  top: 5px;
  height: 60px;
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-top: 4px solid var(--event-color);
  color: var(--event-color);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  overflow: hidden;
  cursor: pointer;
  z-index: 5;
  transition: var(--transition);
  display: flex;
  align-items: center;
}

.event:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  background-color: var(--primary-light);
  z-index: 6;
}

.event-details {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.event-time, .event-location {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.small-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  flex-shrink: 0;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
}
</style>