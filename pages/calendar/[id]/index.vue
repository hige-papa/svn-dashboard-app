<template>
  <EventView v-if="event" :event-data="event" @edit="handleEdit" @delete="handleDelete" @copy="handleCopy"></EventView>
</template>

<script setup lang="ts">
import { useTransaction } from '~/composables/transaction/useTransaction'

// head設定
useHead({
  title: 'TASCAL - 予定詳細'
});

const { getAsync, deleteAsync } = useTransaction('events')

const { params } = useRoute()

// ルーター
const router = useRouter();

const event = ref<EventData>()

const handleEdit = (data: any) => {
  // 編集画面に遷移
  router.push(`/calendar/${data.id}/edit`);
}

const handleDelete = async (id: string) => {
  // 削除処理
  await deleteAsync(id)

  router.back()
}

const handleCopy = (data: any) => {
  // 複製処理
}


onMounted(async () => {
  // クエリパラメータからイベントIDを取得
  const eventId = params.id as string

  // イベントIDが存在する場合、イベントデータを取得
  if (eventId) {
    try {
      event.value = await getAsync(eventId)
    } catch (error) {
      console.error('イベントの取得に失敗しました:', error)
    }
  } else {
    console.warn('イベントIDが指定されていません。')
  }
})
</script>