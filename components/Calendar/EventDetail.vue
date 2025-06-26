<template>
  <div v-if="visible" class="event-details" :style="{ top: `${top}px`, left: `${left}px` }">
    <div class="detail-header">
      <div>
        <div class="detail-title">{{ event.title }}</div>
        <div class="detail-time">{{ formattedDateTime }}</div>
      </div>
      <div class="detail-actions">
        <button class="detail-view" @click="viewEvent" title="表示">
          <svg class="view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="detail-edit" @click="editEvent" title="編集">
          <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="detail-close" @click="closeDetails" title="閉じる">×</button>
      </div>
    </div>
    
    <div class="detail-item">
      <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <div class="detail-content">{{ event.location || 'なし' }}</div>
    </div>
    
    <div class="detail-item">
      <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <div class="detail-content">{{ formattedParticipants }}</div>
    </div>
    
    <div class="detail-item" v-if="event.description">
      <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <div class="detail-content">{{ event.description }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useCalendar } from '~/composables/useCalendar';

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  }
});

const emit = defineEmits(['close']);

const { formatDate } = useCalendar();

// ルーター
const router = useRouter();

// 表示位置
const top = ref(props.position.top);
const left = ref(props.position.left);

// 位置の更新
watch(() => props.position, (newPosition) => {
  top.value = newPosition.top;
  left.value = newPosition.left;
}, { immediate: true });

// フォーマットされた日時
const formattedDateTime = computed(() => {
  if (!props.event) return '';
  
  const date = new Date(props.event.date);
  return `${formatDate(date)} ${props.event.startTime} - ${props.event.endTime}`;
});

// フォーマットされた参加者
const formattedParticipants = computed(() => {
  if (!props.event || !props.event.participants) return 'なし';
  return props.event.participants.join(', ');
});

// 詳細を閉じる
const closeDetails = () => {
  emit('close');
};

// 表示ページへ遷移
const viewEvent = () => {
  if (props.event && props.event.id) {
    router.push(`/calendar/${props.event.id}`);
  }
};

// 編集ページへ遷移
const editEvent = () => {
  if (props.event && props.event.id) {
    router.push(`/calendar/${props.event.id}/edit`);
  }
};
</script>

<style scoped>
.event-details {
  position: absolute;
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 16px;
  width: 320px;
  z-index: 1000; /* 高い値を設定してポップアップを最前面に */
  border: 1px solid var(--border-color);
  animation: fade-in 0.2s ease-out; /* アニメーション追加 */
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-header {
  display: flex;
  justify-content: space-between;
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
  font-size: 14px;
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
  background-color: var(--success-light, #e8f5e8);
  color: var(--success, #4caf50);
}

.detail-edit:hover {
  background-color: var(--primary-light, #e3f2fd);
  color: var(--primary, #1976d2);
}

.detail-close {
  font-size: 18px;
}

.detail-close:hover {
  background-color: var(--background-light);
  color: var(--text-primary);
}

.view-icon,
.edit-icon {
  width: 16px;
  height: 16px;
}

.detail-item {
  display: flex;
  margin-top: 12px;
}

.detail-icon {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.detail-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .event-details {
    width: 280px;
  }
}
</style>