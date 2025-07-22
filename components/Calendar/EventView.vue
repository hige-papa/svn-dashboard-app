<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <h1 class="app-title">TASCAL</h1>
        <p class="page-subtitle">予定の詳細</p>
      </div>
      
      <div class="view-content">
        <div class="event-header">
          <div class="event-title-section">
            <h2 class="event-title">
              <i class="mdi mdi-calendar-check icon"></i>
              {{ eventData.title }}
            </h2>
            <div class="event-priority">
              <span class="priority-badge" :class="eventData.priority">
                <i :class="getPriorityIcon(eventData.priority)" class="icon"></i>
                {{ getPriorityText(eventData.priority) }}
              </span>
            </div>
          </div>
          <div class="event-actions">
            <button type="button" @click="handleEdit" class="btn btn-secondary">
              <i class="mdi mdi-pencil icon"></i>
              編集
            </button>
            <button type="button" @click="handleDelete" class="btn btn-danger">
              <i class="mdi mdi-delete icon"></i>
              削除
            </button>
          </div>
        </div>

        <div class="event-details">
          <!-- 日時情報 -->
          <div class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-clock-outline icon"></i>
              日時
            </h3>
            <div class="detail-content">
              <div class="datetime-info">
                <div v-if="eventData.dateType === 'single'" class="datetime-item">
                  <div class="datetime-label">日付・時間</div>
                  <div class="datetime-value">
                    {{ formatDate(eventData.date ?? '') }}
                    <span class="time-range">{{ eventData.startTime }} - {{ eventData.endTime }}</span>
                  </div>
                </div>
                
                <div v-if="eventData.dateType === 'range'" class="datetime-range">
                  <div class="datetime-item">
                    <div class="datetime-label">期間</div>
                    <div class="datetime-value">
                      {{ formatDate(eventData.startDate ?? '') }} - {{ formatDate(eventData.endDate ?? '') }}
                    </div>
                  </div>
                  <div class="datetime-item">
                    <div class="datetime-label">時間</div>
                    <div class="datetime-value">
                      <span class="time-range">{{ eventData.startTime }} - {{ eventData.endTime }}</span>
                    </div>
                  </div>
                </div>
                
                <div v-if="eventData.dateType === 'recurring'" class="datetime-recurring">
                  <div class="datetime-item">
                    <div class="datetime-label">開始日</div>
                    <div class="datetime-value">{{ formatDate(eventData.recurringStartDate ?? '') }}</div>
                  </div>
                  <div class="datetime-item">
                    <div class="datetime-label">時間</div>
                    <div class="datetime-value">
                      <span class="time-range">{{ eventData.startTime }} - {{ eventData.endTime }}</span>
                    </div>
                  </div>
                  <div class="datetime-item">
                    <div class="datetime-label">繰り返しパターン</div>
                    <div class="datetime-value">
                      <span class="recurring-pattern">{{ getRecurringPatternText(eventData.recurringPattern ?? '') }}</span>
                      <span v-if="eventData.recurringPattern === 'weekly' && (eventData.selectedWeekdays ?? []).length > 0" class="weekdays">
                        （{{ getSelectedWeekdaysText(eventData.selectedWeekdays ?? []) }}）
                      </span>
                    </div>
                  </div>
                  <div v-if="eventData.recurringEndType !== 'never'" class="datetime-item">
                    <div class="datetime-label">終了条件</div>
                    <div class="datetime-value">
                      <span v-if="eventData.recurringEndType === 'date'">{{ formatDate(eventData.recurringEndDate ?? '') }}まで</span>
                      <span v-if="eventData.recurringEndType === 'count'">{{ eventData.recurringCount }}回</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 場所 -->
          <div v-if="eventData.location" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-map-marker icon"></i>
              場所
            </h3>
            <div class="detail-content">
              <p class="location-text">{{ eventData.location }}</p>
            </div>
          </div>

          <!-- 参加者 -->
          <div v-if="eventData.participants && eventData.participants.length > 0" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-account-group icon"></i>
              参加者
              <span class="count-badge">{{ eventData.participants.length }}名</span>
            </h3>
            <div class="detail-content">
              <div class="participants-list">
                <div v-for="participant in eventData.participants" :key="participant" class="participant-item">
                  <i class="mdi mdi-account icon"></i>
                  <span>{{ participant }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 施設 -->
          <div v-if="eventData.facilityIds && eventData.facilityIds.length > 0" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-office-building icon"></i>
              使用施設
              <span class="count-badge">{{ eventData.facilityIds.length }}件</span>
            </h3>
            <div class="detail-content">
              <div class="facilities-list">
                <div v-for="facilityId in eventData.facilityIds" :key="facilityId" class="facility-item">
                  <i class="mdi mdi-office-building icon"></i>
                  <span>{{ getFacilityName(facilityId) }}</span>
                  <span v-if="getFacilityCapacity(facilityId)" class="facility-info">
                    (定員: {{ getFacilityCapacity(facilityId) }}名)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 備品 -->
          <div v-if="eventData.equipmentIds && eventData.equipmentIds.length > 0" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-chair-rolling icon"></i>
              使用備品
              <span class="count-badge">{{ eventData.equipmentIds.length }}件</span>
            </h3>
            <div class="detail-content">
              <div class="equipment-list">
                <div v-for="equipmentId in eventData.equipmentIds" :key="equipmentId" class="equipment-item">
                  <i class="mdi mdi-chair-rolling icon"></i>
                  <span>{{ getEquipmentName(equipmentId) }}</span>
                  <span v-if="getEquipmentQuantity(equipmentId)" class="equipment-info">
                    (在庫: {{ getEquipmentQuantity(equipmentId) }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- メモ・説明 -->
          <div v-if="eventData.description" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-file-document-outline icon"></i>
              メモ・説明
            </h3>
            <div class="detail-content">
              <div class="description-text">{{ eventData.description }}</div>
            </div>
          </div>

          <!-- 作成・更新情報 -->
          <div v-if="eventData.createdAt || eventData.updatedAt" class="detail-section">
            <h3 class="section-title">
              <i class="mdi mdi-information icon"></i>
              作成・更新情報
            </h3>
            <div class="detail-content">
              <div class="metadata-info">
                <div v-if="eventData.createdAt" class="metadata-item">
                  <span class="metadata-label">作成日時:</span>
                  <span class="metadata-value">{{ formatDateTime(eventData.createdAt.toDate()) }}</span>
                </div>
                <div v-if="eventData.updatedAt" class="metadata-item">
                  <span class="metadata-label">最終更新:</span>
                  <span class="metadata-value">{{ formatDateTime(eventData.updatedAt.toDate()) }}</span>
                </div>
                <div v-if="eventData.createdBy" class="metadata-item">
                  <span class="metadata-label">作成者:</span>
                  <span class="metadata-value">{{ eventData.createdBy }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="view-actions">
          <button type="button" @click="handleBack" class="btn btn-secondary">
            <i class="mdi mdi-arrow-left icon"></i>
            戻る
          </button>
          <div class="action-buttons">
            <button type="button" @click="handleCopy" class="btn btn-outline">
              <i class="mdi mdi-content-copy icon"></i>
              複製
            </button>
            <button type="button" @click="handleEdit" class="btn btn-primary">
              <i class="mdi mdi-pencil icon"></i>
              編集
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
                予定を削除
              </h3>
              <button type="button" @click="closeDeleteModal" class="modal-close">
                <i class="mdi mdi-close icon"></i>
              </button>
            </div>
            <div class="modal-body">
              <p>この予定を削除してもよろしいですか？</p>
              <p class="delete-warning">「{{ eventData.title }}」</p>
              <p>この操作は取り消すことができません。</p>
            </div>
            <div class="modal-footer">
              <button type="button" @click="closeDeleteModal" class="btn btn-secondary">
                キャンセル
              </button>
              <button type="button" @click="confirmDelete" class="btn btn-danger">
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
        <i :class="getNotificationIcon()" class="icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Timestamp } from 'firebase/firestore'
import { ref, reactive, computed } from 'vue'
import { useFacility } from '~/composables/useFacility'
import { useEquipment } from '~/composables/useEquipment'

const { back } = useRouter()

interface Props {
  eventData: EventData
}

const props = defineProps<Props>()

const { getListAsync: getFacilitiesAsync } = useFacility()
const { getListAsync: getEquipmentsAsync } = useEquipment()

// 曜日定義
const weekDays = ['日', '月', '火', '水', '木', '金', '土']

// SEOメタタグ設定
useHead({
  title: `TASCAL - ${props.eventData.title}`,
  meta: [
    { name: 'description', content: `TASCALシステム - ${props.eventData.title}の詳細` }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// リアクティブデータ
const showDeleteModal = ref(false)
const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// マスタデータ（実際はAPIから取得またはpropsで受け取る）
const facilitiesMaster = ref([])

const equipmentMaster = ref([])

// ヘルパー関数
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekDays[date.getDay()]}）`
}

const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'mdi mdi-arrow-down'
    case 'medium':
      return 'mdi mdi-minus'
    case 'high':
      return 'mdi mdi-arrow-up'
    default:
      return 'mdi mdi-minus'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'low':
      return '低'
    case 'medium':
      return '中'
    case 'high':
      return '高'
    default:
      return '中'
  }
}

const getRecurringPatternText = (pattern: string) => {
  switch (pattern) {
    case 'daily':
      return '毎日'
    case 'weekly':
      return '毎週'
    case 'monthly':
      return '毎月'
    case 'yearly':
      return '毎年'
    case 'weekdays':
      return '平日のみ'
    case 'custom':
      return 'カスタム'
    default:
      return ''
  }
}

const getSelectedWeekdaysText = (selectedWeekdays: number[]) => {
  return selectedWeekdays.map(index => weekDays[index]).join('、')
}

const getFacilityName = (id: string) => {
  const facility = facilitiesMaster.value.find(f => f.id === id)
  return facility?.name || '不明な施設'
}

const getFacilityCapacity = (id: string) => {
  const facility = facilitiesMaster.value.find(f => f.id === id)
  return facility?.capacity
}

const getEquipmentName = (id: string) => {
  const equipment = equipmentMaster.value.find(e => e.id === id)
  return equipment?.name || '不明な備品'
}

const getEquipmentQuantity = (id: string) => {
  const equipment = equipmentMaster.value.find(e => e.id === id)
  return equipment?.quantity
}

const getNotificationIcon = () => {
  return notification.type === 'success' ? 'mdi mdi-check' : 'mdi mdi-alert'
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

const emit = defineEmits<{
  (event: 'edit', data: EventData): void
  (event: 'delete', id: string): void
  (event: 'copy', data: EventData): void
}>()

// アクション関数
const handleBack = () => {
  back()
}

const handleEdit = () => {
  emit('edit', props.eventData)
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const handleCopy = () => {
  emit('copy', { ...props.eventData, id: undefined })
  showNotification('予定が複製されました')
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const confirmDelete = () => {
  if (props.eventData.id) {
    emit('delete', props.eventData.id)
    showNotification('予定が削除されました')
  }
  closeDeleteModal()
}

onMounted(() => {
  getEquipmentsAsync().then(equipments => {
    equipmentMaster.value = equipments.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      capacity: equipment.capacity,
    }))
  })
  getFacilitiesAsync().then(facilities => {
    facilitiesMaster.value = facilities.map(facility => ({
      id: facility.id,
      name: facility.name,
      capacity: facility.capacity,
    }))
  })
})
</script>

<style scoped>
.page-container {
  background-color: var(--background-light);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  padding: 24px;
}

.container {
  max-width: 900px;
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

.view-content {
  padding: 40px;
}

.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.event-title-section {
  flex: 1;
}

.event-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-priority {
  margin-top: 8px;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.priority-badge.low {
  background-color: var(--success-light);
  color: var(--success-color);
}

.priority-badge.medium {
  background-color: var(--warning-light);
  color: var(--warning-color);
}

.priority-badge.high {
  background-color: var(--danger-light);
  color: var(--danger-color);
}

.event-actions {
  display: flex;
  gap: 12px;
}

.event-details {
  display: grid;
  gap: 32px;
}

.detail-section {
  background-color: var(--background-light);
  border-radius: var(--radius-md);
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.detail-content {
  color: var(--text-secondary);
}

/* 日時情報 */
.datetime-info {
  display: grid;
  gap: 16px;
}

.datetime-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: center;
}

.datetime-label {
  font-weight: 500;
  color: var(--text-primary);
}

.datetime-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.time-range {
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
  margin-left: 8px;
}

.recurring-pattern {
  background-color: var(--accent-light);
  color: var(--accent-color);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
}

.weekdays {
  font-size: 14px;
  color: var(--text-secondary);
  margin-left: 8px;
}

/* 場所 */
.location-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 参加者・施設・備品リスト */
.participants-list,
.facilities-list,
.equipment-list {
  display: grid;
  gap: 8px;
}

.participant-item,
.facility-item,
.equipment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--background-white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.facility-info,
.equipment-info {
  font-size: 12px;
  color: var(--text-light);
  margin-left: auto;
}

/* 説明 */
.description-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* メタデータ */
.metadata-info {
  display: grid;
  gap: 8px;
}

.metadata-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
}

.metadata-label {
  font-weight: 500;
  color: var(--text-primary);
}

.metadata-value {
  color: var(--text-secondary);
}

/* アクションボタン */
.view-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
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

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

/* 修正後の正しいスタイル */
.btn-danger {
  background-color: var(--danger-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-danger:hover {
  transform: translateY(-1px);
}

/* モーダル */
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
  max-width: 400px;
  width: 100%;
}

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
  color: var(--danger-color);
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
}

.delete-warning {
  font-weight: 600;
  color: var(--danger-color);
  background-color: var(--danger-light);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin: 12px 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

/* 通知 */
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
  z-index: 1000;
}

.notification.error {
  background-color: var(--danger-color);
}

.icon {
  font-size: 16px;
  line-height: 1;
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

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .page-container {
    padding: 12px;
  }
  
  .container {
    border-radius: var(--radius-md);
  }
  
  .header {
    padding: 24px 20px;
  }
  
  .view-content {
    padding: 24px 20px;
  }
  
  .event-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .event-actions {
    justify-content: stretch;
  }
  
  .event-actions .btn {
    flex: 1;
    justify-content: center;
  }
  
  .datetime-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .view-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .action-buttons .btn {
    flex: 1;
    justify-content: center;
  }
  
  .detail-section {
    padding: 20px;
  }
  
  .modal-container {
    margin: 20px;
  }
}

/* CSS変数の定義 */
:root {
  --primary-color: #4361ee;
  --primary-hover: #3651db;
  --primary-light: #e8f0fe;
  --accent-color: #7209b7;
  --accent-light: #f3e8ff;
  --success-color: #16a085;
  --success-light: #d4edda;
  --warning-color: #f39c12;
  --warning-light: #fff3cd;
  --danger-color: #e74c3c;
  --danger-hover: #c0392b;
  --danger-light: #f8d7da;
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --text-light: #adb5bd;
  --background-white: #ffffff;
  --background-light: #f8f9fa;
  --border-color: #dee2e6;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease-in-out;
}
</style>