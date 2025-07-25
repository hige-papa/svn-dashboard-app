<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();

const stat = useState<any>('appState');

onBeforeMount(() => {
  if (mobile) {
    stat.value.drawer = false;
    stat.value.rail = false;
  }
})
</script>