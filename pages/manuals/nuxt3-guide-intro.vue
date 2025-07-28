<script setup lang="ts">
import textFile from '~/public/content/nuxt3-guide-intro.txt'

const { back } = useRouter();

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
    <v-btn variant="text" @click="back" prepend-icon="mdi-chevron-left" color="primary">戻る</v-btn>
    <MarkdownRenderer v-if="content" :content="content" variant="flat" elevation="0"></MarkdownRenderer>
    <v-list-item>
      <template v-slot:append>
        <v-btn variant="text" @click="back" prepend-icon="mdi-chevron-left" color="primary">戻る</v-btn>
      </template>
    </v-list-item>
  </v-container>
</template>
