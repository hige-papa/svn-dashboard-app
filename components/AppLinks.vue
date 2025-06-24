// components/dashboard/AppLinks.vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">業務アプリケーション</div>
      <div class="card-action">カスタマイズ</div>
    </div>
    <div class="app-links">
      <NuxtLink 
        v-for="app in apps" 
        :key="app.id" 
        :to="app.url" 
        class="app-link"
      >
        <v-icon :icon="app.icon" color="primary"></v-icon>
        <div class="app-link-name">{{ app.name }}</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  apps: {
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
  margin-bottom: 1.5rem;
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

.app-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.app-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: var(--radius);
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: var(--dark-color);
  text-align: center;
}

.app-link:hover {
  background-color: #f0f4ff;
  transform: translateY(-2px);
}

.app-link i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.app-link-name {
  font-size: 0.85rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .app-links {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>