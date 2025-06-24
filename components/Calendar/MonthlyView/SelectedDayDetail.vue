<template>
  <div v-if="selectedDate" class="selected-day-details">
    <h3 class="details-title">
      {{ formattedDate }}（{{ dayOfWeek }}）の予定
    </h3>
    
    <div v-if="events.length === 0" class="no-events">
      予定はありません
    </div>
    
    <div v-else>
      <div 
        v-for="event in events" 
        :key="event.id"
        class="event-card"
        @click="onEventClick($event, event)"
      >
        <div class="event-card-header">
          <div class="event-card-title">{{ event.title }}</div>
          <div class="event-card-time">{{ event.startTime }} - {{ event.endTime }}</div>
        </div>
        
        <div v-if="event.location" class="event-card-detail">
          <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{{ event.location }}</span>
        </div>
        
        <div v-if="event.participants && event.participants.length > 0" class="event-card-detail">
          <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>{{ event.participants.join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCalendar } from '~/composables/useCalendar';

const props = defineProps({
  selectedDate: {
    type: Date,
    default: null
  },
  events: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['eventClick']);

const { formatDate, getDayOfWeek } = useCalendar();

// フォーマットされた日付
const formattedDate = computed(() => {
  if (!props.selectedDate) return '';
  return formatDate(props.selectedDate);
});

// 曜日
const dayOfWeek = computed(() => {
  if (!props.selectedDate) return '';
  return getDayOfWeek(props.selectedDate);
});

// イベントクリック時のイベント
const onEventClick = (event, eventData) => {
  emit('eventClick', { event, eventData });
};
</script>

<style scoped>
.selected-day-details {
  margin-top: 32px;
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
}

.details-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.event-card {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  transition: var(--transition);
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.event-card-title {
  font-weight: 600;
  color: var(--text-primary);
}

.event-card-time {
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 500;
}

.event-card-detail {
  display: flex;
  align-items: flex-start;
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.small-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.no-events {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  background-color: var(--background-light);
  border-radius: 10px;
  font-size: 15px;
}
</style>