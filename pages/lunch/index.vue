<template>
  <div class="page-container">
    <v-container class="h-100">
      <div class="header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <i class="mdi mdi-food icon"></i>
              ランチ会チームシャッフル
            </h1>
            <p class="page-description">最大20名の名前を入力し、シャッフルで3〜4名構成のチームを自動編成します（5名以下は1チーム）。</p>
          </div>
        </div>
      </div>

      <!-- 入力エリア -->
      <div class="input-section">
        <div class="panel">
          <div class="grid" ref="nameGrid">
            <div
              v-for="i in 20"
              :key="`name-${i}`"
              class="field"
            >
              <label :for="`name-${i}`" class="label">参加者 {{ i }}</label>
              <input
                :id="`name-${i}`"
                :value="localParticipants[i - 1]"
                @input="updateParticipant(i - 1, ($event.target as HTMLInputElement).value)"
                type="text"
                class="input"
                :placeholder="`名前${i}`"
                :aria-label="`参加者${i}の氏名`"
                :ref="el => { if (i === 1 && el) firstInput = el as HTMLInputElement }"
                :disabled="isLoading"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 操作ボタン -->
      <div class="actions">
        <button
          @click="fetchTodayLunchParticipants"
          class="btn btn-info"
          aria-label="本日のランチ参加者を取得"
          :disabled="isLoading || isDailyOptionsLoading"
        >
          <i class="mdi mdi-account-multiple-plus icon" v-if="!isDailyOptionsLoading"></i>
          <i class="mdi mdi-loading mdi-spin icon" v-if="isDailyOptionsLoading"></i>
          参加者取得
        </button>
        <button
          @click="shuffle"
          class="btn btn-primary"
          aria-label="チームをシャッフル"
          :disabled="isLoading"
        >
          <i class="mdi mdi-shuffle icon" v-if="!isLoading"></i>
          <i class="mdi mdi-loading mdi-spin icon" v-if="isLoading"></i>
          シャッフル
        </button>
        <button
          @click="clearAllData"
          class="btn btn-ghost"
          aria-label="入力と結果をクリア"
          :disabled="isLoading"
        >
          <i class="mdi mdi-close icon"></i>
          クリア
        </button>
      </div>

      <!-- 結果表示 -->
      <div class="panel" role="region" aria-labelledby="result-title">
        <div class="result-content">
          <h2 id="result-title" class="result-title">結果</h2>
          <div
            id="result-message"
            :class="['message', { error: hasError }]"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style="white-space: pre-line;"
          >
            {{ resultMessage || message }}
          </div>
        </div>
      </div>

      <!-- フッター -->
      <div class="footer">
        <p>※ チーム名は A〜Z の範囲で自動採番します。履歴保存は行いません。</p>
      </div>

      <!-- 通知 -->
      <div 
        v-if="notification.show" 
        :class="['notification', notification.type]"
        role="alert"
        aria-live="assertive"
      >
        <i :class="`mdi ${notification.type === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle'} icon`"></i>
        <span>{{ notification.message }}</span>
      </div>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useLunchShuffle } from '~/composables/useLunchShuffle'
import { useDailyOptions } from '~/composables/useDailyOptions'
import { useUserProfile } from '~/composables/useUserProfile'

