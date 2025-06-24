// components/dashboard/NotificationList.vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">お知らせ</div>
      <div class="card-action">すべて見る</div>
    </div>
    <ul class="notification-list">
      <li v-for="(notification, index) in notifications" :key="notification.id" class="notification-item">
        <div :class="['notification-icon', notification.type]">
          <v-icon :icon="notification.icon" color="grey-darken-2"></v-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ notification.time }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  notifications: {
    type: Array,
    required: true,
    default: () => []
  }
});
</script>

<style scoped>
.card {
  background-color: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.25rem;
  height: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--dark-color);
}

.card-action {
  color: var(--primary-color);
  font-size: 0.9rem;
  cursor: pointer;
}

.notification-list {
  list-style: none;
}

.notification-item {
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item .notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.notification-item .notification-icon.info {
  background-color: #e3f2fd;
  color: var(--info-color);
}

.notification-item .notification-icon.warning {
  background-color: #fff8e1;
  color: var(--warning-color);
}

.notification-content {
  flex-grow: 1;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.9rem;
  color: #666;
}

.notification-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}
</style>