<template>
  <div class="user-column">
    <div class="user-header">メンバー</div>
    <div class="user-list">
      <div 
        v-for="user in visibleUsers" 
        :key="user.uid"
        class="user-row"
      >
        <div :class="['user-icon', user.color]">{{ user.initial }}</div>
        <div class="user-name">{{ user.displayName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  users: {
    type: Array,
    required: true
  }
});

// 表示するユーザー（visible=trueのもののみ）
const visibleUsers = computed(() => {
  return props.users.filter(user => user.visible);
});
</script>

<style scoped>
.user-column {
  width: 140px;
  min-width: 140px;
  border-right: 1px solid var(--border-color);
}

.user-header {
  height: 60px;
  background-color: var(--background-light);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding: 0 8px;
  color: var(--text-secondary);
}

.user-row {
  height: 80px;
  border-bottom: 1px solid var(--border-color);
  padding: 12px;
  display: flex;
  align-items: center;
}

.user-row:last-child {
  border-bottom: none;
}

.user-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-color-1 { background-color: var(--event-1-bg); color: var(--event-1); }
.user-color-2 { background-color: var(--event-2-bg); color: var(--event-2); }
.user-color-3 { background-color: var(--event-3-bg); color: var(--event-3); }
.user-color-4 { background-color: var(--event-4-bg); color: var(--event-4); }
.user-color-5 { background-color: var(--event-5-bg); color: var(--event-5); }

.user-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}
</style>