<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <h1 class="app-title">TASCAL</h1>
        <p class="page-subtitle">ユーザー管理</p>
      </div>
      
      <div class="content">
        <!-- 検索・フィルターエリア -->
        <div class="search-filter-section">
          <div class="search-box">
            <i class="mdi mdi-magnify icon"></i>
            <input 
              v-model="searchQuery"
              type="text" 
              class="search-input" 
              placeholder="名前、部署、メールアドレスで検索..."
              @input="filterUsers"
            >
          </div>
          
          <div class="filter-controls">
            <select v-model="selectedDepartment" @change="filterUsers" class="filter-select">
              <option value="">全部署</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            
            <select v-model="selectedRole" @change="filterUsers" class="filter-select">
              <option value="">全役割</option>
              <option value="admin">管理者</option>
              <option value="user">一般ユーザー</option>
              <option value="viewer">閲覧者</option>
            </select>
            
            <button @click="navigateToUserForm" class="btn btn-primary">
              <i class="mdi mdi-plus icon"></i>
              新規ユーザー
            </button>
          </div>
        </div>
        
        <!-- ユーザー統計 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="mdi mdi-account-group icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalUsers }}</div>
              <div class="stat-label">総ユーザー数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon active">
              <i class="mdi mdi-account-check icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ activeUsers }}</div>
              <div class="stat-label">アクティブユーザー</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon departments">
              <i class="mdi mdi-office-building icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ departments.length }}</div>
              <div class="stat-label">部署数</div>
            </div>
          </div>
        </div>
        
        <!-- ユーザー一覧 -->
        <div class="users-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="mdi mdi-account-multiple icon"></i>
              ユーザー一覧
              <span class="user-count">（{{ filteredUsers.length }}件）</span>
            </h2>
            
            <div class="view-toggle">
              <button 
                :class="['view-btn', { active: viewMode === 'grid' }]"
                @click="viewMode = 'grid'"
              >
                <i class="mdi mdi-view-grid icon"></i>
              </button>
              <button 
                :class="['view-btn', { active: viewMode === 'list' }]"
                @click="viewMode = 'list'"
              >
                <i class="mdi mdi-view-list icon"></i>
              </button>
            </div>
          </div>
          
          <!-- グリッドビュー -->
          <div v-if="viewMode === 'grid'" class="users-grid">
            <div v-if="filteredUsers.length === 0" class="no-results">
              <i class="mdi mdi-account-search icon"></i>
              <p>該当するユーザーが見つかりません</p>
            </div>
            
            <div 
              v-for="user in paginatedUsers" 
              :key="user.id"
              class="user-card"
              @click="viewUserDetail(user)"
            >
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="avatar-image">
                <div v-else class="avatar-placeholder">
                  {{ user.name?.charAt(0).toUpperCase() }}
                </div>
                <div :class="['status-indicator', user.status]"></div>
              </div>
              
              <div class="user-info">
                <h3 class="user-name">{{ user.name }}</h3>
                <p class="user-email">{{ user.email }}</p>
                <p class="user-department">{{ user.department }}</p>
                
                <div class="user-meta">
                  <span :class="['role-badge', user.role]">
                    <i :class="getRoleIcon(user.role)" class="icon"></i>
                    {{ getRoleLabel(user.role) }}
                  </span>
                  <span :class="['status-badge', user.status]">
                    {{ getStatusLabel(user.status) }}
                  </span>
                </div>
              </div>
              
              <div class="user-actions">
                <button 
                  @click.stop="editUser(user)" 
                  class="action-btn edit"
                  title="編集"
                >
                  <i class="mdi mdi-pencil icon"></i>
                </button>
                <button 
                  @click.stop="handleToggleUserStatus(user)" 
                  class="action-btn status"
                  :title="user.status === 'active' ? '無効化' : '有効化'"
                >
                  <i :class="user.status === 'active' ? 'mdi mdi-pause' : 'mdi mdi-play'" class="icon"></i>
                </button>
                <button 
                  @click.stop="deleteUser(user)" 
                  class="action-btn delete"
                  title="削除"
                >
                  <i class="mdi mdi-delete icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- リストビュー -->
          <div v-else class="users-table">
            <table class="table">
              <thead>
                <tr>
                  <th>ユーザー</th>
                  <th>部署</th>
                  <th>役割</th>
                  <th>ステータス</th>
                  <th>最終ログイン</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="6" class="no-results-row">
                    該当するユーザーが見つかりません
                  </td>
                </tr>
                <tr 
                  v-for="user in paginatedUsers" 
                  :key="user.id"
                  class="table-row"
                  @click="viewUserDetail(user)"
                >
                  <td class="user-cell">
                    <div class="user-avatar-small">
                      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="avatar-image">
                      <div v-else class="avatar-placeholder">
                        {{ user.name?.charAt(0).toUpperCase() }}
                      </div>
                      <div :class="['status-indicator', user.status]"></div>
                    </div>
                    <div class="user-basic-info">
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email">{{ user.email }}</div>
                    </div>
                  </td>
                  <td>{{ user.department }}</td>
                  <td>
                    <span :class="['role-badge', user.role]">
                      <i :class="getRoleIcon(user.role)" class="icon"></i>
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td>
                    <span :class="['status-badge', user.status]">
                      {{ getStatusLabel(user.status) }}
                    </span>
                  </td>
                  <td>{{ formatLastLogin(user.lastLogin) }}</td>
                  <td class="actions-cell">
                    <button 
                      @click.stop="editUser(user)" 
                      class="action-btn edit"
                      title="編集"
                    >
                      <i class="mdi mdi-pencil icon"></i>
                    </button>
                    <button 
                      @click.stop="handleToggleUserStatus(user)" 
                      class="action-btn status"
                      :title="user.status === 'active' ? '無効化' : '有効化'"
                    >
                      <i :class="user.status === 'active' ? 'mdi mdi-pause' : 'mdi mdi-play'" class="icon"></i>
                    </button>
                    <button 
                      @click.stop="deleteUser(user)" 
                      class="action-btn delete"
                      title="削除"
                    >
                      <i class="mdi mdi-delete icon"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- ページネーション -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              <i class="mdi mdi-chevron-left icon"></i>
            </button>
            
            <span class="pagination-info">
              {{ currentPage }} / {{ totalPages }} ページ
              （{{ filteredUsers.length }}件中 {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredUsers.length) }}件を表示）
            </span>
            
            <button 
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              <i class="mdi mdi-chevron-right icon"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title">
                <i class="mdi mdi-alert icon"></i>
                ユーザーの削除
              </h3>
            </div>
            <div class="modal-body">
              <p>
                <strong>{{ selectedUser?.name }}</strong> さんを削除しますか？
              </p>
              <p class="warning-text">
                この操作は取り消すことができません。このユーザーに関連する全てのデータが削除されます。
              </p>
            </div>
            <div class="modal-footer">
              <button @click="closeDeleteModal" class="btn btn-secondary">
                キャンセル
              </button>
              <button @click="confirmDelete" class="btn btn-danger">
                <i class="mdi mdi-delete icon"></i>
                削除する
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
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
import type { Timestamp } from 'firebase/firestore'
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'

