<template>
    <EventForm :date="props.date" :participant-ids="props.participantIds" @submit="handleSubmit"></EventForm>

    <Transition name="notification">
        <div v-if="notification.show" class="notification" :class="notification.type">
        <i class="mdi mdi-check icon"></i>
        <span>{{ notification.message }}</span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { useEventService } from '~/services/eventService';
import { useCalendar } from '~/composables/useCalendar'

// head設定
useHead({
  title: 'TASCAL - 予定新規登録'
});

const emit = defineEmits(['registered', 'error']);

// useTransaction の代わりに useEventService を使用
// const { createEvent } = useEventService();
const { createEventAndRefresh } = useCalendar();

// const router = useRouter();

// const { query } = useRoute();

// const date = computed(() => {
//   return query.date as string ?? undefined
// })

// const participantIds = computed(() => {
//   return query.participantId ? [query.participantId as string] : undefined
// })

interface Props {
  date?: string,
  participantIds?: string[],
}

const props = withDefaults(defineProps<Props>(), {})

const notification = reactive<any>({ show: false, message: '', type: 'success' })

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notification.message = message; notification.type = type; notification.show = true
  setTimeout(() => { notification.show = false }, 3000)
}

const handleSubmit = async (formData: EventFormData) => {
  try {
    // フォームデータを eventService の createEvent 関数に渡す
    await createEventAndRefresh(formData);
    showNotification('予定が正常に登録されました！')
    emit('registered');
  } catch (error) {
    console.error("イベントの登録に失敗しました:", error);
    showNotification('登録に失敗しました', 'error')
    emit('error', error);
  }
}
</script>

<style scoped>
.notification {
  position: fixed;
  top: 80px;
  right: 24px;
  background-color: #22c55e;
  /* --success-color */
  color: white;
  padding: 16px 24px;
  border-radius: 6px;
  /* --radius-sm */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  /* --shadow-lg */
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.notification.error {
  background-color: #dc2626;
  /* --danger-color */
}
</style>