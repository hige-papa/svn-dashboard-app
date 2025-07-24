<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <h1 class="app-title">TASCAL</h1>
        <p class="page-subtitle">施設詳細</p>
      </div>
      
      <div class="content">
        <div v-if="item" class="profile-content">
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-archive-outline icon"></i>
              基本情報
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-label icon"></i>
                  名称
                </label>
                <div class="info-value">{{ item.name || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-barcode-scan icon"></i>
                  管理コード
                </label>
                <div class="info-value">{{ item.code || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-tag-multiple-outline icon"></i>
                  カテゴリ
                </label>
                <div class="info-value">{{ item.category || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-package-variant-closed icon"></i>
                  総数
                </label>
                <div class="info-value">{{ item.capacity }}</div>
              </div>
            </div>
            
            <div v-if="item.description" class="info-item full-width mt-4">
              <label class="info-label">
                <i class="mdi mdi-card-text icon"></i>
                説明・備考
              </label>
              <div class="info-value bio-text">{{ item.description }}</div>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-list-status icon"></i>
              ステータス
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-traffic-light icon"></i>
                  現在の状態
                </label>
                <div class="info-value">
                  <div class="status-badge" :class="statusClass">
                    <i :class="statusIcon" class="icon"></i>
                    {{ statusLabel }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-camera icon"></i>
              施設画像
            </h3>
            
            <div class="avatar-display-section">
              <div class="avatar-container">
                <div v-if="item.imageUrl" class="avatar-preview">
                  <img :src="item.imageUrl" :alt="item.name" class="avatar-image">
                </div>
                <div v-else class="avatar-placeholder">
                  <i class="mdi mdi-camera-off icon"></i>
                </div>
              </div>
              <div class="avatar-info">
                <p class="avatar-text">
                  {{ item.imageUrl ? '施設画像が設定されています' : '施設画像が設定されていません' }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <button type="button" @click="handleBack" class="btn btn-secondary">
              <i class="mdi mdi-arrow-left icon"></i>
              一覧へ戻る
            </button>
            <button 
              type="button" 
              @click="handleEdit" 
              class="btn btn-primary"
            >
              <i class="mdi mdi-pencil icon"></i>
              編集
            </button>
            <button 
              type="button" 
              @click="handleDelete" 
              class="btn btn-danger"
            >
              <i class="mdi mdi-delete icon"></i>
              削除
            </button>
          </div>
        </div>
        
        <div v-else-if="isLoading" class="loading-container">
          <div class="loading-spinner">
            <i class="mdi mdi-loading icon loading-spin"></i>
            <p>施設情報を読み込み中...</p>
          </div>
        </div>
        
        <div v-else class="error-container">
          <div class="error-message">
            <i class="mdi mdi-alert-circle icon"></i>
            <h3>施設情報が見つかりません</h3>
            <p>指定された施設は存在しないか、アクセス権限がありません。</p>
            <button @click="handleBack" class="btn btn-primary">
              <i class="mdi mdi-arrow-left icon"></i>
              一覧に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="closeDeleteDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>施設削除の確認</h3>
          <button @click="closeDeleteDialog" class="dialog-close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="dialog-body">
          <p><strong>{{ item?.name }}</strong> を削除しようとしています。</p>
          <p>この操作は元に戻すことができません。本当に削除しますか？</p>
        </div>
        <div class="dialog-actions">
          <button @click="closeDeleteDialog" class="btn btn-secondary">
            キャンセル
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="isDeleting">
            <i v-if="isDeleting" class="mdi mdi-loading icon loading-spin"></i>
            <i v-else class="mdi mdi-delete icon"></i>
            {{ isDeleting ? '削除中...' : '削除' }}
          </button>
        </div>
      </div>
    </div>
    
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
import { useFacility } from '~/composables/useFacility'

// Nuxt3を想定
const { back, push } = useRouter()
const route = useRoute()

const { getAsync, deleteAsync } = useFacility()

// SEOメタタグ設定
useHead({
  title: 'TASCAL - 施設詳細',
  meta: [
    { name: 'description', content: 'TASCALシステムの施設詳細情報を表示します' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})


// リアクティブデータ
const itemId = computed(() => route.params.id as string)
const item = ref<Equipment | null>(null)
const isLoading = ref(true)
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// ステータスの表示用データ
const statusLabel = computed(() => {
  switch (item.value?.status) {
    case 'available': return '利用可能'
    case 'in_use': return '使用中'
    case 'maintenance': return 'メンテナンス中'
    default: return '未設定'
  }
})

const statusClass = computed(() => {
  switch (item.value?.status) {
    case 'available': return 'active'
    case 'in_use': return 'in-use'
    case 'maintenance': return 'inactive'
    default: return 'default'
  }
})

const statusIcon = computed(() => {
  switch (item.value?.status) {
    case 'available': return 'mdi mdi-check-circle'
    case 'in_use': return 'mdi mdi-account-clock'
    case 'maintenance': return 'mdi mdi-cogs'
    default: return 'mdi mdi-help-circle'
  }
})

// 施設データの読み込み
const loadItem = async () => {
  try {
    isLoading.value = true
    const fetchedItem = await getAsync(itemId.value)
    item.value = fetchedItem
  } catch (error) {
    console.error('施設データの読み込みに失敗しました:', error)
    item.value = null
    showNotification('施設データの読み込みに失敗しました', 'error')
  } finally {
    isLoading.value = false
  }
}

// ハンドラー関数
const handleBack = () => {
  // `/items` のような一覧ページへ戻る
  push('/facility')
}

const handleEdit = () => {
  push(`/facility/${itemId.value}/edit`)
}

const handleDelete = () => {
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
}

const confirmDelete = async () => {
  if (!item.value) return
  try {
    isDeleting.value = true
    await deleteAsync(item.value.id)
    showNotification('施設を削除しました')
    
    setTimeout(() => {
      push('/facility')
    }, 1500)
    
  } catch (error) {
    console.error('削除エラー:', error)
    showNotification('削除に失敗しました', 'error')
  } finally {
    isDeleting.value = false
    showDeleteDialog.value = false
  }
}

// 通知表示
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.message = message
  notification.type = type
  notification.show = true
  
  setTimeout(() => {
    notification.show = false
  }, 3000)
}

// ライフサイクル
onMounted(async () => {
  await loadItem()
})
</script>

<style scoped>
/* 提供されたCSSをほぼそのまま流用 */
/* いくつかの変数を追加 */
:root {
  --background-light: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-light: #adb5bd;
  --background-white: #ffffff;
  --radius-lg: 12px;
  --radius-md: 8px;
  --radius-sm: 6px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --primary-color: #4361ee;
  --primary-hover: #3a53c4;
  --primary-light: #eef2ff;
  --accent-color: #7209b7;
  --border-color: #dee2e6;
  --danger-color: #dc2626;
  --warning-color: #f59e0b;
  --success-color: #22c55e;
  --transition: all 0.2s ease-in-out;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.page-container {
  background-color: var(--background-light);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  padding: 24px;
}
.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.header {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
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
.content {
  padding: 40px;
}
.profile-section {
  background-color: #fcfdff;
  border-radius: var(--radius-md);
  padding: 24px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
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
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-item.full-width {
  grid-column: 1 / -1;
}
.info-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.info-value {
  padding: 12px 16px;
  background-color: var(--background-white);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  min-height: 44px; /* ボタンの高さに合わせる */
  display: flex;
  align-items: center;
}
.bio-text {
  white-space: pre-wrap;
  line-height: 1.5;
  align-items: flex-start;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
}
.status-badge.active {
  background-color: var(--success-color);
  color: white;
}
.status-badge.in-use {
  background-color: var(--warning-color);
  color: white;
}
.status-badge.inactive {
  background-color: var(--danger-color);
  color: white;
}
.status-badge.default {
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
.avatar-display-section {
  display: flex;
  align-items: center;
  gap: 24px;
}
.avatar-container {
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
.avatar-info {
  flex: 1;
}
.avatar-text {
  font-size: 14px;
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
.btn-secondary {
  background-color: var(--background-light);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}
.btn-secondary:hover {
  background-color: var(--border-color);
}
.btn-danger {
  background-color: var(--danger-color);
  color: white;
  box-shadow: var(--shadow-sm);
}
.btn-danger:hover:not(:disabled) {
  background-color: #b91c1c;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn:disabled {
  background-color: var(--text-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.loading-spinner,
.error-message {
  text-align: center;
  color: var(--text-secondary);
}
.loading-spinner .icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.error-message .icon {
  font-size: 64px;
  color: var(--danger-color);
  margin-bottom: 16px;
}
.error-message h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
}
.error-message .btn {
  margin-top: 16px;
}
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.dialog-content {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-close:hover {
  background-color: var(--background-light);
}
.dialog-body {
  padding: 24px;
  overflow-y: auto;
}
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background-color: var(--background-light);
  flex-shrink: 0;
}
.notification {
  position: fixed;
  top: 80px;
  right: 24px;
  background-color: var(--success-color);
  color: white;
  padding: 16px 24px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
}
.notification.error {
  background-color: var(--danger-color);
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
.mt-4 {
    margin-top: 1rem;
}
@media (max-width: 768px) {
  .page-container { padding: 0; }
  .container { border-radius: 0; }
  .header { padding: 24px 20px; }
  .content { padding: 24px 16px; }
  .profile-section { padding: 20px 16px; }
  .info-grid { grid-template-columns: 1fr; gap: 16px; }
  .avatar-display-section { flex-direction: column; align-items: center; text-align: center; }
  .action-buttons { flex-direction: column-reverse; gap: 12px; }
  .btn { justify-content: center; }
}
</style>