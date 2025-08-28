<template>
  <div class="horizontal-schedule">
    <div class="schedule-area">
      <div class="time-grid">
        <div v-for="(time, index) in timeSlots" :key="index" class="time-grid-line" :class="{
          'hour-line': time.endsWith(':00'),
          'half-hour-line': time.endsWith(':30')
        }" :style="{ left: `${index * 96}px` }"></div>
      </div>

      <!-- <div v-if="isToday" class="current-time-indicator" :style="{ left: `${currentTimePosition}px` }">
        <div class="current-time-dot"></div>
      </div> -->

      <div v-for="(event, index) in events" :key="event.id" class="event" :style="{
        top: `${getEventTopPosition(index)}px`,
        left: `${timeToPixels(event.startTime)}px`,
        width: `${timeToPixels(event.endTime) - timeToPixels(event.startTime)}px`,
        '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey',
      }" @click="onEventClick($event, event)">
        <div class="event-details">
          <div class="event-title">{{ isViewable(event) ? event.title : '予定あり' }}</div>
          <!-- <div class="event-time">
            <svg class="small-icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {{ event.startTime }} - {{ event.endTime }}
          </div> -->
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
    type: Array<EventDisplay>, // EventDisplay
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

const isViewable = (event: any) => { // EventDisplay
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
  // イベントが時間的に重なった場合、縦に並べて表示
  // 行の高さに合わせて最大2段までとする
  return (index % 2) * 40 + 5;
};

const onEventClick = (event: Event, eventData: any) => { // EventDisplay
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
  /* table cellに埋め込むため、不要なスタイルを削除 */
  overflow-x: hidden;
  overflow-y: hidden;
}

.schedule-area {
  position: relative;
  flex-grow: 1;
  min-height: 85px;
  /* 親の行の高さに合わせる */
  min-width: 1920px;
  /* 96px * 20 slots */
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
  height: 35px;
  /* 高さを調整 */
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-top: 4px solid var(--event-color);
  color: var(--event-color);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  /* paddingを調整 */
  overflow: hidden;
  cursor: pointer;
  z-index: 5;
  transition: var(--transition);
  display: flex;
  align-items: flex-start;
  /* contentを上揃えに */
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
  font-size: 13px;
  /* font sizeを調整 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.event-time {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 11px;
  /* font sizeを調整 */
  margin-top: 2px;
  /* marginを調整 */
}

.event-location {
  display: none;
  /* 省スペースのため非表示 */
}

.small-icon {
  width: 12px;
  /* icon sizeを調整 */
  height: 12px;
  margin-right: 4px;
  /* marginを調整 */
  flex-shrink: 0;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
}
</style>