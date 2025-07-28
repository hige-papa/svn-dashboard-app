<script setup lang="ts">
import textFile from '~/content/nuxt3-guide-intro.txt'

const content = ref<string>()

onMounted(async () => {
  try {
    const response = await fetch(textFile);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    content.value = await response.text();
  } catch (error) {
    console.error('ファイルの読み込みに失敗しました:', error);
  }
});
</script>

<template>
    <v-container>
        <MarkdownRenderer v-if="content" :content="content"></MarkdownRenderer>
    </v-container>
</template>
