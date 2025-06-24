<template>
  <div class="weekday-header">
    <div class="weekday sunday">日</div>
    <div class="weekday">月</div>
    <div class="weekday">火</div>
    <div class="weekday">水</div>
    <div class="weekday">木</div>
    <div class="weekday">金</div>
    <div class="weekday saturday">土</div>
  </div>
</template>

<script setup>
// 曜日ヘッダーは固定なのでスクリプトは特に必要ありません
</script>

<style scoped>
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  text-align: center;
  margin-bottom: 10px;
  font-weight: 600;
  padding: 10px 0;
  border-radius: 8px;
  background-color: var(--background-light);
}

.weekday {
  padding: 6px 0;
  font-size: 14px;
}

.sunday {
  color: var(--accent-color);
}

.saturday {
  color: var(--primary-color);
}
</style>