const { push } = useRouter()

// SEOメタタグ設定
useHead({
  title: 'TASCAL - ユーザー管理',
  meta: [
    { name: 'description', content: 'TASCALシステムのユーザー管理画面です' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// 型定義
interface User {
  id: string
  name: string
  email: string
  department: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive'
  avatar?: string
  lastLogin?: string
  createdAt: string
}

// useUserProfileを使用
const {
  getAllUserProfiles,
  deleteUserProfile,
  toggleUserStatus,
  getDepartmentStats
} = useUserProfile()

// リアクティブデータ
const users = ref<User[]>([])
const filteredUsers = ref<User[]>([])
const searchQuery = ref('')
const selectedDepartment = ref('')
const selectedRole = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const itemsPerPage = 12
const showDeleteModal = ref(false)
const selectedUser = ref<User | null>(null)

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 部署データ（統計から取得）
const departments = ref<string[]>([])

// 計算プロパティ
const totalUsers = computed(() => users.value.length)
const activeUsers = computed(() => users.value.filter(user => user.status === 'active').length)

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => startIndex.value + itemsPerPage)

const paginatedUsers = computed(() => {
  return filteredUsers.value.slice(startIndex.value, endIndex.value)
})

// メソッド
const loadUsers = async () => {
  try {
    // useUserProfileを使用してユーザー一覧を取得
    const userProfiles = await getAllUserProfiles()
    
    // User型に変換
    users.value = userProfiles.map(profile => ({
      id: profile.uid || profile.uid,
      name: profile.displayName,
      email: profile.email || '',
      department: profile.department || '',
      role: profile.role || 'user',
      status: profile.status || 'active',
      avatar: profile.avatar,
      lastLogin: profile.lastLogin?.toDate(),
      createdAt: profile.createdAt?.toDate() || new Date().toISOString()
    }))
    
    filteredUsers.value = [...users.value]
    
    // 部署統計を取得
    const deptStats = await getDepartmentStats()
    departments.value = deptStats.map(stat => stat.department)
    
  } catch (error) {
    console.error('ユーザーの読み込みに失敗しました:', error)
    showNotification('ユーザーの読み込みに失敗しました', 'error')
  }
}

const filterUsers = () => {
  filteredUsers.value = users.value.filter(user => {
    const matchesSearch = !searchQuery.value || 
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesDepartment = !selectedDepartment.value || 
      user.department === selectedDepartment.value
    
    const matchesRole = !selectedRole.value || 
      user.role === selectedRole.value
    
    return matchesSearch && matchesDepartment && matchesRole
  })
  
  currentPage.value = 1
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return 'mdi mdi-shield-crown'
    case 'user': return 'mdi mdi-account'
    case 'viewer': return 'mdi mdi-eye'
    default: return 'mdi mdi-account'
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return '管理者'
    case 'user': return 'ユーザー'
    case 'viewer': return '閲覧者'
    default: return 'ユーザー'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'アクティブ'
    case 'inactive': return '無効'
    default: return 'アクティブ'
  }
}

const formatLastLogin = (lastLogin?: string) => {
  if (!lastLogin) return '未ログイン'
  
  const date = new Date(lastLogin)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '今日'
  if (diffDays === 2) return '昨日'
  if (diffDays <= 7) return `${diffDays - 1}日前`
  
  return date.toLocaleDateString('ja-JP')
}

const navigateToUserForm = () => {
  push('/users/new')
}

const viewUserDetail = (user: User) => {
  push(`/users/${user.id}`)
}

const editUser = (user: User) => {
  push(`/users/${user.id}/edit`)
}

const handleToggleUserStatus = async (user: User) => {
  try {
    // useUserProfileを使用してステータス切り替え
    await toggleUserStatus(user.id)
    
    // ローカルデータを更新
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      const newStatus = users.value[userIndex].status === 'active' ? 'inactive' : 'active'
      users.value[userIndex].status = newStatus
    }
    
    filterUsers()
    showNotification(
      `${user.name}さんのステータスを${user.status === 'active' ? '無効' : '有効'}に変更しました`, 
      'success'
    )
  } catch (error) {
    console.error('ステータスの更新に失敗しました:', error)
    showNotification('ステータスの更新に失敗しました', 'error')
  }
}

const deleteUser = (user: User) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedUser.value = null
}

