<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">チーム詳細</p>
      </div>
      
      <div class="content">
        <div v-if="item" class="profile-content">

          <div class="details-grid">
            
            <div class="main-content">
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
                  <div class="info-item full-width">
                    <label class="info-label">
                      <i class="mdi mdi-tag-multiple-outline icon"></i>
                      カテゴリ
                    </label>
                    <div class="info-value">{{ item.category || '未設定' }}</div>
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

              <div v-if="members.length > 0" class="profile-section">
                <h3 class="section-title">
                  <i class="mdi mdi-account-group icon"></i>
                  所属メンバー
                </h3>
                <div class="members-list">
                  <div v-for="member in members" :key="member.id" class="member-item">
                    <div class="member-avatar">
                      <img v-if="member.avatar" :src="member.avatar" :alt="member.name" class="avatar-image">
                      <div v-else class="avatar-placeholder-sm">
                        <i class="mdi mdi-account icon"></i>
                      </div>
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.name }}</div>
                      <div class="member-department">{{ member.department || '部署未設定' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="sidebar-content">
              <div class="profile-section">
                <h3 class="section-title">
                  <i class="mdi mdi-list-status icon"></i>
                  ステータス
                </h3>
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
              
              <div class="profile-section">
                <h3 class="section-title">
                  <i class="mdi mdi-camera icon"></i>
                  チーム画像
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
                </div>
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
          </div>
        
        <div v-else class="error-container">
          </div>
      </div>
    </div>
    
    <div v-if="showDeleteDialog" class="dialog-overlay">
      </div>
    
    <Transition name="notification">
      </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useTeam } from '~/composables/useTeam'
import { useMaster } from '~/composables/master/useMaster'

// head設定
useHead({
  title: 'TASCAL - チーム詳細'
});

// Nuxt3を想定
const { back, push } = useRouter()
const route = useRoute()

const { getAsync, deleteAsync } = useTeam()
const { getListAsync: getUsersAsync } = useMaster('users')

// Memberの型定義
interface Member {
  id: string;
  name: string;
  department?: string;
  avatar?: string;
}

// SEOメタタグ設定
useHead({
  title: 'TASCAL - チーム詳細',
  meta: [
    { name: 'description', content: 'TASCALシステムのチーム詳細情報を表示します' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})


// リアクティブデータ
const itemId = computed(() => route.params.id as string)
const item = ref<any | null>(null)
const members = ref<Member[]>([])
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

// チームデータの読み込み
const loadItem = async () => {
  try {
    isLoading.value = true
    const fetchedItem = await getAsync(itemId.value)
    item.value = fetchedItem

    if (fetchedItem && fetchedItem.members && fetchedItem.members.length > 0) {
      const allUsers = await getUsersAsync() as any[];
      members.value = allUsers
        .filter(user => user.status === 'active' && fetchedItem.members.includes(user.uid))
        .map(user => ({
          id: user.uid,
          name: user.displayName || '未設定',
          department: user.department || '',
          avatar: user.avatar,
        }));
    }

  } catch (error) {
    console.error('チームデータの読み込みに失敗しました:', error)
    item.value = null
    showNotification('チームデータの読み込みに失敗しました', 'error')
  } finally {
    isLoading.value = false
  }
}

// ハンドラー関数
const handleBack = () => {
  push('/team')
}

const handleEdit = () => {
  push(`/team/${itemId.value}/edit`)
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
    showNotification('チームを削除しました')
    
    setTimeout(() => {
      push('/team')
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
  top: 0; left: 0; right: 0; bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.1;
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

.details-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}
.main-content, .sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-section {
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
  min-height: 44px;
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
.status-badge.active { background-color: var(--success-color); color: white; }
.status-badge.in-use { background-color: var(--warning-color); color: white; }
.status-badge.inactive { background-color: var(--danger-color); color: white; }
.status-badge.default { background-color: var(--background-light); color: var(--text-secondary); border: 1px solid var(--border-color); }

.avatar-display-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.avatar-container { flex-shrink: 0; }
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
.avatar-placeholder .icon { font-size: 48px; }
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
.btn-primary { background-color: var(--primary-color); color: white; }
.btn-secondary { background-color: var(--background-light); color: var(--text-primary); border: 2px solid var(--border-color); }
.btn-danger { background-color: var(--danger-color); color: white; }

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
.loading-container, .error-container {
  display: flex; align-items: center; justify-content: center; min-height: 300px;
}

/* ▼▼▼ [変更] 高さを5人分に制限し、スクロールを有効化 ▼▼▼ */
.members-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 420px; /* (メンバー1人の高さ約72px + gap12px) * 5 */
  overflow-y: auto;
  padding-right: 8px; /* スクロールバーのスペース確保 */
}
/* ▲▲▲ [変更] 高さを5人分に制限し、スクロールを有効化 ▲▲▲ */

.member-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: var(--background-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}
.member-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.member-avatar .avatar-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.member-avatar .avatar-placeholder-sm {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--background-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.avatar-placeholder-sm .icon { font-size: 24px; }
.member-info { flex: 1; }
.member-name { font-weight: 600; color: var(--text-primary); }
.member-department { font-size: 13px; color: var(--text-secondary); }

.mt-4 { margin-top: 1rem; }
.icon { font-size: 16px; line-height: 1; }

@media (max-width: 768px) {
  .page-container { padding: 0; }
  .container { border-radius: 0; }
  .content { padding: 24px 16px; }
  .details-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; gap: 16px; }
  .action-buttons { flex-direction: column-reverse; gap: 12px; }
  .btn { justify-content: center; }
}
</style>