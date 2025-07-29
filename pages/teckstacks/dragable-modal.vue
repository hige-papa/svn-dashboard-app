// app.vue
<template>
  <div class="page-container">
    <h1>Draggable Modal Demo</h1>
    <p>下のボタンをクリックして、移動可能なモーダルを表示します。</p>
    <button class="action-button" @click="isModalOpen = true">
      モーダルを開く
    </button>

    <DraggableModal v-model="isModalOpen">
      <template #header>
        📝 タスクの編集
      </template>

      <div class="form-group">
        <label for="task-name">タスク名</label>
        <input id="task-name" type="text" placeholder="例: 新機能の実装" />
      </div>
      <p>
        このモーダルはヘッダーをドラッグして移動できます。<br>
        また、<code>Escape</code>キーを押すか、モーダルの外側をクリックしても閉じることができます。
      </p>
      <div style="text-align: right; margin-top: 1rem;">
        <button class="action-button" @click="isModalOpen = false">保存</button>
      </div>
    </DraggableModal>
  </div>
</template>

<script setup lang="ts">
const isModalOpen = ref<boolean>(false);
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

/* モーダル内のフォームスタイル */
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-group input {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.form-group input:focus {
  color: #495057;
  background-color: #fff;
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>