<template>
  <div class="event-card" @click="onEventClick">
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
    
    <div v-if="event.description" class="event-card-description">
      {{ event.description }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['eventClick']);

const onEventClick = (e) => {
  emit('eventClick', { event: e, eventData: props.event });
};
</script>

<style scoped>
.event-card {
  border: 1px solid var(--border-color);
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
  border-color: var(--primary-color);
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
</style>