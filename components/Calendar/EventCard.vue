<template>
  <div
    class="event-card event-type" 
    :style="{ '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey' }"
    @click="onEventClick">
    <div v-if="event.conflicted" class="pa-0 ma-0 d-flex align-center">
      <v-icon icon="mdi-alert-circle" size="default" color="warning"
        class="mr-1"></v-icon>
      <span class="text-warning" style="font-size: 14px;">重複予定あり</span>
    </div>
    <!-- <div>conflicted:{{ event.conflicted }}</div> -->
    <div class="event-card-header">
      <div class="event-card-title">{{ isViewable(event) ? event.title : '予定あり' }}</div>
      <div class="event-card-time">{{ event.startTime }} - {{ event.endTime }}</div>
    </div>
    
    <div v-if="event.location && isViewable(event)" class="event-card-detail">
      <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span>{{ event.location }}</span>
    </div>
    
    <div v-if="event.participants && event.participants.length > 0 && isViewable(event)" class="event-card-detail">
      <svg class="small-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <span>{{ event.participants.join(', ') }}</span>
    </div>
    
    <div v-if="event.description && isViewable(event)" class="event-card-description">
      {{ event.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from 'firebase/auth';
import { useConstants } from '~/composables/common/useConstants';

const user = useState<User>('user');

interface Props {
  event: EventDisplay
}

const props = defineProps<Props>();

const emit = defineEmits(['eventClick']);

const { eventTypeDetails } = useConstants()

const isViewable = (event: EventDisplay) => {
  return event.private ? (event.participantIds?.includes(user.value.uid)) ?? false : true
}

const onEventClick = (e: Event) => {
  emit('eventClick', { event: e, eventData: props.event });
};
</script>

<style scoped>
.event-type {
  border-left: 4px solid var(--event-color);
  border-top: 1px solid color-mix(in srgb, var(--event-color) 90%, #FFF 10%);
  border-right: 1px solid color-mix(in srgb, var(--event-color) 90%, #FFF 10%);
  border-bottom: 1px solid color-mix(in srgb, var(--event-color) 90%, #FFF 10%);
  color: var(--event-color);
}

.event-card {
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  background-color: var(--background-white);
  cursor: pointer;
}

.event-card:hover {
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--event-color) 90%, #000 10%);
  transform: translateY(-2px);
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.event-card-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.event-card-time {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  background-color: var(--primary-light);
  padding: 4px 10px;
  border-radius: 50px;
}

.event-card-detail {
  display: flex;
  align-items: flex-start;
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.event-card-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.small-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  flex-shrink: 0;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .event-card-title {
    font-size: 14px;
  }

  .event-card-time {
    font-size: 12px;
  }

  .event-card-detail {
    font-size: 12px;
  }

  .event-card-description {
    font-size: 12px;
  }
}
</style>