const confirmDelete = async () => {
  if (!selectedUser.value) return
  
  try {
    // useUserProfileを使用してユーザー削除
    await deleteUserProfile(selectedUser.value.id)
    
    // ローカルデータからも削除
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id)
    if (userIndex !== -1) {
      users.value.splice(userIndex, 1)
    }
    
    filterUsers()
    showNotification(`${selectedUser.value.name}さんを削除しました`, 'success')
    closeDeleteModal()
  } catch (error) {
    console.error('ユーザーの削除に失敗しました:', error)
    showNotification('ユーザーの削除に失敗しました', 'error')
  }
}

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.message = message
  notification.type = type
  notification.show = true
  
  setTimeout(() => {
    notification.show = false
  }, 3000)
}

// ライフサイクル
onMounted(() => {
  loadUsers()
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
  max-width: 1200px;
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

/* 検索・フィルターセクション */
.search-filter-section {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background-color: var(--background-light);
  border-radius: var(--radius-md);
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box .icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 18px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
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

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

/* 統計セクション */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
}

.stat-icon.active {
  background-color: #dcfce7;
  color: #16a34a;
}

.stat-icon.departments {
  background-color: #fef3c7;
  color: #d97706;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* ユーザーセクション */
.users-section {
  background-color: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-count {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
}

.view-toggle {
  display: flex;
  gap: 4px;
  background-color: var(--background-light);
  border-radius: var(--radius-sm);
  padding: 4px;
}

.view-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-secondary);
}

.view-btn.active {
  background-color: white;
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

/* ユーザーグリッド */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.user-card {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.user-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.active {
  background-color: #22c55e;
}

.status-indicator.inactive {
  background-color: #ef4444;
}

.user-info {
  text-align: center;
  margin-bottom: 16px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.user-department {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.user-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.role-badge, .status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #fef3c7;
  color: #d97706;
}

.role-badge.user {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.role-badge.viewer {
  background-color: #f3f4f6;
  color: #6b7280;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.inactive {
  background-color: #fee2e2;
  color: #dc2626;
}

.user-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.action-btn.edit:hover {
  background-color: var(--primary-color);
  color: white;
}

.action-btn.status {
  background-color: #f3f4f6;
  color: #6b7280;
}

.action-btn.status:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.action-btn.delete {
  background-color: #fee2e2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background-color: #dc2626;
  color: white;
}

/* テーブルスタイル */
.users-table {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  background-color: var(--background-light);
  color: var(--text-secondary);
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  cursor: pointer;
  transition: var(--transition);
}

.table-row:hover {
  background-color: var(--background-light);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-small {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.user-avatar-small .avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-small .avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.user-avatar-small .status-indicator {
  width: 12px;
  height: 12px;
  bottom: 0;
  right: 0;
}

.user-basic-info .user-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.user-basic-info .user-email {
  font-size: 13px;
  color: var(--text-secondary);
}

.actions-cell {
  text-align: center;
}

.no-results-row {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

/* ページネーション */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background-color: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 結果なし */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  grid-column: 1 / -1;
}

.no-results .icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* ボタンスタイル */
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
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--background-light);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

/* モーダルスタイル */
.modal-overlay {
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

.modal-container {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24px 24px 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  flex: 1;
}

.warning-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
}

/* 通知スタイル */
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

/* Vue Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

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
  
  .search-filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filter-controls {
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
}
</style>