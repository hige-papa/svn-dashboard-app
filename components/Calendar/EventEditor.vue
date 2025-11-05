<template>
  <EventForm v-if="event" :initial-data="event"  @submit="update"></EventForm>

  <Transition name="notification">
    <div v-if="notification.show" class="notification" :class="notification.type">
      <i class="mdi mdi-check icon"></i>
      <span>{{ notification.message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useTransaction } from '~/composables/transaction/useTransaction'
import { useCalendar } from '~/composables/useCalendar'

// head設定
useHead({
  title: 'TASCAL - 予定編集'
});

const { getAsync } = useTransaction('events')
const { updateEventAndRefresh } = useCalendar()

interface Props {
  eventId: string;
}

const props = defineProps<Props>();

const emit = defineEmits(['updated', 'error']);

const eventId = computed(() => props.eventId);

const origin = ref<any>()

const event = ref<any>()

const notification = reactive<any>({ show: false, message: '', type: 'success' })

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notification.message = message; notification.type = type; notification.show = true
  setTimeout(() => { notification.show = false }, 3000)
}

const update = async (data: EventFormData) => {
  try {
    // イベントデータを更新
    await updateEventAndRefresh(origin.value, data);
    showNotification('予定が正常に更新されました！')
    emit('updated', data);
  } catch (error) {
    console.error('イベントの更新に失敗しました:', error)
    showNotification('更新に失敗しました', 'error')
    emit('error', error);
  }
}

onMounted(async () => {
  // クエリパラメータからイベントIDを取得
  // const eventId = params.id as string

  // イベントIDが存在する場合、イベントデータを取得
  if (eventId.value) {
    try {
      event.value = await getAsync(eventId.value)
      origin.value = JSON.parse(JSON.stringify(event.value)) // ディープコピー
    } catch (error) {
      console.error('イベントの取得に失敗しました:', error)
    }
  } else {
    console.warn('イベントIDが指定されていません。')
  }
})
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