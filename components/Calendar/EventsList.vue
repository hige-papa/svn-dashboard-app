<template>
  <div>
    <div v-if="props.events.length === 0" class="no-events">
      予定はありません
    </div>
    <div v-else>
      <EventCard 
        v-for="event in props.events" 
        :key="event.id" 
        :event="event"
        @event-click="onEventClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  user?: ExtendedUserProfile;
  date?: Date
  events?: EventDisplay[]
}

const props = withDefaults(defineProps<Props>(), {
  date: () => new Date(),
  events: () => []
});

const emit = defineEmits(['eventClick']);

const onEventClick = (data: EventDisplay) => {
  emit('eventClick', data);
};
</script>

<style scoped>
.no-events {
  text-align: center;
  padding: 40px 0;
  color: var(--text-light);
  font-size: 15px;
  background-color: var(--background-light);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

@media (max-width: 768px) {
  .list-title {
    font-size: 14px;
  }
}
</style>