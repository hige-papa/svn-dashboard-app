<template>
  <div class="page-container">
    <v-card>
      <v-card-title>
        <h1>移動・リサイズ可能なモーダル</h1>
      </v-card-title>
      <v-card-text>
        <v-checkbox v-model="draggable" label="ドラッグ" density="compact" hide-details></v-checkbox>
        <v-checkbox v-model="resize" label="リサイズ" density="compact" hide-details></v-checkbox>
        <v-checkbox v-model="overlay" label="オーバーレイ" density="compact" hide-details></v-checkbox>
        <v-checkbox v-model="fullscreen" label="フルスクリーン" density="compact" hide-details></v-checkbox>
      </v-card-text>
      <v-card-actions>
        <button class="action-button" @click="isModalOpen = true">
          モーダルを開く
        </button>
      </v-card-actions>
    </v-card>

    <aw-dialog 
      v-model="isModalOpen"
      :initial-width="600"
      :initial-height="450"
      :min-width="400"
      :min-height="300"
      :draggable="draggable"
      :resize="resize"
      :overlay="overlay"
      :fullscreen="fullscreen"
    >
      <template #title>
        <!-- 📄 ドキュメント編集 -->
      </template>

      <v-card class="h-100 w-100">
        <v-card-text>
          <p>
            このモーダルは移動に加えて、右下のハンドルをドラッグしてサイズを変更できます。
          </p>
          <v-textarea placeholder="内容を入力..." class="h-100"></v-textarea>
        </v-card-text>
      </v-card>

      <template #footer>
        <v-list-item>
          <template #append>
            <v-btn>push</v-btn>
          </template>
        </v-list-item>
      </template>
      
    </aw-dialog>
  </div>
</template>

<script setup lang="ts">
const isModalOpen = ref(false);

const draggable = ref<boolean>(false);

const resize = ref<boolean>(false);

const overlay = ref<boolean>(false);

const fullscreen = ref<boolean>(false);
</script>

<style>
/* ページ全体のスタイル（デモ用） */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  background-color: #f4f5f7;
}

.page-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-button {
  display: inline-block;
  font-weight: 500;
  color: white;
  background-color: #007bff;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s ease-in-out;
}
.action-button:hover {
  background-color: #0056b3;
}
</style>