<template>
  <div class="daily-timeline-container w-100 table_box">
    <v-table class="table-field">
      <thead>
        <tr>
          <th class="user-header sticky corner">メンバー</th>
          <th class="timeline-header sticky">
            <div class="time-row-header">
              <div 
                v-for="(time, index) in timeSlots" 
                :key="index" 
                class="time-slot-header" 
                :class="{
                  'hour-slot-header': time.endsWith(':00'),
                  'half-hour-slot-header': time.endsWith(':30')
                }"
                :style="{ left: `${index * 96}px` }"
              >
                <span v-if="time.endsWith(':00')" class="time-label-header">{{ time }}</span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in sortedUsers" 
          :key="user.id"
          class="schedule-row"
        >
          <td class="user-cell sticky">
            <div class="d-flex align-center justify-center mb-2">
              <v-avatar color="grey">
                <v-img v-if="user.avatar" :src="user.avatar"></v-img>
                <v-icon v-else icon="mdi-account" size="x-large"></v-icon>
              </v-avatar>
            </div>
            <div class="user-name">{{ user.name }}</div>
          </td>
          <td class="timeline-cell">
            <HorizontalTimeline
              :events="getUserEvents(user)"
              :date="props.date"
              :time-slots="timeSlots"
              :time-to-pixels="timeToPixelsForHorizontal"
              @event-click="handleEventClick"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User } from 'firebase/auth';
import { useCalendar } from '~/composables/useCalendar'

const user = useState<User>('user');

interface GroupMember {
    id: string
    type: 'user' | 'facility' | 'equipment'
    name: string
    avatar?: string
}

const props = defineProps({
  users: {
    type: Array as () => GroupMember[],
    required: true
  },
  events: {
    type: Array as () => EventDisplay[],
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const emit = defineEmits(['eventClick']);

const visibleUsers = computed(() => {
  return props.users;
});

const sortedUsers = computed(() => {
  return [...visibleUsers.value].sort((a, b) => {
    if (a.id === user.value.uid && b.id !== user.value.uid) return -1;
    if (b.id === user.value.uid && a.id !== user.value.uid) return 1;
    return a.name.localeCompare(b.name);
  });
});

const getUserEvents = (member: GroupMember): EventDisplay[] => {
  if (!props.events || !Array.isArray(props.events)) {
    return [];
  }
  switch (member.type) {
    case 'user':
      return props.events.filter(event => event.participantIds?.includes(member.id));
    case 'facility':
      return props.events.filter(event => event.facilityIds?.includes(member.id));
    case 'equipment':
      return props.events.filter(event => event.equipmentIds?.includes(member.id));
    default:
      return []
  }
};

const { timeSlots, timeToPixelsForHorizontal } = useCalendar()

// const timeSlots = computed(() => {
//   const slots = [];
//   for (let i = 8; i <= 21; i++) {
//     slots.push(`${String(i).padStart(2, '0')}:00`);
//     if (i < 21) {
//       slots.push(`${String(i).padStart(2, '0')}:30`);
//     }
//   }
//   return slots;
// });

// const timeToPixels = (time: string): number => {
//   if (!time) return 0;
//   const [hours, minutes] = time.split(':').map(Number);
//   const totalMinutes = (hours * 60) + minutes;
//   const startTotalMinutes = 8 * 60;
//   const pixelPerMinute = 64 / 60;
//   return (totalMinutes - startTotalMinutes) * pixelPerMinute;
// };

const handleEventClick = (payload: { event: Event, eventData: EventDisplay }) => {
  emit('eventClick', payload);
};
</script>

<style scoped>
.daily-timeline-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: 100%;
}

.table-field {
  width: 100%;
  table-layout: fixed;
}

.table_box {
  overflow-x: auto;
}

.sticky {
  position: sticky;
  top: 0;
  left: 0;
  background-color: #FFF;
}

.sticky.corner {
  z-index: 11; /* イベントより手前に表示 */
}

/* ヘッダースタイル */
.user-header, .timeline-header {
  height: 40px; /* ヘッダの高さを調整 */
  background-color: var(--background-light);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-secondary);
  vertical-align: middle;
}

.user-header {
  width: 180px;
  min-width: 150px;
  text-align: center;
  border-right: 1px solid var(--border-color);
}

.timeline-header {
  padding: 0;
  vertical-align: top;
}

/* 共通時間ヘッダのスタイル */
.time-row-header {
  position: relative;
  height: 100%;
  min-width: 832px; /* 32px * 26 slots */
}

.time-slot-header {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  padding-left: 8px;
  width: 64px; /* 1時間分 */
}

.hour-slot-header {
  border-left: 1px solid var(--border-color);
  font-weight: 600;
}

.half-hour-slot-header {
  border-left: 1px dashed var(--border-color);
}

.time-label-header {
  transform: translateY(10px);
}

/* ユーザー情報セル */
.user-cell {
  width: 180px;
  min-width: 150px;
  text-align: center;
  vertical-align: center;
  padding-top: 16px;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  z-index: 20; /* イベントより手前に表示 */
}

.schedule-row:last-child .user-cell {
  border-bottom: none;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  white-space: nowrap;
}

/* タイムラインセル */
.timeline-cell {
  padding: 0;
  vertical-align: top;
  border-bottom: 1px solid var(--border-color);
}

.schedule-row:last-child .timeline-cell {
  border-bottom: none;
}

.schedule-row {
  height: 85px; /* 行の高さを調整 */
}

@media (max-width: 768px) {
  .user-header, .user-cell {
    width: 120px;
    min-width: 120px;
  }
  
  .user-name {
    font-size: 12px;
  }
}
</style>