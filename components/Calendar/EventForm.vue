<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <h1 class="app-title">TASCAL</h1>
        <p class="page-subtitle">新しい予定を登録</p>
      </div>
      
      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group" :class="{ error: errors.eventTitle }">
            <label class="form-label" for="eventTitle">
              <i class="mdi mdi-pencil icon"></i>
              予定タイトル
              <span class="required">*</span>
            </label>
            <input 
              id="eventTitle"
              v-model="formData.title"
              type="text" 
              class="form-input" 
              placeholder="例：重要な会議、プロジェクト打ち合わせ"
              @blur="validateField('eventTitle')"
              @input="clearError('eventTitle')"
            >
            <div v-if="errors.eventTitle" class="form-error">{{ errors.eventTitle }}</div>
          </div>

          <!-- 日付タイプ選択 -->
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-calendar-multiple icon"></i>
              日付タイプ
              <span class="required">*</span>
            </label>
            <div class="date-type-options">
              <div class="date-type-option">
                <input 
                  id="dateTypeSingle" 
                  v-model="formData.dateType"
                  type="radio" 
                  name="dateType" 
                  value="single" 
                  class="date-type-radio"
                  @change="clearConflicts"
                >
                <label for="dateTypeSingle" class="date-type-label">
                  <i class="mdi mdi-calendar icon"></i>
                  単一日
                </label>
              </div>
              <div class="date-type-option">
                <input 
                  id="dateTypeRange" 
                  v-model="formData.dateType"
                  type="radio" 
                  name="dateType" 
                  value="range" 
                  class="date-type-radio"
                  @change="clearConflicts"
                >
                <label for="dateTypeRange" class="date-type-label">
                  <i class="mdi mdi-calendar-range icon"></i>
                  期間
                </label>
              </div>
              <div class="date-type-option">
                <input 
                  id="dateTypeRecurring" 
                  v-model="formData.dateType"
                  type="radio" 
                  name="dateType" 
                  value="recurring" 
                  class="date-type-radio"
                  @change="clearConflicts"
                >
                <label for="dateTypeRecurring" class="date-type-label">
                  <i class="mdi mdi-calendar-sync icon"></i>
                  繰り返し
                </label>
              </div>
            </div>
          </div>
          
          <!-- 単一日の場合 -->
          <div v-if="formData.dateType === 'single'" class="form-group row">
            <div class="form-group" :class="{ error: errors.eventDate }">
              <label class="form-label" for="eventDate">
                <i class="mdi mdi-calendar icon"></i>
                日付
                <span class="required">*</span>
              </label>
              <input 
                id="eventDate"
                v-model="formData.date"
                type="date" 
                class="form-input"
                @blur="validateField('eventDate')"
                @input="clearError('eventDate')"
                @change="checkConflicts"
              >
              <div v-if="errors.eventDate" class="form-error">{{ errors.eventDate }}</div>
            </div>
            
            <div class="form-group" :class="{ error: errors.time }">
              <label class="form-label">
                <i class="mdi mdi-clock-outline icon"></i>
                時間
                <span class="required">*</span>
              </label>
              <div class="time-inputs">
                <input 
                  id="startTime"
                  v-model="formData.startTime"
                  type="time" 
                  class="form-input"
                  @blur="validateTimeFields"
                  @input="clearError('time')"
                  @change="checkConflicts"
                >
                <span class="time-separator">〜</span>
                <input 
                  id="endTime"
                  v-model="formData.endTime"
                  type="time" 
                  class="form-input"
                  @blur="validateTimeFields"
                  @input="clearError('time')"
                  @change="checkConflicts"
                >
              </div>
              <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
            </div>
          </div>

          <!-- 期間の場合 -->
          <div v-if="formData.dateType === 'range'" class="date-range-section">
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.startDate }">
                <label class="form-label" for="startDate">
                  <i class="mdi mdi-calendar-start icon"></i>
                  開始日
                  <span class="required">*</span>
                </label>
                <input 
                  id="startDate"
                  v-model="formData.startDate"
                  type="date" 
                  class="form-input"
                  @blur="validateField('startDate')"
                  @input="clearError('startDate')"
                  @change="checkConflicts"
                >
                <div v-if="errors.startDate" class="form-error">{{ errors.startDate }}</div>
              </div>
              
              <div class="form-group" :class="{ error: errors.endDate }">
                <label class="form-label" for="endDate">
                  <i class="mdi mdi-calendar-end icon"></i>
                  終了日
                  <span class="required">*</span>
                </label>
                <input 
                  id="endDate"
                  v-model="formData.endDate"
                  type="date" 
                  class="form-input"
                  :min="formData.startDate"
                  @blur="validateField('endDate')"
                  @input="clearError('endDate')"
                  @change="checkConflicts"
                >
                <div v-if="errors.endDate" class="form-error">{{ errors.endDate }}</div>
              </div>
            </div>
            
            <div class="form-group" :class="{ error: errors.time }">
              <label class="form-label">
                <i class="mdi mdi-clock-outline icon"></i>
                時間
                <span class="required">*</span>
              </label>
              <div class="time-inputs">
                <input 
                  v-model="formData.startTime"
                  type="time" 
                  class="form-input"
                  @blur="validateTimeFields"
                  @input="clearError('time')"
                  @change="checkConflicts"
                >
                <span class="time-separator">〜</span>
                <input 
                  v-model="formData.endTime"
                  type="time" 
                  class="form-input"
                  @blur="validateTimeFields"
                  @input="clearError('time')"
                  @change="checkConflicts"
                >
              </div>
              <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
            </div>
          </div>

          <!-- 繰り返しの場合 -->
          <div v-if="formData.dateType === 'recurring'" class="recurring-section">
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.recurringStartDate }">
                <label class="form-label" for="recurringStartDate">
                  <i class="mdi mdi-calendar-start icon"></i>
                  開始日
                  <span class="required">*</span>
                </label>
                <input 
                  id="recurringStartDate"
                  v-model="formData.recurringStartDate"
                  type="date" 
                  class="form-input"
                  @blur="validateField('recurringStartDate')"
                  @input="clearError('recurringStartDate')"
                  @change="checkConflicts"
                >
                <div v-if="errors.recurringStartDate" class="form-error">{{ errors.recurringStartDate }}</div>
              </div>
              
              <div class="form-group" :class="{ error: errors.time }">
                <label class="form-label">
                  <i class="mdi mdi-clock-outline icon"></i>
                  時間
                  <span class="required">*</span>
                </label>
                <div class="time-inputs">
                  <input 
                    v-model="formData.startTime"
                    type="time" 
                    class="form-input"
                    @blur="validateTimeFields"
                    @input="clearError('time')"
                    @change="checkConflicts"
                  >
                  <span class="time-separator">〜</span>
                  <input 
                    v-model="formData.endTime"
                    type="time" 
                    class="form-input"
                    @blur="validateTimeFields"
                    @input="clearError('time')"
                    @change="checkConflicts"
                  >
                </div>
                <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
              </div>
            </div>

            <!-- 繰り返しパターン -->
            <div class="form-group">
              <label class="form-label">
                <i class="mdi mdi-repeat icon"></i>
                繰り返しパターン
                <span class="required">*</span>
              </label>
              <select v-model="formData.recurringPattern" class="form-select" @change="checkConflicts">
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
                <option value="weekdays">平日のみ</option>
                <option value="custom">カスタム</option>
              </select>
            </div>

            <!-- 曜日選択（週単位の場合） -->
            <div v-if="formData.recurringPattern === 'weekly' || formData.recurringPattern === 'custom'" class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-week icon"></i>
                曜日を選択
              </label>
              <div class="weekday-options">
                <div v-for="(day, index) in weekDays" :key="index" class="weekday-option">
                  <input 
                    :id="`weekday-${index}`"
                    v-model="formData.selectedWeekdays"
                    type="checkbox" 
                    :value="index"
                    class="weekday-checkbox"
                    @change="checkConflicts"
                  >
                  <label :for="`weekday-${index}`" class="weekday-label">
                    {{ day }}
                  </label>
                </div>
              </div>
            </div>

            <!-- 日付選択（月単位の場合） -->
            <div v-if="formData.recurringPattern === 'monthly'" class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-month icon"></i>
                毎月の日付
              </label>
              <div class="monthly-options">
                <div class="monthly-option">
                  <input 
                    id="monthlyDate" 
                    v-model="formData.monthlyType"
                    type="radio" 
                    name="monthlyType" 
                    value="date" 
                    class="monthly-radio"
                    @change="checkConflicts"
                  >
                  <label for="monthlyDate" class="monthly-label">
                    <input 
                      v-model="formData.monthlyDate"
                      type="number" 
                      min="1" 
                      max="31" 
                      class="form-input monthly-input"
                      :disabled="formData.monthlyType !== 'date'"
                      @change="checkConflicts"
                    >
                    日
                  </label>
                </div>
                <div class="monthly-option">
                  <input 
                    id="monthlyWeek" 
                    v-model="formData.monthlyType"
                    type="radio" 
                    name="monthlyType" 
                    value="weekday" 
                    class="monthly-radio"
                    @change="checkConflicts"
                  >
                  <label for="monthlyWeek" class="monthly-label">
                    第
                    <select 
                      v-model="formData.monthlyWeek"
                      class="form-select monthly-select"
                      :disabled="formData.monthlyType !== 'weekday'"
                      @change="checkConflicts"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="-1">最終</option>
                    </select>
                    <select 
                      v-model="formData.monthlyWeekday"
                      class="form-select monthly-select"
                      :disabled="formData.monthlyType !== 'weekday'"
                      @change="checkConflicts"
                    >
                      <option v-for="(day, index) in weekDays" :key="index" :value="index">
                        {{ day }}
                      </option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <!-- 繰り返し終了条件 -->
            <div class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-remove icon"></i>
                終了条件
              </label>
              <div class="end-condition-options">
                <div class="end-condition-option">
                  <input 
                    id="endNever" 
                    v-model="formData.recurringEndType"
                    type="radio" 
                    name="recurringEndType" 
                    value="never" 
                    class="end-condition-radio"
                    @change="checkConflicts"
                  >
                  <label for="endNever" class="end-condition-label">
                    終了日なし
                  </label>
                </div>
                <div class="end-condition-option">
                  <input 
                    id="endDate" 
                    v-model="formData.recurringEndType"
                    type="radio" 
                    name="recurringEndType" 
                    value="date" 
                    class="end-condition-radio"
                    @change="checkConflicts"
                  >
                  <label for="endDate" class="end-condition-label">
                    終了日:
                    <input 
                      v-model="formData.recurringEndDate"
                      type="date" 
                      class="form-input end-date-input"
                      :min="formData.recurringStartDate"
                      :disabled="formData.recurringEndType !== 'date'"
                      @change="checkConflicts"
                    >
                  </label>
                </div>
                <div class="end-condition-option">
                  <input 
                    id="endCount" 
                    v-model="formData.recurringEndType"
                    type="radio" 
                    name="recurringEndType" 
                    value="count" 
                    class="end-condition-radio"
                    @change="checkConflicts"
                  >
                  <label for="endCount" class="end-condition-label">
                    回数:
                    <input 
                      v-model="formData.recurringCount"
                      type="number" 
                      min="1" 
                      max="999" 
                      class="form-input count-input"
                      :disabled="formData.recurringEndType !== 'count'"
                      @change="checkConflicts"
                    >
                    回
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="eventLocation">
              <i class="mdi mdi-map-marker icon"></i>
              場所
            </label>
            <input 
              id="eventLocation"
              v-model="formData.location"
              type="text" 
              class="form-input" 
              placeholder="例：会議室A、オンライン、顧客先"
            >
          </div>
          
          <!-- 参加者選択 -->
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-account-group icon"></i>
              参加者
            </label>
            <div class="master-select-section">
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
                参加者を選択してください（複数選択可）
              </p>
              <div class="master-select-wrapper">
                <div class="selected-items">
                  <div 
                    v-for="participant in selectedParticipantsData" 
                    :key="participant.id" 
                    class="selected-tag"
                  >
                    <span>{{ participant.name }}</span>
                    <button 
                      type="button" 
                      @click="removeParticipant(participant.id)" 
                      class="tag-remove"
                    >×</button>
                  </div>
                  <button 
                    type="button" 
                    @click="openParticipantModal" 
                    class="btn-select-master"
                  >
                    <i class="mdi mdi-plus icon"></i>
                    参加者を追加
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 施設選択 -->
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-office-building icon"></i>
              施設
            </label>
            <div class="master-select-section">
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
                使用する施設を選択してください（複数選択可）
              </p>
              <div class="master-select-wrapper">
                <div class="selected-items">
                  <div 
                    v-for="facility in selectedFacilitiesData" 
                    :key="facility.id" 
                    class="selected-tag"
                  >
                    <span>{{ facility.name }}</span>
                    <span v-if="facility.capacity" class="tag-info">(定員: {{ facility.capacity }}名)</span>
                    <button 
                      type="button" 
                      @click="removeFacility(facility.id)" 
                      class="tag-remove"
                    >×</button>
                  </div>
                  <button 
                    type="button" 
                    @click="openFacilityModal" 
                    class="btn-select-master"
                  >
                    <i class="mdi mdi-plus icon"></i>
                    施設を追加
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 備品選択 -->
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-chair-rolling icon"></i>
              備品
            </label>
            <div class="master-select-section">
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
                使用する備品を選択してください（複数選択可）
              </p>
              <div class="master-select-wrapper">
                <div class="selected-items">
                  <div 
                    v-for="equipment in selectedEquipmentData" 
                    :key="equipment.id" 
                    class="selected-tag"
                  >
                    <span>{{ equipment.name }}</span>
                    <span v-if="equipment.quantity" class="tag-info">(在庫: {{ equipment.quantity }})</span>
                    <button 
                      type="button" 
                      @click="removeEquipment(equipment.id)" 
                      class="tag-remove"
                    >×</button>
                  </div>
                  <button 
                    type="button" 
                    @click="openEquipmentModal" 
                    class="btn-select-master"
                  >
                    <i class="mdi mdi-plus icon"></i>
                    備品を追加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 重複チェック結果 -->
          <div v-if="conflicts.length > 0" class="conflicts-section">
            <div class="conflicts-header">
              <i class="mdi mdi-alert icon"></i>
              <span>重複する予定があります</span>
            </div>
            <div class="conflicts-list">
              <div v-for="(conflict, index) in conflicts" :key="index" class="conflict-item">
                <div class="conflict-type">
                  <i :class="getConflictIcon(conflict.type)" class="icon"></i>
                  {{ getConflictTypeName(conflict.type) }}
                </div>
                <div class="conflict-details">
                  <div class="conflict-name">{{ conflict.name }}</div>
                  <div class="conflict-info">
                    <span class="conflict-date">{{ formatDate(conflict.date) }}</span>
                    <span class="conflict-time">{{ conflict.startTime }} - {{ conflict.endTime }}</span>
                  </div>
                  <div class="conflict-event">予定: {{ conflict.eventTitle }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-flag icon"></i>
              優先度
            </label>
            <div class="priority-options">
              <div class="priority-option">
                <input 
                  id="priorityLow" 
                  v-model="formData.priority"
                  type="radio" 
                  name="priority" 
                  value="low" 
                  class="priority-radio"
                >
                <label for="priorityLow" class="priority-label low">
                  <i class="mdi mdi-arrow-down icon"></i>
                  低
                </label>
              </div>
              <div class="priority-option">
                <input 
                  id="priorityMedium" 
                  v-model="formData.priority"
                  type="radio" 
                  name="priority" 
                  value="medium" 
                  class="priority-radio"
                >
                <label for="priorityMedium" class="priority-label medium">
                  <i class="mdi mdi-minus icon"></i>
                  中
                </label>
              </div>
              <div class="priority-option">
                <input 
                  id="priorityHigh" 
                  v-model="formData.priority"
                  type="radio" 
                  name="priority" 
                  value="high" 
                  class="priority-radio"
                >
                <label for="priorityHigh" class="priority-label high">
                  <i class="mdi mdi-arrow-up icon"></i>
                  高
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="eventDescription">
              <i class="mdi mdi-file-document-outline icon"></i>
              メモ・説明
            </label>
            <textarea 
              id="eventDescription"
              v-model="formData.description"
              class="form-textarea" 
              placeholder="予定の詳細情報や議題などを記入してください..."
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn btn-secondary">
              <i class="mdi mdi-close icon"></i>
              キャンセル
            </button>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              <i v-if="isLoading" class="mdi mdi-loading icon loading-spin"></i>
              <i v-else class="mdi mdi-content-save icon"></i>
              {{ isLoading ? '保存中...' : '予定を保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 選択モーダル -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title">
                <i :class="getModalIcon()" class="icon"></i>
                {{ getModalTitle() }}
              </h3>
              <button type="button" @click="closeModal" class="modal-close">
                <i class="mdi mdi-close icon"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="search-box">
                <i class="mdi mdi-magnify icon"></i>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  class="search-input" 
                  :placeholder="getSearchPlaceholder()"
                >
              </div>
              <div class="selection-list">
                <div v-if="filteredItems.length === 0" class="no-results">
                  検索結果がありません
                </div>
                <label 
                  v-for="item in filteredItems" 
                  :key="item.id" 
                  class="selection-item"
                  :class="{ disabled: item.isConflict }"
                >
                  <input 
                    type="checkbox" 
                    :value="item.id"
                    :checked="isItemSelected(item.id)"
                    :disabled="item.isConflict"
                    @change="toggleItem(item.id)"
                    class="selection-checkbox"
                  >
                  <div class="selection-info">
                    <div class="selection-name">{{ item.name }}</div>
                    <div v-if="item.department" class="selection-meta">{{ item.department }}</div>
                    <div v-if="item.capacity" class="selection-meta">定員: {{ item.capacity }}名</div>
                    <div v-if="item.quantity" class="selection-meta">在庫: {{ item.quantity }}</div>
                    <div v-if="item.isConflict" class="selection-conflict">
                      <i class="mdi mdi-alert icon"></i>
                      {{ item.conflictInfo }}
                    </div>
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
        </div>
      </Transition>
    </Teleport>
    
    <!-- 通知 -->
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i class="mdi mdi-check icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { useMaster } from '~/composables/master/useMaster'

const { back } = useRouter()

const { getListAsync: getUsersAsync } = useMaster('users')

interface Props {
  initialData?: EventFormData
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({
    title: '',
    dateType: 'single',
    date: '',
    startDate: '',
    endDate: '',
    recurringStartDate: '',
    recurringPattern: 'weekly',
    selectedWeekdays: [],
    monthlyType: 'date',
    monthlyDate: 1,
    monthlyWeek: '1',
    monthlyWeekday: 1,
    recurringEndType: 'never',
    recurringEndDate: '',
    recurringCount: 10,
    startTime: '',
    endTime: '',
    location: '',
    participantIds: [],
    participants: [],
    facilityIds: [],
    equipmentIds: [],
    priority: 'low',
    description: ''
  })
})

// 曜日定義
const weekDays = ['日', '月', '火', '水', '木', '金', '土']

// SEOメタタグ設定
useHead({
  title: 'TASCAL - 予定登録',
  meta: [
    { name: 'description', content: 'TASCALシステムで新しい予定を登録できます' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// リアクティブデータ
const formData = reactive<EventFormData>({
  title: '',
  dateType: 'single',
  // 単一日
  date: '',
  // 期間
  startDate: '',
  endDate: '',
  // 繰り返し
  recurringStartDate: '',
  recurringPattern: 'weekly',
  selectedWeekdays: [],
  monthlyType: 'date',
  monthlyDate: 1,
  monthlyWeek: '1',
  monthlyWeekday: 1,
  recurringEndType: 'never',
  recurringEndDate: '',
  recurringCount: 10,
  // 共通
  startTime: '',
  endTime: '',
  location: '',
  participantIds: [],
  participants: [],
  facilityIds: [],
  equipmentIds: [],
  priority: 'low',
  description: ''
})

const errors = reactive<EventFormErrors>({})
const isLoading = ref(false)
const conflicts = ref<EventFormConflict[]>([])
const notification = reactive<EventFormNotification>({
  show: false,
  message: '',
  type: 'success'
})

// モーダル関連
const showModal = ref(false)
const modalType = ref<ModalType>(null)
const searchQuery = ref('')
const tempSelection = ref<string[]>([])

// マスタデータ（実際はAPIから取得）
// const participantsMaster = ref<MasterItem[]>([
//   { id: '1', name: '山田太郎', department: '営業部' },
//   { id: '2', name: '佐藤花子', department: '総務部' },
//   { id: '3', name: '鈴木一郎', department: '開発部' },
//   { id: '4', name: '田中美咲', department: '営業部' },
//   { id: '5', name: '高橋健太', department: '開発部' },
// ])
const participantsMaster = ref<MasterItem[]>([])

const facilitiesMaster = ref<MasterItem[]>([
  { id: '1', name: '会議室A', capacity: 10 },
  { id: '2', name: '会議室B', capacity: 20 },
  { id: '3', name: '大会議室', capacity: 50 },
  { id: '4', name: '応接室1', capacity: 6 },
  { id: '5', name: '応接室2', capacity: 8 },
])

const equipmentMaster = ref<MasterItem[]>([
  { id: '1', name: 'プロジェクター', quantity: 5 },
  { id: '2', name: 'ホワイトボード', quantity: 10 },
  { id: '3', name: 'ノートPC', quantity: 15 },
  { id: '4', name: 'マイク', quantity: 8 },
  { id: '5', name: 'ビデオカメラ', quantity: 3 },
])

// 選択されたアイテムのデータ
const selectedParticipantsData = computed(() => 
  participantsMaster.value.filter(p => formData.participantIds.includes(p.id))
)

const selectedFacilitiesData = computed(() => 
  facilitiesMaster.value.filter(f => formData.facilityIds.includes(f.id))
)

const selectedEquipmentData = computed(() => 
  equipmentMaster.value.filter(e => formData.equipmentIds.includes(e.id))
)

// フィルタリングされたアイテム
const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase()
  let items: MasterItem[] = []
  
  switch (modalType.value) {
    case 'participant':
      items = participantsMaster.value
      break
    case 'facility':
      items = facilitiesMaster.value
      break
    case 'equipment':
      items = equipmentMaster.value
      break
  }
  
  if (!query) return items
  
  return items.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.department?.toLowerCase().includes(query)
  )
})

// デフォルト値設定
const setDefaultValues = (form?: EventFormData) => { 
  Object.assign(formData, {
    title: form?.title ?? '',
    dateType: form?.dateType ?? 'single',
    date: form?.date ?? '',
    startDate: form?.startDate ?? '',
    endDate: form?.endDate ?? '',
    recurringStartDate: form?.recurringStartDate ?? '',
    recurringPattern: form?.recurringPattern ?? 'weekly',
    selectedWeekdays: form?.selectedWeekdays ?? [],
    monthlyType: form?.monthlyType ?? 'date',
    monthlyDate: form?.monthlyDate ?? 1,
    monthlyWeek: form?.monthlyWeek ?? '1',
    monthlyWeekday: form?.monthlyWeekday ?? 1,
    recurringEndType: form?.recurringEndType ?? 'never',
    recurringEndDate: form?.recurringEndDate ?? '',
    recurringCount: form?.recurringCount ?? 10,
    startTime: form?.startTime ?? '',
    endTime: form?.endTime ?? '',
    location: form?.location ?? '',
    participantIds: form?.participantIds ?? [],
    participants: form?.participants ?? [],
    facilityIds: form?.facilityIds ?? [],
    equipmentIds: form?.equipmentIds ?? [],
    priority: form?.priority ?? 'low',
    description: form?.description ?? ''
  })

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  formData.date = today
  formData.startDate = today
  formData.endDate = today
  formData.recurringStartDate = today
  
  // 現在時刻から1時間後を開始時間に設定
  const startTime = new Date(now.getTime() + 60 * 60 * 1000)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
  
  formData.startTime = startTime.toTimeString().slice(0, 5)
  formData.endTime = endTime.toTimeString().slice(0, 5)
  
  // 繰り返しの終了日を3ヶ月後に設定
  const threeMonthsLater = new Date(now)
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
  formData.recurringEndDate = threeMonthsLater.toISOString().split('T')[0]
}

// モーダル関連の関数
const openParticipantModal = () => {
  modalType.value = 'participant'
  tempSelection.value = [...formData.participantIds]
  showModal.value = true
}

const openFacilityModal = () => {
  modalType.value = 'facility'
  tempSelection.value = [...formData.facilityIds]
  showModal.value = true
}

const openEquipmentModal = () => {
  modalType.value = 'equipment'
  tempSelection.value = [...formData.equipmentIds]
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  searchQuery.value = ''
  tempSelection.value = []
}

const confirmSelection = () => {
  switch (modalType.value) {
    case 'participant':
      formData.participantIds = [...tempSelection.value]
      const selectedParticipants = participantsMaster.value.filter(p => tempSelection.value.includes(p.id))
      formData.participants = selectedParticipants.map(p => p.name)
      break
    case 'facility':
      formData.facilityIds = [...tempSelection.value]
      break
    case 'equipment':
      formData.equipmentIds = [...tempSelection.value]
      break
  }
  checkConflicts()
  closeModal()
}

const isItemSelected = (id: string) => {
  return tempSelection.value.includes(id)
}

const toggleItem = (id: string) => {
  const index = tempSelection.value.indexOf(id)
  if (index > -1) {
    tempSelection.value.splice(index, 1)
  } else {
    tempSelection.value.push(id)
  }
}

const removeParticipant = (id: string) => {
  const index = formData.participantIds.indexOf(id)
  if (index > -1) {
    formData.participantIds.splice(index, 1)
    checkConflicts()
  }
}

const removeFacility = (id: string) => {
  const index = formData.facilityIds.indexOf(id)
  if (index > -1) {
    formData.facilityIds.splice(index, 1)
    checkConflicts()
  }
}

const removeEquipment = (id: string) => {
  const index = formData.equipmentIds.indexOf(id)
  if (index > -1) {
    formData.equipmentIds.splice(index, 1)
    checkConflicts()
  }
}

// モーダル関連のヘルパー関数
const getModalIcon = () => {
  switch (modalType.value) {
    case 'participant':
      return 'mdi mdi-account-group'
    case 'facility':
      return 'mdi mdi-office-building'
    case 'equipment':
      return 'mdi mdi-chair-rolling'
    default:
      return ''
  }
}

const getModalTitle = () => {
  switch (modalType.value) {
    case 'participant':
      return '参加者を選択'
    case 'facility':
      return '施設を選択'
    case 'equipment':
      return '備品を選択'
    default:
      return ''
  }
}

const getSearchPlaceholder = () => {
  switch (modalType.value) {
    case 'participant':
      return '名前や部署で検索...'
    case 'facility':
      return '施設名で検索...'
    case 'equipment':
      return '備品名で検索...'
    default:
      return '検索...'
  }
}

// 重複チェック
const checkConflicts = async () => {
  // デバウンス処理
  await nextTick()
  
  // 実際のAPIコールをここに実装
  // const response = await $fetch('/api/events/check-conflicts', {
  //   method: 'POST',
  //   body: formData
  // })
  
  // モックデータ
  const mockConflicts: EventFormConflict[] = []
  
  // 選択された参加者・施設・備品に対して仮の重複チェック
  if (formData.participantIds.includes('1') && formData.startTime === '10:00') {
    mockConflicts.push({
      type: 'participant',
      id: '1',
      name: '山田太郎',
      date: formData.date || formData.startDate,
      startTime: '10:00',
      endTime: '11:00',
      eventTitle: '営業会議'
    })
  }
  
  if (formData.facilityIds.includes('1') && formData.startTime === '14:00') {
    mockConflicts.push({
      type: 'facility',
      id: '1',
      name: '会議室A',
      date: formData.date || formData.startDate,
      startTime: '14:00',
      endTime: '15:00',
      eventTitle: '企画会議'
    })
  }
  
  conflicts.value = mockConflicts
  
  // マスタデータに重複情報を反映
  updateMasterConflicts()
}

const updateMasterConflicts = () => {
  // 参加者の重複チェック結果を反映
  participantsMaster.value.forEach(participant => {
    const conflict = conflicts.value.find(c => c.type === 'participant' && c.id === participant.id)
    if (conflict) {
      participant.isConflict = true
      participant.conflictInfo = `${conflict.startTime}-${conflict.endTime} ${conflict.eventTitle}`
    } else {
      participant.isConflict = false
      participant.conflictInfo = ''
    }
  })
  
  // 施設の重複チェック結果を反映
  facilitiesMaster.value.forEach(facility => {
    const conflict = conflicts.value.find(c => c.type === 'facility' && c.id === facility.id)
    if (conflict) {
      facility.isConflict = true
      facility.conflictInfo = `${conflict.startTime}-${conflict.endTime} ${conflict.eventTitle}`
    } else {
      facility.isConflict = false
      facility.conflictInfo = ''
    }
  })
  
  // 備品の重複チェック結果を反映
  equipmentMaster.value.forEach(equipment => {
    const conflict = conflicts.value.find(c => c.type === 'equipment' && c.id === equipment.id)
    if (conflict) {
      equipment.isConflict = true
      equipment.conflictInfo = `${conflict.startTime}-${conflict.endTime} ${conflict.eventTitle}`
    } else {
      equipment.isConflict = false
      equipment.conflictInfo = ''
    }
  })
}

const clearConflicts = () => {
  conflicts.value = []
  updateMasterConflicts()
}

const getConflictIcon = (type: string) => {
  switch (type) {
    case 'participant':
      return 'mdi mdi-account-alert'
    case 'facility':
      return 'mdi mdi-office-building-alert'
    case 'equipment':
      return 'mdi mdi-alert-box'
    default:
      return 'mdi mdi-alert'
  }
}

const getConflictTypeName = (type: string) => {
  switch (type) {
    case 'participant':
      return '参加者の重複'
    case 'facility':
      return '施設の重複'
    case 'equipment':
      return '備品の重複'
    default:
      return '重複'
  }
}

const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

// バリデーション
const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'eventTitle':
      if (!formData.title.trim()) {
        errors.eventTitle = '予定タイトルを入力してください'
      }
      break
    case 'eventDate':
      if (!formData.date) {
        errors.eventDate = '日付を選択してください'
      }
      break
    case 'startDate':
      if (!formData.startDate) {
        errors.startDate = '開始日を選択してください'
      }
      break
    case 'endDate':
      if (!formData.endDate) {
        errors.endDate = '終了日を選択してください'
      } else if (formData.startDate && formData.endDate < formData.startDate) {
        errors.endDate = '終了日は開始日以降を選択してください'
      }
      break
    case 'recurringStartDate':
      if (!formData.recurringStartDate) {
        errors.recurringStartDate = '開始日を選択してください'
      }
      break
  }
}

const validateTimeFields = () => {
  if (!formData.startTime || !formData.endTime) {
    errors.time = '開始時間と終了時間を入力してください'
  } else if (formData.startTime >= formData.endTime) {
    errors.time = '終了時間は開始時間より後に設定してください'
  }
}

const validateForm = (): boolean => {
  // エラーをクリア
  Object.keys(errors).forEach(key => {
    delete errors[key as keyof EventFormErrors]
  })
  
  // 必須フィールドチェック
  validateField('eventTitle')
  
  // 日付タイプに応じたバリデーション
  switch (formData.dateType) {
    case 'single':
      validateField('eventDate')
      break
    case 'range':
      validateField('startDate')
      validateField('endDate')
      break
    case 'recurring':
      validateField('recurringStartDate')
      // 週単位の場合、曜日が選択されているかチェック
      if (formData.recurringPattern === 'weekly' && formData.selectedWeekdays.length === 0) {
        showNotification('曜日を選択してください', 'error')
        return false
      }
      break
  }
  
  validateTimeFields()
  
  return Object.keys(errors).length === 0
}

const clearError = (fieldName: keyof EventFormErrors) => {
  if (errors[fieldName]) {
    delete errors[fieldName]
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

const emit = defineEmits<{
  (event: 'submit', data: EventFormData): void
}>()

// フォーム処理
const handleSubmit = async () => {
  if (!validateForm()) {
    showNotification('入力内容を確認してください', 'error')
    return
  }
  
  // 重複がある場合の確認
  if (conflicts.value.length > 0) {
    const confirmMessage = `${conflicts.value.length}件の重複があります。このまま保存しますか？`
    if (!confirm(confirmMessage)) {
      return
    }
  }
  
  isLoading.value = true
  
  try {
    // // 実際のAPI呼び出しをここに実装
    // await new Promise(resolve => setTimeout(resolve, 1500)) // 保存処理のシミュレート

    emit('submit', { ...formData })
    
    console.log('保存されたデータ:', formData)
    showNotification('予定が正常に保存されました！')
    
    // フォームリセット
    resetForm()
  } catch (error) {
    console.error('保存エラー:', error)
    showNotification('保存に失敗しました', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (confirm('入力内容が失われますが、よろしいですか？')) {
    resetForm()
    back()
  }
}

const resetForm = () => {  
  Object.keys(errors).forEach(key => {
    delete errors[key as keyof EventFormErrors]
  })
  
  conflicts.value = []
  updateMasterConflicts()
  setDefaultValues()
}

// ライフサイクル
onMounted(() => {
  getUsersAsync().then(users => {
    participantsMaster.value = users.map(user => ({
      id: user.uid,
      name: user.displayName || user.name || '未設定',
      department: user.department || ''
    }))
  })
  setDefaultValues(props.initialData ?? undefined)
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
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.form-input:disabled,
.form-select:disabled {
  background-color: var(--background-light);
  color: var(--text-light);
  cursor: not-allowed;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

/* 日付タイプ選択 */
.date-type-options {
  display: flex;
  gap: 12px;
}

.date-type-option {
  flex: 1;
  position: relative;
}

.date-type-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.date-type-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
}

.date-type-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.date-type-radio:checked + .date-type-label {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: white;
}

/* 時間入力 */
.time-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.time-separator {
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
}

/* 期間・繰り返しセクション */
.date-range-section,
.recurring-section {
  display: grid;
  gap: 24px;
  padding: 20px;
  background-color: var(--background-light);
  border-radius: var(--radius-md);
}

/* 曜日選択 */
.weekday-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.weekday-option {
  position: relative;
}

.weekday-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.weekday-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
}

.weekday-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.weekday-checkbox:checked + .weekday-label {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: white;
}

/* 月単位選択 */
.monthly-options {
  display: grid;
  gap: 16px;
}

.monthly-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.monthly-radio {
  margin: 0;
}

.monthly-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.monthly-input {
  width: 80px;
}

.monthly-select {
  width: auto;
  padding: 8px 12px;
}

/* 終了条件 */
.end-condition-options {
  display: grid;
  gap: 12px;
}

.end-condition-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.end-condition-radio {
  margin: 0;
}

.end-condition-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.end-date-input,
.count-input {
  width: 150px;
}

.count-input {
  width: 80px;
}

/* マスタ選択セクション */
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

.tag-info {
  font-size: 11px;
  opacity: 0.8;
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

/* 重複チェック結果 */
.conflicts-section {
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: var(--radius-md);
  padding: 20px;
  margin: 16px 0;
}

.conflicts-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 16px;
}

.conflicts-list {
  display: grid;
  gap: 12px;
}

.conflict-item {
  background-color: white;
  border: 1px solid #fcd34d;
  border-radius: var(--radius-sm);
  padding: 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
}

.conflict-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #92400e;
  font-size: 13px;
}

.conflict-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conflict-name {
  font-weight: 600;
  color: var(--text-primary);
}

.conflict-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.conflict-event {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 優先度 */
.priority-options {
  display: flex;
  gap: 12px;
}

.priority-option {
  flex: 1;
  position: relative;
}

.priority-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.priority-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
}

.priority-label:hover {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.priority-radio:checked + .priority-label {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: white;
}

.priority-radio:checked + .priority-label.low {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.priority-radio:checked + .priority-label.medium {
  background-color: var(--warning-color);
  border-color: var(--warning-color);
}

.priority-radio:checked + .priority-label.high {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
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

.btn {
  padding: 14px 28px;
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

.btn-primary:disabled {
  background-color: var(--text-light);
  cursor: not-allowed;
  transform: none;
}

/* エラー表示 */
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
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  margin-top: 5%;
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
  /* overflow-y: auto; */
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

.selection-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.selection-conflict {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--danger-color);
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  height: 100px;
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
  
  .form-content {
    padding: 24px 20px;
  }
  
  .form-group.row {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .date-type-options {
    flex-direction: column;
  }
  
  .time-inputs {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .time-separator {
    display: none;
  }
  
  .weekday-options {
    justify-content: space-between;
  }
  
  .priority-options {
    flex-direction: column;
  }
  
  .end-date-input,
  .count-input {
    width: 100%;
  }
  
  .conflicts-section {
    padding: 16px;
  }
  
  .conflict-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    justify-content: center;
  }
  
  .modal-container {
    max-height: 90vh;
  }
}
</style>