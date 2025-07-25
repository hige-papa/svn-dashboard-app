<template>
  <div class="header">
     <v-list-item class="ma-0 pa-0">
      <template v-slot:prepend>
        <button class="register-btn" @click="navigateTo('/calendar/register')">
          <i class="mdi mdi-pencil icon mr-2"></i>
          予定登録
        </button>
      </template>
      <template v-slot:append>
        <button class="today-btn" @click="goToToday">
          <i class="mdi mdi-calendar icon mr-2"></i>
          今日
        </button>
      </template>
     </v-list-item>
  </div>
</template>

<script setup>
const emit = defineEmits(['goToToday']);

const goToToday = () => {
  emit('goToToday');
}
</script>

<style scoped>
.header {
  /* display: flex; */
  /* justify-content: space-between; */
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.register-btn {
  display: flex;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.register-btn:hover {
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.today-btn {
  display: flex;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.today-btn:hover {
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.calendar-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .register-btn {
    font-size: 12px;
  }

  .today-btn {
    font-size: 12px;
  }
}
</style>