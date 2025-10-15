<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">{{ isEditMode ? 'チーム編集' : '新規チーム登録' }}</p>
      </div>
      
      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-archive-outline icon"></i>
              基本情報
            </h3>
            
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.name }">
                <label class="form-label" for="itemName">
                  <i class="mdi mdi-label icon"></i>
                  名称
                  <span class="required">*</span>
                </label>
                <input 
                  id="itemName"
                  v-model="formData.name"
                  type="text" 
                  class="form-input" 
                  placeholder="例：TASCALプロジェクト"
                  @blur="validateField('name')"
                  @input="clearError('name')"
                >
                <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
              </div>
              
              <div class="form-group" :class="{ error: errors.code }">
                <label class="form-label" for="itemCode">
                  <i class="mdi mdi-barcode-scan icon"></i>
                  管理コード
                  <span class="required">*</span>
                </label>
                <input 
                  id="itemCode"
                  v-model="formData.code"
                  type="text" 
                  class="form-input" 
                  placeholder="例：PJ-002"
                  :disabled="isEditMode"
                  @blur="validateField('code')"
                  @input="clearError('code')"
                >
                <div v-if="errors.code" class="form-error">{{ errors.code }}</div>
              </div>
            </div>
            
            <div class="form-group row">
                <div class="form-group" :class="{ error: errors.category }">
                <label class="form-label" for="itemCategory">
                  <i class="mdi mdi-tag-multiple-outline icon"></i>
                  カテゴリ
                  <span class="required">*</span>
                </label>
                <select 
                  id="itemCategory"
                  v-model="formData.category"
                  class="form-select"
                  @blur="validateField('category')"
                  @change="clearError('category')"
                >
                  <option value="">カテゴリを選択</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
                <div v-if="errors.category" class="form-error">{{ errors.category }}</div>
              </div>

            </div>
            
            <div class="form-group">
              <label class="form-label" for="itemDescription">
                <i class="mdi mdi-card-text icon"></i>
                説明・備考
              </label>
              <textarea 
                id="itemDescription"
                v-model="formData.description"
                class="form-textarea" 
                placeholder="チームの詳細な説明や注意事項などを入力..."
                rows="4"
              ></textarea>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-account-group icon"></i>
              メンバー
            </label>
            <div class="master-select-section">
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
                チームに参加するメンバーを選択してください（複数選択可）
              </p>
              <div class="master-select-wrapper">
                <div class="selected-items">
                  <div v-for="member in selectedMembersData" :key="member.id" class="selected-tag">
                    <span>{{ member.name }}</span>
                    <button type="button" @click="removeMember(member.id)" class="tag-remove">×</button>
                  </div>
                  <button type="button" @click="openMemberModal" class="btn-select-master">
                    <i class="mdi mdi-plus icon"></i>
                    メンバーを追加
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-camera icon"></i>
              チーム画像
            </h3>
            
            <div class="avatar-upload-section">
              <div class="current-avatar">
                <div v-if="previewImage || formData.imageUrl" class="avatar-preview">
                  <img :src="previewImage || formData.imageUrl" :alt="formData.name" class="avatar-image">
                </div>
                <div v-else class="avatar-placeholder">
                  <i class="mdi mdi-camera icon"></i>
                </div>
              </div>
              
              <div class="avatar-controls">
                <input 
                  ref="fileInput"
                  type="file" 
                  accept="image/*" 
                  class="file-input"
                  @change="handleFileUpload"
                >
              
                <p class="upload-note mb-3">
                  JPEGまたはPNG形式の画像をアップロードしてください（最大2MB）
                </p>
                <button 
                  type="button" 
                  @click="triggerFileInput" 
                  class="btn btn-secondary"
                >
                  <i class="mdi mdi-upload icon"></i>
                  画像をアップロード
                </button>
                <button 
                  v-if="formData.imageUrl || previewImage"
                  type="button" 
                  @click="removeImage" 
                  class="btn btn-outline"
                >
                  <i class="mdi mdi-delete icon"></i>
                  削除
                </button>
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
              {{ isLoading ? '保存中...' : (isEditMode ? 'チームを更新' : 'チームを作成') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <aw-dialog v-model="showModal" :draggable="true" :resize="true" :overlay="false" :fullscreen="false">
      <template #title>
        <h3 class="modal-title">
          <i class="mdi mdi-account-group icon"></i>
          メンバーを選択
        </h3>
      </template>
      <div class="modal-container">
        <div class="modal-body">
          <div class="search-box">
            <i class="mdi mdi-magnify icon"></i>
            <input v-model="searchQuery" type="text" class="search-input" placeholder="名前や部署で検索...">
          </div>
          <div class="selection-list">
            <div v-if="filteredItems.length === 0" class="no-results">
              検索結果がありません
            </div>
            <label v-for="item in filteredItems" :key="item.id" class="selection-item">
              <input type="checkbox" :value="item.id" :checked="isItemSelected(item.id)" @change="toggleItem(item.id)" class="selection-checkbox">
              <div class="selection-info">
                <div class="selection-name">{{ item.name }}</div>
                <div v-if="item.department" class="selection-meta">{{ item.department }}</div>
              </div>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            キャンセル
          </button>
          <button type="button" @click="confirmSelection" class="btn btn-primary">
            選択を確定
          </button>
        </div>
      </div>
    </aw-dialog>
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i :class="notification.type === 'success' ? 'mdi mdi-check' : 'mdi mdi-alert'" class="icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useTeam } from '~/composables/useTeam'
import { useMaster } from '~/composables/master/useMaster'

// Nuxt3を想定
const { back, push } = useRouter()
const route = useRoute()

const { getAsync, addAsync, updateAsync } = useTeam()
const { getListAsync: getUsersAsync } = useMaster('users')

// MasterItemの型定義
interface MasterItem {
  id: string
  name: string
  department?: string
  avatar?: string
}

// SEOメタタグ設定
useHead({
  title: 'TASCAL - チーム編集',
  meta: [
    { name: 'description', content: 'TASCALシステムでチームを登録・編集できます' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

const getCategories = async () => {
  console.log('Fetching categories...');
  return new Promise<string[]>(resolve => setTimeout(() => resolve(['プロジェクト', '委員会']), 200));
}

// リアクティブデータ
const isEditMode = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)

const formData = reactive<TeamFormData>({
  name: '',
  code: '',
  description: '',
  category: '',
  imageUrl: '',
  status: 'available',
  memberIds: [], // [変更] メンバーIDの配列
  members: []
})

const errors = reactive<TeamFormErrors>({})
const isLoading = ref(false)
const previewImage = ref('')
const fileInput = ref<HTMLInputElement>()
const categories = ref<string[]>([])

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})


// ▼▼▼ [変更] メンバー選択関連のリアクティブデータ ▼▼▼
const showModal = ref(false)
const searchQuery = ref('')
const tempSelection = ref<string[]>([])
const membersMaster = ref<MasterItem[]>([])

const selectedMembersData = computed(() => 
  membersMaster.value.filter(p => formData.memberIds.includes(p.id))
)

const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return membersMaster.value
  return membersMaster.value.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.department?.toLowerCase().includes(query)
  )
})
// ▲▲▲ [変更] メンバー選択関連のリアクティブデータ ▲▲▲


