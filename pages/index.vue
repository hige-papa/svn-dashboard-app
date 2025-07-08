// pages/index.vue
<template>
  <v-container>
    <h1 class="page-title">ダッシュボード</h1>

    <div class="dashboard-row">
      <v-card>
        <SalesChart />
      </v-card>
      <v-card>
        <NotificationList :notifications="notifications" />
      </v-card>
    </div>

    <v-card>
        <AppLinks :apps="apps" />
    </v-card>
</v-container>
</template>

<script setup lang="ts">
import SalesChart from '~/components/SalesChart.vue';
import NotificationList from '~/components/NotificationList.vue';
import AppLinks from '~/components/AppLinks.vue';

// データのインポート
import notificationsData from '~/assets/data/notifications.json';
import appsData from '~/assets/data/apps.json';

const notifications = ref<any[]>([]);
const apps = ref<any[]>([]);

onMounted(() => {
  notifications.value = notificationsData;
  apps.value = appsData;
});

// head設定
useHead({
  title: 'TASCAL - ダッシュボード'
});
</script>

<style scoped>
.dashboard-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.page-title {
  margin-bottom: 1.5rem;
  font-weight: 600;
  font-size: 1.75rem;
  color: var(--dark-color);
}

@media (max-width: 992px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}
</style>