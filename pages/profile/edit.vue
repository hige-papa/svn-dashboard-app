<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <!-- <h1 class="app-title">TASCAL</h1> -->
        <p class="page-subtitle">{{ isEditMode ? 'ユーザー編集' : '新規ユーザー登録' }}</p>
      </div>
      
      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <!-- 基本情報セクション -->
          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-account icon"></i>
              基本情報
            </h3>
            
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.name }">
                <label class="form-label" for="userName">
                  <i class="mdi mdi-account icon"></i>
                  氏名
                  <span class="required">*</span>
                </label>
                <input 
                  id="userName"
                  v-model="formData.name"
                  type="text" 
                  class="form-input" 
                  placeholder="例：田中太郎"
                  @blur="validateField('name')"
                  @input="clearError('name')"
                >
                <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
              </div>
              
              <div class="form-group" :class="{ error: errors.email }">
                <label class="form-label" for="userEmail">
                  <i class="mdi mdi-email icon"></i>
                  メールアドレス
                  <span class="required">*</span>
                </label>
                <input 
                  id="userEmail"
                  v-model="formData.email"
                  type="email" 
                  class="form-input" 
                  placeholder="例：tanaka@example.com"
                  :disabled="isEditMode"
                  @blur="validateField('email')"
                  @input="clearError('email')"
                >
                <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
              </div>
            </div>
            
            <div v-if="!isEditMode" class="form-group mb-4" :class="{ error: errors.password }">
              <label class="form-label" for="userPassword">
                <i class="mdi mdi-lock icon"></i>
                パスワード
                <span class="required">*</span>
              </label>
              <input 
                id="userPassword"
                v-model="formData.password"
                type="password" 
                class="form-input" 
                placeholder="6文字以上で入力してください"
                @blur="validateField('password')"
                @input="clearError('password')"
              >
              <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
            </div>
            
            <div class="form-group row">
              <div class="form-group">
                <label class="form-label" for="userPhone">
                  <i class="mdi mdi-phone icon"></i>
                  電話番号
                </label>
                <input 
                  id="userPhone"
                  v-model="formData.phone"
                  type="tel" 
                  class="form-input" 
                  placeholder="例：090-1234-5678"
                >
              </div>
              
              <div class="form-group" :class="{ error: errors.department }">
                <label class="form-label" for="userDepartment">
                  <i class="mdi mdi-office-building icon"></i>
                  部署
                  <span class="required">*</span>
                </label>
                <select 
                  id="userDepartment"
                  v-model="formData.department"
                  class="form-select"
                  @blur="validateField('department')"
                  @change="clearError('department')"
                >
                  <option value="">部署を選択してください</option>
                  <option v-for="dept in departments" :key="dept" :value="dept">
                    {{ dept }}
                  </option>
                </select>
                <div v-if="errors.department" class="form-error">{{ errors.department }}</div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="userBio">
                <i class="mdi mdi-card-text icon"></i>
                自己紹介・備考
              </label>
              <textarea 
                id="userBio"
                v-model="formData.bio"
                class="form-textarea" 
                placeholder="自己紹介や備考などを入力してください..."
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <!-- プロフィール画像セクション -->
          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-camera icon"></i>
              プロフィール画像
            </h3>
            
            <div class="avatar-upload-section">
              <div class="current-avatar">
                <div v-if="formData.avatar || previewImage" class="avatar-preview">
                  <img :src="previewImage || formData.avatar" :alt="formData.name" class="avatar-image">
                </div>
                <div v-else class="avatar-placeholder">
                  <i class="mdi mdi-account icon"></i>
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
                  v-if="formData.avatar || previewImage"
                  type="button" 
                  @click="removeAvatar" 
                  class="btn btn-outline"
                >
                  <i class="mdi mdi-delete icon"></i>
                  削除
                </button>
              </div>
            </div>
          </div>
          
          <!-- 通知設定セクション -->
          <div class="form-section">
            <h3 class="section-title">
              <i class="mdi mdi-bell icon"></i>
              通知設定
            </h3>
            
            <div class="notification-settings">
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    v-model="formData.notifications.email"
                    type="checkbox" 
                    class="setting-checkbox"
                  >
                  <div class="setting-info">
                    <div class="setting-name">
                      <i class="mdi mdi-email icon"></i>
                      メール通知
                    </div>
                    <div class="setting-description">予定の追加・変更時にメールで通知</div>
                  </div>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    v-model="formData.notifications.calendar"
                    type="checkbox" 
                    class="setting-checkbox"
                  >
                  <div class="setting-info">
                    <div class="setting-name">
                      <i class="mdi mdi-calendar-alert icon"></i>
                      カレンダー通知
                    </div>
                    <div class="setting-description">予定の開始前にリマインダー通知</div>
                  </div>
                </label>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    v-model="formData.notifications.system"
                    type="checkbox" 
                    class="setting-checkbox"
                  >
                  <div class="setting-info">
                    <div class="setting-name">
                      <i class="mdi mdi-cog icon"></i>
                      システム通知
                    </div>
                    <div class="setting-description">システムの重要な更新情報を通知</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <!-- フォームアクション -->
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn btn-secondary">
              <i class="mdi mdi-close icon"></i>
              キャンセル
            </button>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              <i v-if="isLoading" class="mdi mdi-loading icon loading-spin"></i>
              <i v-else class="mdi mdi-content-save icon"></i>
              {{ isLoading ? '保存中...' : (isEditMode ? 'ユーザーを更新' : 'ユーザーを作成') }}
            </button>
          </div>
        </form>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'