// チームデータの読み込み（編集時）
const loadTeam = async () => {
  if (!isEditMode.value) return
  
  try {
    isLoading.value = true;
    const item = await getAsync(itemId.value)
    
    if (item) {
      formData.name = item.name
      formData.code = item.code
      formData.description = item.description
      formData.category = item.category
      formData.imageUrl = item.imageUrl || ''
      formData.memberIds = item.members || [] // [変更] チームの `members` キーからIDを読み込む
    }
  } catch (error) {
    console.error('チームデータの読み込みに失敗しました:', error)
    showNotification('チームデータの読み込みに失敗しました', 'error')
  } finally {
    isLoading.value = false;
  }
}

// カテゴリデータの読み込み
const loadCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error('カテゴリの読み込みに失敗しました:', error)
    categories.value = ['PC', 'モニター', 'その他']; // フォールバック
  }
}

// ▼▼▼ [変更] メンバー選択関連のロジック ▼▼▼
const openMemberModal = () => {
  tempSelection.value = [...formData.memberIds]
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  searchQuery.value = ''
  tempSelection.value = []
}

const confirmSelection = () => {
  formData.memberIds = [...tempSelection.value]
  closeModal()
}

const isItemSelected = (id: string) => tempSelection.value.includes(id)

const toggleItem = (id: string) => {
  const index = tempSelection.value.indexOf(id)
  if (index > -1) {
    tempSelection.value.splice(index, 1)
  } else {
    tempSelection.value.push(id)
  }
}

