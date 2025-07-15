<template>
    <EventForm @submit="register"></EventForm>
</template>

<script setup lang="ts">
import { useEventService } from '~/services/eventService';

// useTransaction の代わりに useEventService を使用
const { createEvent } = useEventService();

const router = useRouter();

const register = async (formData: EventFormData) => {
  try {
    // フォームデータを eventService の createEvent 関数に渡す
    await createEvent(formData);
    // 成功したらカレンダーページなどに戻る
    router.back();
  } catch (error) {
    console.error("イベントの登録に失敗しました:", error);
    // ここでユーザーにエラー通知を出すなどの処理を追加できます
  }
}
</script>