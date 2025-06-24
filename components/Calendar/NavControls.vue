<template>
  <div class="nav-controls">
    <button class="nav-btn" @click="onPrevious">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      {{ previousLabel }}
    </button>
    <span class="current-date">{{ displayLabel }}</span>
    <button class="nav-btn" @click="onNext">
      {{ nextLabel }}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  displayLabel: {
    type: String,
    required: true
  },
  previousLabel: {
    type: String,
    default: '前へ'
  },
  nextLabel: {
    type: String,
    default: '次へ'
  }
});

const emit = defineEmits(['previous', 'next']);

const onPrevious = () => {
  emit('previous');
};

const onNext = () => {
  emit('next');
};
</script>

<style scoped>
.nav-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  background-color: var(--background-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-primary);
  font-weight: 500;
}

.nav-btn:hover {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.current-date {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  background-color: var(--primary-light);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
  .nav-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>