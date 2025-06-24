<template>
  <div class="user-filter">
    <label 
      v-for="user in users" 
      :key="user.uid"
      class="filter-label"
    >
      <input 
        type="checkbox" 
        class="filter-checkbox" 
        :checked="user.visible"
        @change="toggleUser(user.uid)"
      />
      {{ user.displayName }}
    </label>
  </div>
</template>

<script setup>
const props = defineProps({
  users: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['toggleUser']);

const toggleUser = (userId) => {
  emit('toggleUser', userId);
};
</script>

<style scoped>
.user-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-left: 24px;
}

.filter-label {
  font-size: 14px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--background-light);
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.filter-label:hover {
  background-color: var(--border-color);
}

.filter-checkbox {
  margin-right: 8px;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

@media (max-width: 768px) {
  .user-filter {
    margin-left: 0;
    margin-top: 12px;
  }
}
</style>