import { useSection } from '~/composables/useSection'
import type { User } from 'firebase/auth'

const user = useState<User>('user')

const { back, push } = useRouter()

// 型定義
interface UserFormData {
  name: string
  email: string
  password: string
  phone: string
  department: string
  role: 'admin' | 'user' | 'viewer' | ''
  status: 'active' | 'inactive'
  bio: string
  avatar: string
  notifications: {
    email: boolean
    calendar: boolean
    system: boolean
  }
}

interface UserFormErrors {
  name?: string
  email?: string
  password?: string
  department?: string
  role?: string
}

// useUserProfileを使用
const {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  // getDepartmentStats
} = useUserProfile()

// useSectionを使用
const { getListAsync: getSections } = useSection()

// リアクティブデータ
const isEditMode = computed(() => !!user.value?.uid)
const userId = computed(() => user.value.uid)

const formData = reactive<UserFormData>({
  name: '',
  email: '',
  password: '',
  phone: '',
  department: '',
  role: '',
  status: 'active',
  bio: '',
  avatar: '',
  notifications: {
    email: true,
    calendar: true,
    system: false
  }
})

const errors = reactive<UserFormErrors>({})
const isLoading = ref(false)
const previewImage = ref('')
const fileInput = ref<HTMLInputElement>()

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 部署のマスタデータ（統計から取得）
const departments = ref<string[]>([])

// ユーザーデータの読み込み（編集時）
const loadUser = async () => {
  if (!isEditMode.value) return
  
  try {
    // useUserProfileを使用してユーザー取得
    const userProfile = await getUserProfile(userId.value)
    
    if (userProfile) {
      // フォームデータに設定
      Object.assign(formData, {
        name: userProfile.displayName,
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        role: userProfile.role || 'user',
        status: userProfile.status || 'active',
        bio: userProfile.bio || '',
        avatar: userProfile.avatar || '',
        notifications: userProfile.notifications || {
          email: true,
          calendar: true,
          system: false
        }
      })
    }
  } catch (error) {
    console.error('ユーザーデータの読み込みに失敗しました:', error)
    showNotification('ユーザーデータの読み込みに失敗しました', 'error')
  }
}

// 部署データの読み込み
const loadDepartments = async () => {
  try {
    // const deptStats = await getDepartmentStats()
    // departments.value = deptStats.map(stat => stat.department)
    
    // 基本の部署も含める
    // const defaultDepartments = ['営業部', '総務部', '開発部', '人事部', '経理部', 'マーケティング部']
    // const allDepartments = [...new Set([...departments.value, ...defaultDepartments])]
    // departments.value = allDepartments.sort()

    await getSections().then(response => {
      if (response) departments.value = (response as Section[]).map(e => { return e.name }).sort()
    })
  } catch (error) {
    console.error('部署データの読み込みに失敗しました:', error)
    // デフォルトの部署を使用
    // departments.value = ['営業部', '総務部', '開発部', '人事部', '経理部', 'マーケティング部']
  }
}

// バリデーション
const validateField = (fieldName: keyof UserFormErrors) => {
  switch (fieldName) {
    case 'name':
      if (!formData.name.trim()) {
        errors.name = '氏名を入力してください'
      } else if (formData.name.length < 2) {
        errors.name = '氏名は2文字以上で入力してください'
      }
      break
    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'メールアドレスを入力してください'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = '有効なメールアドレスを入力してください'
      }
      break
    case 'password':
      if (!isEditMode.value && !formData.password.trim()) {
        errors.password = 'パスワードを入力してください'
      } else if (!isEditMode.value && formData.password.length < 6) {
        errors.password = 'パスワードは6文字以上で入力してください'
      }
      break
    case 'department':
      if (!formData.department) {
        errors.department = '部署を選択してください'
      }
      break
    case 'role':
      if (!formData.role) {
        errors.role = '役割を選択してください'
      }
      break
  }
}

