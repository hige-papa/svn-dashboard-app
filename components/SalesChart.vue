// components/dashboard/SalesChart.vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">今月の売上予測 vs 実績</div>
      <div class="card-action">詳細を見る</div>
    </div>
    <div class="chart-container">
      <canvas ref="salesChartRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';

// データのインポート
import salesDashboardData from '~/assets/data/sales.json';

const salesChartRef = ref(null);
let salesChart = null;

onMounted(() => {
  if (salesChartRef.value) {
    const ctx = salesChartRef.value.getContext('2d');
    salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: salesDashboardData.labels,
        datasets: salesDashboardData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '万円'
            }
          }
        }
      }
    });
  }
});

onBeforeUnmount(() => {
  if (salesChart) {
    salesChart.destroy();
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

.chart-container {
  height: 250px;
  position: relative;
}
</style>