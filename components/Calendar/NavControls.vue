<template>
  <div class="nav-controls">
    <button class="nav-btn" @click="onPrevious">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      {{ previousLabel }}
    </button>
    <span class="current-date" @click="dialog=true" style="cursor: pointer;">{{ displayLabel }}</span>
    <button class="nav-btn" @click="onNext">
      {{ nextLabel }}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>

    <aw-dialog v-model="dialog" :draggable="mobile ? false : true" :resize="mobile ? false : true" :overlay="mobile ? true : false" :initial-height="230" :initial-width="mobile ? 300 : undefined">
      <template #title>
        <span class="list-title text-body-1">日付選択</span>
      </template>
      <v-card flat tile color="transparent">
        <v-card-text>
          <v-text-field v-model="date" type="date" variant="outlined" hide-details @keydown.enter="handleSelect"></v-text-field>
        </v-card-text>
        <!-- <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="handleSelect">確定</v-btn>
        </v-card-actions> -->
      </v-card>
      <template #footer>
        <div class="modal-footer">
          <button type="button" @click="handleSelect" class="modal-footer-btn btn-primary">
            確定
          </button>
        </div>
      </template>
    </aw-dialog>
  </div>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { padStart } from 'vuetify/lib/util/helpers.mjs';

const { mobile } = useDisplay();

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

const emit = defineEmits(['previous', 'next', 'changeDate']);

const dialog = ref<boolean>(false);

const now = () => {
  const date = new Date()
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const date = ref<string>(now())

const handleSelect = () => {
  if (date.value) {
    // alert(date.value);
    emit('changeDate', new Date(`${date.value}T00:00:00`));
    dialog.value = false;
  }
}

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

.list-title {
  font-size: 18px; font-weight: 600; color: #212529; /* --text-primary */
  margin-left: 20px; display: flex; align-items: center;
}
.list-title::before {
  content: ""; display: inline-block; width: 4px; height: 20px;
  background-color: #4361ee; /* --primary-color */ margin-right: 10px; border-radius: 2px;
}

.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end; height: 65px; padding: 12px;
  border-top: 1px solid #dee2e6; /* --border-color */
}

.modal-footer-btn {
  padding: 14px 28px; border-radius: 6px; /* --radius-sm */ font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease-in-out; /* --transition */ border: none; display: flex; align-items: center; gap: 8px;
}

.btn-primary { background-color: #4361ee; /* --primary-color */ color: white; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* --shadow-sm */ }
.btn-primary:hover {
  background-color: #3a53c4; /* --primary-hover */ box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); /* --shadow-md */
  transform: translateY(-1px);
}
.btn-primary:disabled { background-color: #adb5bd; /* --text-light */ cursor: not-allowed; transform: none; }

@media (max-width: 768px) {
  .nav-controls {
    width: 100%;
    justify-content: space-between;
    font-size: 12px;
  }

  .current-date {
    font-size: 12px;
  }
}
</style>