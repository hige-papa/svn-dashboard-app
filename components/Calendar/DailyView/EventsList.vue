<template>
  <div class="events-list">
    <h3 class="list-title">本日の予定一覧</h3>
    <div v-if="events.length === 0" class="no-events">
      予定はありません
    </div>
    <div v-else>
      <EventCard 
        v-for="event in events" 
        :key="event.id" 
        :event="event"
        @event-click="onEventClick"
      />
    </div>
  </div>
</template>

<script setup>
import EventCard from './EventCard.vue';

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['eventClick']);

const onEventClick = (data) => {
  emit('eventClick', data);
};
</script>

<style scoped>
.events-list {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.list-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 20px;
  background-color: var(--primary-color);
  margin-right: 10px;
  border-radius: 2px;
}

.no-events {
  text-align: center;
  padding: 40px 0;
  color: var(--text-light);
  font-size: 15px;
  background-color: var(--background-light);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}
</style>