const validateForm = (): boolean => {
  // エラーをクリア
  Object.keys(errors).forEach(key => {
    delete errors[key as keyof UserFormErrors]
  })
  
  // 全フィールドをバリデーション
  validateField('name')
  validateField('email')
  if (!isEditMode.value) {
    validateField('password')
  }
  validateField('department')
  validateField('role')
  
  return Object.keys(errors).length === 0
}

const clearError = (fieldName: keyof UserFormErrors) => {
  if (errors[fieldName]) {
    delete errors[fieldName]
  }
}

// ファイルアップロード
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // ファイルサイズチェック（2MB）
  if (file.size > 2 * 1024 * 1024) {
    showNotification('ファイルサイズは2MB以下にしてください', 'error')
    return
  }
  
  // ファイル形式チェック
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showNotification('JPEG または PNG 形式の画像を選択してください', 'error')
    return
  }
  
  // プレビュー表示
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeAvatar = () => {
  formData.avatar = ''
  previewImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// フォーム送信
const handleSubmit = async () => {
  if (!validateForm()) {
    showNotification('入力内容を確認してください', 'error')
    return
  }
  
  isLoading.value = true
  
  try {
    if (isEditMode.value) {
      // 更新処理
      const updateData = {
        displayName: formData.name,
        displayNameEng: formData.name, // 英語名がない場合は同じ値を使用
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        role: formData.role as 'admin' | 'user' | 'viewer',
        status: formData.status,
        bio: formData.bio,
        avatar: previewImage.value || formData.avatar,
        notifications: formData.notifications
      }
      
      await updateUserProfile(userId.value, updateData)
      showNotification('ユーザー情報を更新しました！')
      
    } else {
      showNotification('ユーザー情報の更新に失敗しました')
    }
    
    // リスト画面に戻る
    setTimeout(() => {
      push('/profile')
    }, 1500)
    
  } catch (error) {
    console.error('保存エラー:', error)
    showNotification('更新に失敗しました', 'error')
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
  
  setTimeout(() => {
    notification.show = false
  }, 3000)
}

// ライフサイクル
onMounted(async () => {
  await loadDepartments()
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

.form-content {
  padding: 40px;
}

.form-grid {
  display: grid;
  gap: 32px;
}

/* フォームセクション */
.form-section {
  background-color: var(--background-light);
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

/* フォーム基本要素 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-label .required {
  color: var(--danger-color);
  font-size: 12px;
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
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
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

/* 役割選択 */
.role-options {
  display: grid;
  gap: 12px;
}

.role-option {
  position: relative;
}

.role-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.role-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  background-color: white;
}

.role-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.role-radio:checked + .role-label {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: white;
}

.role-info {
  flex: 1;
}

.role-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.role-description {
  font-size: 13px;
  opacity: 0.8;
}

/* ステータス選択 */
.status-options {
  display: flex;
  gap: 12px;
}

.status-option {
  flex: 1;
  position: relative;
}

.status-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.status-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
  background-color: white;
}

.status-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.status-radio:checked + .status-label.active {
  border-color: #22c55e;
  background-color: #22c55e;
  color: white;
}

.status-radio:checked + .status-label.inactive {
  border-color: #ef4444;
  background-color: #ef4444;
  color: white;
}

/* アバターアップロード */
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
  margin-top: 8px;
}

/* 通知設定 */
.notification-settings {
  display: grid;
  gap: 16px;
}

.setting-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: white;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: var(--transition);
}

.setting-label:hover {
  background-color: var(--background-light);
}

.setting-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--primary-color);
}

.setting-info {
  flex: 1;
}

.setting-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-description {
  font-size: 13px;
  color: var(--text-secondary);
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

.btn-primary:disabled {
  background-color: var(--text-light);
  cursor: not-allowed;
  transform: none;
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

.btn-outline {
  background-color: transparent;
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-outline:hover {
  background-color: var(--background-light);
  color: var(--text-primary);
}

/* フォームアクション */
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
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
  
  .form-content {
    padding: 24px 20px;
  }
  
  .form-section {
    padding: 20px 16px;
  }
  
  .form-group.row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .avatar-upload-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .status-options {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>