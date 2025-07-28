<template>
  <div>
    <div class="container">
      <div class="header">
        <p class="page-subtitle">{{ subtitle }}</p>
      </div>

      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group">
            <label class="form-label" for="optionDate">
              <i class="mdi mdi-calendar icon"></i>
              日付
              <span class="required">*</span>
            </label>
            <input
              id="optionDate"
              v-model="formData.date"
              type="date"
              class="form-input"
              :disabled="isEditing"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-briefcase-variant-outline icon"></i>
              勤務形態
              <span class="required">*</span>
            </label>
            <div class="option-group">
              <div v-for="(style, key) in workstyleDetails" :key="key" class="option-item">
                <input
                  :id="`workstyle-${key}`"
                  v-model="formData.workStyle"
                  type="radio"
                  name="workStyle"
                  :value="key"
                  class="option-radio"
                >
                <label
                  :for="`workstyle-${key}`"
                  class="option-label"
                  :style="{ '--option-color': style.color }"
                >
                  <v-icon :icon="style.icon" size="small"></v-icon>
                  {{ style.name }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-food-fork-drink icon"></i>
              ランチ会
              <span class="required">*</span>
            </label>
            <div class="option-group two-columns">
              <div v-for="(status, key) in participationLunchStatusDetails" :key="key" class="option-item">
                <input
                  :id="`lunch-${key}`"
                  v-model="formData.lunchParticipation"
                  type="radio"
                  name="lunchParticipation"
                  :value="key"
                  class="option-radio"
                >
                <label
                  :for="`lunch-${key}`"
                  class="option-label"
                  :style="{ '--option-color': status.color }"
                >
                  <v-icon :icon="status.icon" size="small"></v-icon>
                  {{ status.name }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-silverware-fork-knife icon"></i>
              夕食会
              <span class="required">*</span>
            </label>
            <div class="option-group two-columns">
              <div v-for="(status, key) in participationDinnerStatusDetails" :key="key" class="option-item">
                <input
                  :id="`dinner-${key}`"
                  v-model="formData.dinnerParticipation"
                  type="radio"
                  name="dinnerParticipation"
                  :value="key"
                  class="option-radio"
                >
                <label
                  :for="`dinner-${key}`"
                  class="option-label"
                  :style="{ '--option-color': status.color }"
                >
                  <v-icon :icon="status.icon" size="small"></v-icon>
                  {{ status.name }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn btn-secondary">
              <i class="mdi mdi-close icon"></i>
              キャンセル
            </button>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              <i v-if="isLoading" class="mdi mdi-loading icon loading-spin"></i>
              <i v-else class="mdi mdi-content-save icon"></i>
              <span>{{ isEditing ? (isLoading ? '更新中...' : '更新') : (isLoading ? '保存中...' : '保存') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css">
  </div>
</template>

<script setup lang="ts">
import type { User } from 'firebase/auth';
import { padStart } from 'vuetify/lib/util/helpers.mjs';
import { useConstants } from '~/composables/common/useConstants';

const currentUser = useState<User>('user')

const {
  workstyleDetails,
  participationLunchStatusDetails,
  participationDinnerStatusDetails,
} = useConstants();

// --- PropsとEmits ---
interface Props {
  user?: ExtendedUserProfile;
  date?: string;
  initialData?: DailyUserOption;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'submit', data: DailyUserOption): void;
  (e: 'cancel'): void;
}>();

// --- リアクティブな状態管理 ---
const formData = reactive<DailyUserOption>({
  uid: '',
  date: '',
  workStyle: 'office',
  lunchParticipation: 'impossible',
  dinnerParticipation: 'impossible',
});

const isLoading = ref(false);
const isEditing = computed(() => !!props.initialData);

const subtitle = computed(() => {
    if (props.user) {
        return `${props.user.displayName}さんの${ isEditing ? '日別オプションを更新' : '日別オプションを登録' }`;
    } else {
        return isEditing ? '日別オプションを更新' : '日別オプションを登録';
    }
});

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- ロジック ---
watchEffect(() => {
  if (props.initialData) {
    // 編集モード：初期データでフォームを更新
    Object.assign(formData, props.initialData);
  } else {
    // 新規登録モード：デフォルト値で初期化
    formData.uid = props.user?.uid ?? currentUser.value.uid;
    formData.date = props.date || getDateString(new Date());
    formData.workStyle = 'office';
    formData.lunchParticipation = 'impossible';
    formData.dinnerParticipation = 'impossible';
  }
});

const handleSubmit = () => {
  isLoading.value = true;
  // ここでバリデーションを実行することも可能
  
  // データを親コンポーネントに渡す
  emit('submit', { ...formData });

  // 実際のAPI通信を模倣
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.container {
  /* max-width: 600px; */
  margin: 0 auto;
  background-color: var(--background-white);
  /* border-radius: var(--radius-lg); */
  /* box-shadow: var(--shadow-md); */
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  color: white;
  padding: 24px 32px;
  text-align: center;
}

.page-subtitle {
  font-size: 18px;
  font-weight: 500;
}

.form-content {
  padding: 32px;
}

.form-grid {
  display: grid;
  gap: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label .required {
  color: var(--danger-color);
  font-size: 12px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background-color: var(--background-white);
  transition: var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent);
}

.form-input:disabled {
  background-color: var(--background-light);
  color: var(--text-light);
  cursor: not-allowed;
}

/* カスタムラジオボタンのスタイル */
.option-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.option-group.two-columns {
  grid-template-columns: 1fr 1fr;
}

.option-item {
  position: relative;
}

.option-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  background-color: var(--background-white);
}

.option-label .icon {
  font-size: 18px;
  transition: transform 0.2s ease-out;
}

.option-label:hover {
  border-color: var(--option-color, var(--primary-color));
  background-color: color-mix(in srgb, var(--option-color, var(--primary-color)) 8%, white);
  transform: translateY(-2px);
}

.option-radio:checked + .option-label {
  border-color: var(--option-color, var(--primary-color));
  background-color: var(--option-color, var(--primary-color));
  color: white;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--option-color, var(--primary-color)) 30%, transparent);
}

.option-radio:checked + .option-label .icon {
  transform: scale(1.1);
}

/* アクションボタン */
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.icon.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .page-container {
    padding: 0;
  }
  .container {
    border-radius: 0;
  }
  .form-content {
    padding: 24px 20px;
  }
  .option-group {
    grid-template-columns: 1fr 1fr;
  }
  .form-actions {
    flex-direction: column-reverse;
  }
  .btn {
    width: 100%;
  }
}
</style>