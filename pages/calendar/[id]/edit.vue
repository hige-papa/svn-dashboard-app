<template>
  <EventForm v-if="event" :initial-data="event"  @submit="update"></EventForm>
</template>

<script setup lang="ts">
import { useTransaction } from '~/composables/transaction/useTransaction'

const { getAsync, updateAsync } = useTransaction('events')

const { params } = useRoute()

const router = useRouter();

const event = ref<any>()

const update = async (data: any) => {
  try {
    // イベントデータを更新
    await updateAsync(event.value.id, data);
    
    // 更新後のイベントデータを取得
    // const updatedEvent = await getAsync(data.id)
    // Object.assign(event.value, updatedEvent)

    // 成功したらカレンダーページなどに戻る
    router.back();
  } catch (error) {
    console.error('イベントの更新に失敗しました:', error)
  }
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