// SEOメタタグ設定
useHead({
  title: 'TASCAL - ランチ会チームシャッフル',
  meta: [
    { name: 'description', content: 'TASCALシステムのランチ会チームシャッフル画面です' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// 日別オプション機能
const currentDate = ref(new Date()) // 確実に今日の日付
const currentView = ref<'daily' | 'weekly' | 'monthly'>('daily') // 今日のデータのみ取得
const { 
  dailyOptions, 
  isLoading: isDailyOptionsLoading, 
  loadDailyOptions 
} = useDailyOptions(currentDate, currentView)

// ユーザープロフィール機能
const { getActiveUserProfiles } = useUserProfile()

// ユーザー情報
const users = ref<ExtendedUserProfile[]>([])

// リアルタイム機能
const { 
  lunchData, 
  isLoading, 
  error: shuffleError, 
  startRealtimeListener, 
  updateSingleParticipant, 
  executeShuffle, 
  clearAll 
} = useLunchShuffle()

// ローカル状態
const localParticipants = ref<string[]>(Array(20).fill(''))
const message = ref('')
const hasError = ref(false)
const firstInput = ref<HTMLInputElement>()
const isUpdating = ref(false)

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 計算プロパティ
const resultMessage = computed(() => lunchData.value?.resultMessage || '')

// Firestoreからローカル状態への同期
watch(lunchData, (newData) => {
  if (newData && !isUpdating.value) {
    localParticipants.value = [...newData.participants]
  }
}, { immediate: true })

// ローカル入力からFirestoreへの同期（デバウンス）
let updateTimeout: NodeJS.Timeout | null = null
const debouncedUpdate = (index: number, value: string) => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  updateTimeout = setTimeout(async () => {
    isUpdating.value = true
    await updateSingleParticipant(index, value)
    isUpdating.value = false
  }, 500) // 500ms のデバウンス
}

// 開発環境でのみデバッグログを出力
const isDev = process.env.NODE_ENV === 'development'

// ユーザーデータを読み込み
const loadUsers = async () => {
  try {
    users.value = await getActiveUserProfiles()
    if (isDev) console.log('読み込まれたユーザー数:', users.value.length)
  } catch (error) {
    console.error('ユーザーデータの読み込みに失敗:', error)
    showNotification('ユーザーデータの読み込みに失敗しました', 'error')
  }
}

// 参加者入力の更新
const updateParticipant = (index: number, value: string) => {
  localParticipants.value[index] = value
  debouncedUpdate(index, value)
}

// 本日のランチ参加可能ユーザーを取得
const fetchTodayLunchParticipants = async () => {
  message.value = ''
  hasError.value = false
  
  try {
    // 本日の日付を取得 (YYYY-MM-DD)
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (isDev) console.log('今日の日付:', today)
    
    // 日別オプションデータを確実にロード
    await loadDailyOptions()
    if (isDev) console.log('日別オプション数:', dailyOptions.value.length)
    
    // 本日のランチ参加可能ユーザーを抽出
    const todayLunchParticipants = dailyOptions.value.filter(option => {
      return option.date === today && option.lunchParticipation === 'possible'
    })
    
    if (isDev) console.log('参加可能ユーザー:', todayLunchParticipants.length)
    
    if (todayLunchParticipants.length === 0) {
      message.value = '本日のランチ会参加可能ユーザーが見つかりませんでした。'
      hasError.value = true
      showNotification('参加可能ユーザーが見つかりません', 'error')
      return
    }
    
    // ユーザー名を取得して参加者リストに設定
    const participantNames: string[] = []
    
    for (const option of todayLunchParticipants) {
      const user = users.value.find(u => u.uid === option.uid)
      if (user) {
        participantNames.push(user.displayName || user.uid)
      }
    }
    
    // 参加者名を最大20人まで設定
    const newParticipants = Array(20).fill('')
    participantNames.forEach((name, index) => {
      if (index < 20) {
        newParticipants[index] = name
      }
    })
    
    // ローカル状態とFirestoreの両方を更新
    localParticipants.value = newParticipants
    isUpdating.value = true
    
    // Firestoreに一括更新
    for (let i = 0; i < newParticipants.length; i++) {
      await updateSingleParticipant(i, newParticipants[i])
    }
    
    isUpdating.value = false
    
    message.value = `${participantNames.length}名の参加者を取得しました。`
    hasError.value = false
    showNotification(`${participantNames.length}名の参加者を取得しました`)
    
  } catch (err) {
    console.error('参加者取得エラー:', err)
    message.value = '参加者の取得に失敗しました'
    hasError.value = true
    showNotification('参加者の取得に失敗しました', 'error')
  }
}

// シャッフル実行
const shuffle = async () => {
  message.value = ''
  hasError.value = false
  
  try {
    const result = await executeShuffle()
    
    if (result.success) {
      // 成功時はFirestoreから自動同期されるため、ローカルメッセージはクリア
      message.value = ''
      hasError.value = false
      showNotification('チーム分けが完了しました！')
    } else {
      message.value = result.error || 'シャッフルに失敗しました'
      hasError.value = true
    }
  } catch (err) {
    console.error('シャッフルエラー:', err)
    message.value = 'シャッフルに失敗しました'
    hasError.value = true
  }
}

// 全クリア
const clearAllData = async () => {
  try {
    await clearAll()
    localParticipants.value = Array(20).fill('')
    message.value = ''
    hasError.value = false
    showNotification('すべてクリアしました。')
    
    // 最初の入力フィールドにフォーカス
    nextTick(() => {
      if (firstInput.value) {
        firstInput.value.focus()
      }
    })
  } catch (err) {
    console.error('クリアエラー:', err)
    showNotification('クリアに失敗しました', 'error')
  }
}

// 通知表示
const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
  notification.message = msg
  notification.type = type
  notification.show = true
  setTimeout(() => { notification.show = false }, 3000)
}

// ライフサイクル
onMounted(() => {
  // リアルタイムリスナーを開始
  startRealtimeListener()
  
  // データ読み込み
  loadDailyOptions()
  loadUsers()
  
  // 最初の入力フィールドにフォーカス
  nextTick(() => {
    if (firstInput.value) {
      firstInput.value.focus()
    }
  })
})
</script>

<style scoped>
/* 基本設定 */
:root {
  --primary-color: #4a6cf7;
  --primary-light: #edf2ff;
  --primary-hover: #3a56d4;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --info-color: #17a2b8;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --text-primary: #2b2d42;
  --text-secondary: #6c757d;
  --text-light: #8d99ae;
  --border-color: #e9ecef;
  --background-light: #f8f9fa;
  --background-white: #ffffff;
  --radius: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08);
  --transition: all 0.3s ease;
}

.page-container {
  min-height: 100vh;
  background: var(--background-light);
  padding: 0;
}

/* ヘッダー */
.header {
  background: white;
  padding: 32px 24px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 32px;
}

.header-content {
  max-width: 980px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-description {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* 入力エリア */
.input-section {
  max-width: 980px;
  margin: 0 auto 20px auto;
  padding: 0 16px;
}

.panel {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.grid {
  display: grid;
  gap: 12px;
  padding: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: white;
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
  outline: none;
}

.input::placeholder {
  color: var(--text-light);
}

.input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

/* 操作ボタン */
.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 980px;
  margin: 0 auto;
  padding: 0 16px 18px 16px;
}

.btn {
  padding: 12px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  background: white;
  color: var(--text-primary);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  box-shadow: 0 6px 20px rgba(74, 108, 247, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-success {
  border-color: var(--success-color);
  background: var(--success-color);
  color: white;
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.25);
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  border-color: #218838;
}

.btn-ghost {
  background: rgba(108, 117, 125, 0.1);
  border-color: rgba(108, 117, 125, 0.2);
  color: var(--text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(108, 117, 125, 0.2);
}

.btn-info {
  background: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
  border-color: #117a8b;
}

/* 結果表示 */
.result-content {
  padding: 12px 16px 16px;
}

.result-title {
  margin: 4px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.message {
  color: var(--text-secondary);
  margin-bottom: 6px;
  min-height: 1.5em;
  font-size: 14px;
}

.message.error {
  color: var(--danger-color);
}

/* フッター */
.footer {
  max-width: 980px;
  margin: 28px auto 48px auto;
  padding: 0 16px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

/* 通知 */
.notification {
  position: fixed;
  top: 80px; /* ヘッダー高さ(64px) + マージン(16px) */
  right: 20px;
  background: var(--success-color);
  color: white;
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.notification.error {
  background: var(--danger-color);
}

/* アイコン */
.icon {
  font-size: 16px;
  line-height: 1;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .page-container {
    padding: 0;
  }
  
  .header {
    padding: 20px 16px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .input-section,
  .actions,
  .footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .actions {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>