const removeMember = (id: string) => {
  const index = formData.memberIds.indexOf(id)
  if (index > -1) {
    formData.memberIds.splice(index, 1)
  }
}
// ▲▲▲ [変更] メンバー選択関連のロジック ▲▲▲


// バリデーション
const validateField = (fieldName: keyof TeamFormErrors) => {
  // ... (省略)
}

const validateForm = (): boolean => {
  // ... (省略)
  return true
}

const clearError = (fieldName: keyof TeamFormErrors) => {
  if (errors[fieldName]) delete errors[fieldName]
}

// ファイルアップロード
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  // ... (省略)
}

const removeImage = () => {
  formData.imageUrl = ''
  previewImage.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// フォーム送信
const handleSubmit = async () => {
  if (!validateForm()) {
    showNotification('入力内容を確認してください', 'error')
    return
  }
  
  isLoading.value = true

  // [変更] 保存するデータオブジェクトを整形し、`memberIds` を `members` キーに置き換える
  const { memberIds, ...restOfData } = formData;
  const dataToSave = {
    ...restOfData,
    members: memberIds, // APIの仕様に合わせてキーを `members` にする
    imageUrl: previewImage.value || formData.imageUrl
  };

  try {
    if (isEditMode.value) {
      await updateAsync(itemId.value, dataToSave)
      showNotification('チーム情報を更新しました！', 'success')
    } else {
      await addAsync(dataToSave)
      showNotification('チームを作成しました！', 'success')
    }
    
    setTimeout(() => push('/team'), 1500)
    
  } catch (error) {
    console.error('保存エラー:', error)
    showNotification('保存に失敗しました', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (confirm('入力内容が失われますが、よろしいですか？')) {
    back()
  }
}

// 通知表示
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.message = message
  notification.type = type
  notification.show = true
  setTimeout(() => { notification.show = false }, 3000)
}

// ライフサイクル
onMounted(async () => {
  // ユーザーデータとカテゴリデータを並行して取得
  await Promise.all([
    loadCategories(),
    getUsersAsync().then(users => {
      membersMaster.value = (users as ExtendedUserProfile[]).filter(user => user.status === 'active').map(user => ({
        id: user.uid,
        name: user.displayName || '未設定',
        department: user.department || '',
        avatar: user.avatar,
      }))
    })
  ])

  if (isEditMode.value) {
    await loadTeam()
  }
})
</script>

<style scoped>
/* スタイルは変更なしのため省略 */
.page-container {
  background-color: var(--background-light);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  width: 100%;
  padding: 24px;
}
.container {
  width: 100%;
  margin: 0 auto;
  background-color: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.header {
  background: linear-gradient(135deg, var(--brand-color-1), var(--brand-color-2), var(--brand-color-3));
  color: white;
  padding: 32px 40px;
  text-align: center;
  position: relative;
}
.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.1;
}
.app-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.page-subtitle {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}
.form-content {
  padding: 40px;
}
.form-grid {
  display: grid;
  gap: 32px;
}
.form-section {
  background-color: #fcfdff;
  border-radius: var(--radius-md);
  padding: 24px;
  border: 1px solid var(--border-color);
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.form-group {
  margin-bottom: 15px;
}

.form-group.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.form-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.form-label .required {
  color: var(--danger-color);
  font-size: 12px;
  font-weight: normal;
}
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background-color: var(--background-white);
  transition: var(--transition);
}
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}
.form-input:disabled {
    background-color: var(--background-light);
    cursor: not-allowed;
}
.form-textarea {
  resize: vertical;
}
.form-error {
  color: var(--danger-color);
  font-size: 13px;
  margin-top: 4px;
}
.form-group.error .form-input,
.form-group.error .form-textarea,
.form-group.error .form-select {
  border-color: var(--danger-color);
}
.form-group.error .form-input:focus,
.form-group.error .form-textarea:focus,
.form-group.error .form-select:focus {
    box-shadow: 0 0 0 3px #fde2e2;
}
.avatar-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}
.current-avatar {
  flex-shrink: 0;
}
.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--border-color);
  background-color: var(--background-light);
}
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  background-color: var(--background-light);
  border: 2px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.avatar-placeholder .icon {
    font-size: 48px;
}
.avatar-controls {
  flex: 1;
}
.file-input {
  display: none;
}
.avatar-controls .btn {
  margin-right: 12px;
  margin-bottom: 12px;
}
.upload-note {
  font-size: 13px;
  color: var(--text-secondary);
}
.btn {
  padding: 12px 20px;
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
  text-decoration: none;
}
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  background-color: var(--text-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-secondary {
  background-color: var(--background-light);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}
.btn-secondary:hover {
  background-color: var(--border-color);
}
.btn-outline {
  background-color: transparent;
  color: var(--danger-color);
  border: 2px solid #fde2e2;
}
.btn-outline:hover {
  background-color: #fde2e2;
  color: var(--danger-color);
}
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
.notification {
  position: fixed;
  top: 80px;
  right: 24px;
  background-color: #22c55e;
  color: white;
  padding: 16px 24px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}
.notification.error {
  background-color: #dc2626;
}
.icon {
  font-size: 16px;
  line-height: 1;
}
.loading-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}
.notification-enter-from,
.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
@media (max-width: 768px) {
  .page-container { padding: 0; }
  .container { border-radius: 0; }
  .header { padding: 24px 20px; }
  .form-content { padding: 24px 16px; }
  .form-section { padding: 20px 16px; }
  .form-group.row { grid-template-columns: 1fr; gap: 0; }
  .avatar-upload-section { flex-direction: column; align-items: center; text-align: center; }
  .form-actions { flex-direction: column-reverse; gap: 12px; }
  .btn { width: 100%; }
}
.master-select-section {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  transition: var(--transition);
}

.master-select-section:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.master-select-wrapper {
  margin-top: 12px;
}
.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.tag-remove {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.tag-remove:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-select-master {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-select-master:hover {
  background-color: var(--primary-color);
  color: white;
}

/* ▼▼▼ [追加] モーダルコンテナのスタイル ▼▼▼ */
.modal-container {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

/* ▼▼▼ モーダル関連のスタイル ▼▼▼ */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}
.modal-close:hover {
  background-color: var(--background-light);
}
.modal-body {
  padding: 24px;
  height: 380px;
  flex: 1;
}
.search-box {
  position: relative;
  margin-bottom: 20px;
}
.search-box .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}
.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: var(--transition);
}
.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}
.selection-list {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}
.no-results {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}
.selection-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}
.selection-item:hover {
  background-color: var(--background-light);
  border-color: var(--primary-color);
}
.selection-checkbox {
  margin-top: 4px;
}
.selection-info {
  flex: 1;
}
.selection-name {
  font-weight: 500;
  color: var(--text-primary);
}
.selection-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  height: 100px;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}
/* ▲▲▲ モーダル関連のスタイル ▲▲▲ */
</style>