<template>
  <!-- <div v-if="visible" class="event-details" :style="{ top: `${top}px`, left: `${left}px` }"> -->
  <v-card>
    <v-container>
      <div class="detail-header">
        <div>
          <div class="detail-title">{{ isViewable ? event.title : '予定あり' }}</div>
          <div class="detail-time">{{ formattedDateTime }}</div>
        </div>
        <div class="detail-actions">
          <button v-if="isViewable" class="detail-view" @click="viewEvent" title="表示">
            <svg class="view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button v-if="isViewable" class="detail-edit" @click="editEvent" title="編集">
            <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="detail-close" @click="closeDetails" title="閉じる">×</button>
        </div>
      </div>

      <div v-if="isViewable" class="detail-item">
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <div class="detail-content">{{ event.location || 'なし' }}</div>
      </div>

      <div v-if="isViewable" class="detail-item">
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <div class="detail-content">{{ formattedParticipants }}</div>
      </div>

      <div class="detail-item" v-if="isViewable && event.description">
        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <div class="detail-content">{{ event.description }}</div>
      </div>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCalendar } from '~/composables/useCalendar';
import type { User } from 'firebase/auth';

const user = useState<User>('user');

const props = defineProps<{
  event: EventDisplay;
  // visible: boolean;
  // position: { top: number; left: number };
}>();

const emit = defineEmits(['view', 'edit', 'close']);

const isViewable = computed(() => {
  return props.event.private ? (props.event.participantIds?.includes(user.value.uid)) ?? false : true
})

const { formatDate, users } = useCalendar();
const router = useRouter();

// const top = ref(props.position.top);
// const left = ref(props.position.left);

// watch(() => props.position, (newPosition) => {
//   top.value = newPosition.top;
//   left.value = newPosition.left;
// }, { immediate: true, deep: true });

// ★ 修正: 期間表示を正しく行う
const formattedDateTime = computed(() => {
  if (!props.event?.date) return '';

  const time = `${props.event.startTime} - ${props.event.endTime}`;

  if (props.event.isMultiDay && props.event.originalStartDate && props.event.endDate) {
    const startStr = formatDate(new Date(`${props.event.originalStartDate}T00:00:00`));
    const endStr = formatDate(new Date(`${props.event.endDate}T00:00:00`));
    return `期間: ${startStr} 〜 ${endStr} (${time})`;
  }

  const dateStr = formatDate(new Date(`${props.event.date}T00:00:00`));
  return `${dateStr} ${time}`;
});

// ★ 修正: 参加者IDを名前に変換して表示する
const formattedParticipants = computed(() => {
  if (!props.event?.participantIds || props.event.participantIds.length === 0) {
    return 'なし';
  }

  const userMap = new Map(users.value.map(u => [u.uid, u.displayName]));

  return props.event.participantIds
    .map(id => userMap.get(id) || '不明なユーザー')
    .join(', ');
});

const closeDetails = () => emit('close');

const viewEvent = () => {
  // if (props.event?.id) router.push(`/calendar/${props.event.id}`);
  emit('view', props.event)
};

const editEvent = () => {
  // if (props.event?.id) router.push(`/calendar/${props.event.id}/edit`);
  emit('edit', props.event)
};
</script>

<style scoped>
.event-details {
  /* position: absolute; */
  background-color: white;
  /* border-radius: var(--radius-lg); */
  box-shadow: var(--shadow-lg);
  padding: 16px;
  /* width: 320px; */
  height: 100%;
  width: 100%;
  z-index: 1000;
  /* border: 1px solid var(--border-color); */
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.detail-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
  font-size: 16px;
}

.detail-time {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.detail-actions {
  display: flex;
  gap: 4px;
}

.detail-view,
.detail-edit,
.detail-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.detail-view:hover {
  background-color: #e8f5e8;
  color: #4caf50;
}

.detail-edit:hover {
  background-color: #e3f2fd;
  color: #1976d2;
}

.detail-close {
  font-size: 20px;
  line-height: 1;
}

.detail-close:hover {
  background-color: #f5f5f5;
  color: var(--text-primary);
}

.view-icon,
.edit-icon {
  width: 16px;
  height: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-top: 12px;
}

.detail-icon {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  flex-shrink: 0;
  color: var(--text-secondary);
  margin-top: 2px;
}

.detail-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-all;
}
</style>