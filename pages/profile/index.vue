<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <!-- <h1 class="app-title">TASCAL</h1> -->
        <p class="page-subtitle">ユーザー詳細</p>
      </div>
      
      <div class="content">
        <!-- ユーザー情報が読み込まれている場合 -->
        <div v-if="userProfile" class="profile-content">
          <!-- 基本情報セクション -->
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-account icon"></i>
              基本情報
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-account icon"></i>
                  氏名
                </label>
                <div class="info-value">{{ userProfile.displayName || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-email icon"></i>
                  メールアドレス
                </label>
                <div class="info-value">{{ userProfile.email || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-phone icon"></i>
                  電話番号
                </label>
                <div class="info-value">{{ userProfile.phone || '未設定' }}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-office-building icon"></i>
                  部署
                </label>
                <div class="info-value">{{ userProfile.department || '未設定' }}</div>
              </div>
            </div>
            
            <div v-if="userProfile.bio" class="info-item full-width">
              <label class="info-label">
                <i class="mdi mdi-card-text icon"></i>
                自己紹介・備考
              </label>
              <div class="info-value bio-text">{{ userProfile.bio }}</div>
            </div>
          </div>
          
          <!-- 権限・ステータスセクション -->
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-shield-account icon"></i>
              権限・ステータス
            </h3>
            
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-account-key icon"></i>
                  役割
                </label>
                <div class="info-value">
                  <div class="role-badge" :class="roleClass">
                    <i :class="roleIcon" class="icon"></i>
                    {{ roleLabel }}
                  </div>
                </div>
              </div>
              
              <div class="info-item">
                <label class="info-label">
                  <i class="mdi mdi-account-check icon"></i>
                  ステータス
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
          
          <!-- プロフィール画像セクション -->
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-camera icon"></i>
              プロフィール画像
            </h3>
            
            <div class="avatar-display-section">
              <div class="avatar-container">
                <div v-if="userProfile.avatar" class="avatar-preview">
                  <img :src="userProfile.avatar" :alt="userProfile.displayName" class="avatar-image">
                </div>
                <div v-else class="avatar-placeholder">
                  <i class="mdi mdi-account icon"></i>
                </div>
              </div>
              <div class="avatar-info">
                <p class="avatar-text">
                  {{ userProfile.avatar ? 'プロフィール画像が設定されています' : 'プロフィール画像が設定されていません' }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- 通知設定セクション -->
          <div class="profile-section">
            <h3 class="section-title">
              <i class="mdi mdi-bell icon"></i>
              通知設定
            </h3>
            
            <div class="notification-display">
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-name">
                    <i class="mdi mdi-email icon"></i>
                    メール通知
                  </div>
                  <div class="notification-description">予定の追加・変更時にメールで通知</div>
                </div>
                <div class="notification-status" :class="{ active: userProfile.notifications?.email }">
                  <i :class="userProfile.notifications?.email ? 'mdi mdi-check' : 'mdi mdi-close'" class="icon"></i>
                  {{ userProfile.notifications?.email ? '有効' : '無効' }}
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-name">
                    <i class="mdi mdi-calendar-alert icon"></i>
                    カレンダー通知
                  </div>
                  <div class="notification-description">予定の開始前にリマインダー通知</div>
                </div>
                <div class="notification-status" :class="{ active: userProfile.notifications?.calendar }">
                  <i :class="userProfile.notifications?.calendar ? 'mdi mdi-check' : 'mdi mdi-close'" class="icon"></i>
                  {{ userProfile.notifications?.calendar ? '有効' : '無効' }}
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-name">
                    <i class="mdi mdi-cog icon"></i>
                    システム通知
                  </div>
                  <div class="notification-description">システムの重要な更新情報を通知</div>
                </div>
                <div class="notification-status" :class="{ active: userProfile.notifications?.system }">
                  <i :class="userProfile.notifications?.system ? 'mdi mdi-check' : 'mdi mdi-close'" class="icon"></i>
                  {{ userProfile.notifications?.system ? '有効' : '無効' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="action-buttons">
            <button type="button" @click="handleBack" class="btn btn-secondary">
              <i class="mdi mdi-arrow-left icon"></i>
              戻る
            </button>
            <button 
              v-if="canEdit" 
              type="button" 
              @click="handleUpdateMailAddress" 
              class="btn btn-primary"
            >
              <i class="mdi mdi-pencil icon"></i>
              メールアドレス変更
            </button>
            <button 
              v-if="canEdit" 
              type="button" 
              @click="handleEdit" 
              class="btn btn-primary"
            >
              <i class="mdi mdi-pencil icon"></i>
              編集
            </button>
          </div>
        </div>
        
        <!-- ローディング中 -->
        <div v-else-if="isLoading" class="loading-container">
          <div class="loading-spinner">
            <i class="mdi mdi-loading icon loading-spin"></i>
            <p>ユーザー情報を読み込み中...</p>
          </div>
        </div>
        
        <!-- エラー表示 -->
        <div v-else class="error-container">
          <div class="error-message">
            <i class="mdi mdi-alert-circle icon"></i>
            <h3>ユーザー情報が見つかりません</h3>
            <p>指定されたユーザーは存在しないか、アクセス権限がありません。</p>
            <button @click="handleBack" class="btn btn-primary">
              <i class="mdi mdi-arrow-left icon"></i>
              一覧に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通知 -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i :class="notification.type === 'success' ? 'mdi mdi-check' : 'mdi mdi-alert'" class="icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { User } from 'firebase/auth'
import { useUserProfile } from '~/composables/useUserProfile'

const user = useState<User>('user')

const { back, push } = useRouter()

// useUserProfileを使用
const {
  getUserProfile,
} = useUserProfile()

// リアクティブデータ
const userId = computed(() => user.value.uid)
const userProfile = ref<any>(null)
const isLoading = ref(true)
const showDeleteDialog = ref(false)

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 権限管理（実装は環境に応じて調整）
const canEdit = computed(() => {
  // 現在のユーザーの権限をチェック
  // 例: 管理者または本人のみ編集可能
  return true // 実装時に適切な権限チェックロジックを追加
})

// 役割の表示用データ
const roleLabel = computed(() => {
  switch (userProfile.value?.role) {
    case 'admin': return '管理者'
    case 'user': return '一般ユーザー'
    case 'viewer': return '閲覧者'
    default: return '未設定'
  }
})

const roleClass = computed(() => {
  switch (userProfile.value?.role) {
    case 'admin': return 'admin'
    case 'user': return 'user'
    case 'viewer': return 'viewer'
    default: return 'default'
  }
})

const roleIcon = computed(() => {
  switch (userProfile.value?.role) {
    case 'admin': return 'mdi mdi-shield-crown'
    case 'user': return 'mdi mdi-account'
    case 'viewer': return 'mdi mdi-eye'
    default: return 'mdi mdi-help-circle'
  }
})

// ステータスの表示用データ
const statusLabel = computed(() => {
  switch (userProfile.value?.status) {
    case 'active': return 'アクティブ'
    case 'inactive': return '無効'
    default: return '未設定'
  }
})

const statusClass = computed(() => {
  switch (userProfile.value?.status) {
    case 'active': return 'active'
    case 'inactive': return 'inactive'
    default: return 'default'
  }
})

const statusIcon = computed(() => {
  switch (userProfile.value?.status) {
    case 'active': return 'mdi mdi-check-circle'
    case 'inactive': return 'mdi mdi-pause-circle'
    default: return 'mdi mdi-help-circle'
  }
})

// ユーザーデータの読み込み
const loadUser = async () => {
  try {
    isLoading.value = true
    const profile = await getUserProfile(userId.value)
    
    if (profile) {
      userProfile.value = profile
    } else {
      userProfile.value = null
    }
  } catch (error) {
    console.error('ユーザーデータの読み込みに失敗しました:', error)
    userProfile.value = null
    showNotification('ユーザーデータの読み込みに失敗しました', 'error')
  } finally {
    isLoading.value = false
  }
}

// ハンドラー関数
const handleBack = () => {
  back()
}

const handleEdit = () => {
  push(`/profile/edit`)
}

const handleUpdateMailAddress = () => {
  push(`/auth/email/reset`)
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
  await loadUser()
})
</script>

<style scoped>
/* 全体のページスタイル */
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

/* プロフィールセクション */
.profile-section {
  background-color: var(--background-light);
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

/* 情報表示 */
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
  min-height: 20px;
}

.bio-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

/* 役割・ステータスバッジ */
.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
}

.role-badge.admin {
  background-color: var(--primary-color);
  color: white;
}

.role-badge.user {
  background-color: #22c55e;
  color: white;
}

.role-badge.viewer {
  background-color: #f59e0b;
  color: white;
}

.role-badge.default {
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.status-badge.active {
  background-color: #22c55e;
  color: white;
}

.status-badge.inactive {
  background-color: #ef4444;
  color: white;
}

.status-badge.default {
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* アバター表示 */
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
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--border-color);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: var(--background-light);
  border: 4px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 48px;
}

.avatar-info {
  flex: 1;
}

.avatar-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 通知設定表示 */
.notification-display {
  display: grid;
  gap: 16px;
}

.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: white;
}

.notification-info {
  flex: 1;
}

.notification-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-description {
  font-size: 13px;
  color: var(--text-secondary);
}

.notification-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  background-color: var(--background-light);
  color: var(--text-secondary);
}

.notification-status.active {
  background-color: #22c55e;
  color: white;
}

/* ボタン */
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
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.btn-danger {
  background-color: #dc2626;
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
}

/* アクションボタン */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

/* ローディング・エラー */
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

/* ダイアログ */
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
}

.dialog-content {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 400px;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
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
  border-radius: var(--radius-sm);
}

.dialog-close:hover {
  background-color: var(--background-light);
}

.dialog-body {
  padding: 24px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background-color: var(--background-light);
}

/* 通知 */
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

/* アイコン */
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

/* Vue Transition */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .page-container {
    padding: 0;
  }
  
  .container {
    border-radius: 0;
  }
  
  .header {
    padding: 24px 20px;
  }
  
  .content {
    padding: 24px 20px;
  }
  
  .profile-section {
    padding: 20px 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .avatar-display-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column-reverse;
  }
  
  .btn {
    justify-content: center;
  }
  
  .dialog-content {
    min-width: auto;
    margin: 20px;
    width: calc(100% - 40px);
  }
}
</style>