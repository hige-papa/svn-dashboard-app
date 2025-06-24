<template>
    <EventForm @submit="register"></EventForm>
</template>

<script setup lang="ts">
import { useTransaction } from '~/composables/transaction/useTransaction'

const { addAsync } = useTransaction('events')

const register = async (model: any) => {
  // alert(JSON.stringify(model, null, 2));
  await addAsync(model);
}
</script>