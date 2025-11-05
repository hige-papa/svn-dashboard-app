<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">{{ initialData ? '予定を更新' : '新しい予定を登録' }}</p>
      </div>

      <div class="form-content">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group" :class="{ error: errors.eventTitle }">
            <label class="form-label" for="eventTitle">
              <i class="mdi mdi-pencil icon"></i>
              予定タイトル
              <span class="required">*</span>
            </label>
            <input id="eventTitle" v-model="formData.title" type="text" class="form-input"
              placeholder="例：重要な会議、プロジェクト打ち合わせ" @blur="validateField('eventTitle')" @input="clearError('eventTitle')">
            <div v-if="errors.eventTitle" class="form-error">{{ errors.eventTitle }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-tag-outline icon"></i>
              予定種別
              <span class="required">*</span>
            </label>
            <div class="event-type-options">
              <div v-for="(type, key) in eventTypeDetails" :key="key" class="event-type-option">
                <input :id="`eventType-${key}`" v-model="formData.eventType" type="radio" name="eventType" :value="key"
                  class="event-type-radio">
                <label :for="`eventType-${key}`" class="event-type-label" :style="{ '--event-type-color': type.color }">
                  <span class="event-type-color-dot"></span>
                  {{ type.name }}
                </label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-calendar-multiple icon"></i>
              日付タイプ
              <span class="required">*</span>
            </label>
            <div class="date-type-options">
              <div class="date-type-option">
                <input id="dateTypeSingle" v-model="formData.dateType" type="radio" name="dateType" value="single"
                  class="date-type-radio" @change="clearConflicts">
                <label for="dateTypeSingle" class="date-type-label">
                  <i class="mdi mdi-calendar icon"></i>
                  単一日
                </label>
              </div>
              <div class="date-type-option">
                <input id="dateTypeRange" v-model="formData.dateType" type="radio" name="dateType" value="range"
                  class="date-type-radio" @change="clearConflicts">
                <label for="dateTypeRange" class="date-type-label">
                  <i class="mdi mdi-calendar-range icon"></i>
                  期間
                </label>
              </div>
              <div class="date-type-option">
                <input id="dateTypeRecurring" v-model="formData.dateType" type="radio" name="dateType" value="recurring"
                  class="date-type-radio" @change="clearConflicts">
                <label for="dateTypeRecurring" class="date-type-label">
                  <i class="mdi mdi-calendar-sync icon"></i>
                  繰り返し
                </label>
              </div>
            </div>
          </div>

          <div v-if="formData.dateType === 'single'" class="form-group row">
            <div class="form-group" :class="{ error: errors.eventDate }">
              <label class="form-label" for="eventDate">
                <i class="mdi mdi-calendar icon"></i>
                日付
                <span class="required">*</span>
              </label>
              <input id="eventDate" v-model="formData.date" type="date" class="form-input"
                @blur="validateField('eventDate')" @input="clearError('eventDate')">
              <div v-if="errors.eventDate" class="form-error">{{ errors.eventDate }}</div>
            </div>

            <div class="form-group" :class="{ error: errors.time }">
              <label class="form-label time-label">
                <div class="time-label-left">
                  <i class="mdi mdi-clock-outline icon"></i>
                  時間
                  <span class="required">*</span>
                </div>
                <button type="button" class="btn-allday-small" aria-label="終日" @click="setAlldayTimes($event)">終日</button>
              </label>
              <div class="time-inputs">
                <div class="time-from-wrapper">
                  <input id="startTime" v-model="formData.startTime" type="time" class="form-input"
                    @blur="validateTimeFields" @input="clearError('time')">
                </div>
                <span class="time-separator">〜</span>
                <div class="time-to-wrapper">
                  <input id="endTime" v-model="formData.endTime" type="time" class="form-input" @blur="validateTimeFields"
                    @input="clearError('time')">
                </div>
              </div>
              <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
            </div>
          </div>

          <div v-if="formData.dateType === 'range'" class="date-range-section">
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.startDate }">
                <label class="form-label" for="startDate">
                  <i class="mdi mdi-calendar-start icon"></i>
                  開始日
                  <span class="required">*</span>
                </label>
                <input id="startDate" v-model="formData.startDate" type="date" class="form-input"
                  @blur="validateField('startDate')" @input="clearError('startDate')">
                <div v-if="errors.startDate" class="form-error">{{ errors.startDate }}</div>
              </div>

              <div class="form-group" :class="{ error: errors.endDate }">
                <label class="form-label" for="endDate">
                  <i class="mdi mdi-calendar-end icon"></i>
                  終了日
                  <span class="required">*</span>
                </label>
                <input id="endDate" v-model="formData.endDate" type="date" class="form-input" :min="formData.startDate"
                  @blur="validateField('endDate')" @input="clearError('endDate')">
                <div v-if="errors.endDate" class="form-error">{{ errors.endDate }}</div>
              </div>
            </div>

            <div class="form-group" :class="{ error: errors.time }">
              <label class="form-label time-label">
                <div class="time-label-left">
                  <i class="mdi mdi-clock-outline icon"></i>
                  時間
                  <span class="required">*</span>
                </div>
                <button type="button" class="btn-allday-small" aria-label="終日" @click="setAlldayTimes($event)">終日</button>
              </label>
              <div class="time-inputs">
                <div class="time-from-wrapper">
                  <input v-model="formData.startTime" type="time" class="form-input" @blur="validateTimeFields"
                    @input="clearError('time')">
                </div>
                <span class="time-separator">〜</span>
                <div class="time-to-wrapper">
                  <input v-model="formData.endTime" type="time" class="form-input" @blur="validateTimeFields"
                    @input="clearError('time')">
                </div>
              </div>
              <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
            </div>
          </div>

          <div v-if="formData.dateType === 'recurring'" class="recurring-section">
            <div class="form-group row">
              <div class="form-group" :class="{ error: errors.recurringStartDate }">
                <label class="form-label" for="recurringStartDate">
                  <i class="mdi mdi-calendar-start icon"></i>
                  開始日
                  <span class="required">*</span>
                </label>
                <input id="recurringStartDate" v-model="formData.recurringStartDate" type="date" class="form-input"
                  @blur="validateField('recurringStartDate')" @input="clearError('recurringStartDate')">
                <div v-if="errors.recurringStartDate" class="form-error">{{ errors.recurringStartDate }}</div>
              </div>

              <div class="form-group" :class="{ error: errors.time }">
                <label class="form-label time-label">
                  <div class="time-label-left">
                    <i class="mdi mdi-clock-outline icon"></i>
                    時間
                    <span class="required">*</span>
                  </div>
                  <button type="button" class="btn-allday-small" aria-label="終日" @click="setAlldayTimes($event)">終日</button>
                </label>
                <div class="time-inputs">
                  <div class="time-from-wrapper">
                    <input v-model="formData.startTime" type="time" class="form-input" @blur="validateTimeFields"
                      @input="clearError('time')">
                  </div>
                  <span class="time-separator">〜</span>
                  <div class="time-to-wrapper">
                    <input v-model="formData.endTime" type="time" class="form-input" @blur="validateTimeFields"
                      @input="clearError('time')">
                  </div>
                </div>
                <div v-if="errors.time" class="form-error">{{ errors.time }}</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <i class="mdi mdi-repeat icon"></i>
                繰り返しパターン
                <span class="required">*</span>
              </label>
              <select v-model="formData.recurringPattern" class="form-select">
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
                <option value="weekdays">平日のみ</option>
                <option value="custom">カスタム</option>
              </select>
            </div>

            <div v-if="formData.recurringPattern === 'weekly' || formData.recurringPattern === 'custom'"
              class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-week icon"></i>
                曜日を選択
              </label>
              <div class="weekday-options">
                <div v-for="(day, index) in weekDays" :key="index" class="weekday-option">
                  <input :id="`weekday-${index}`" v-model="formData.selectedWeekdays" type="checkbox" :value="index"
                    class="weekday-checkbox">
                  <label :for="`weekday-${index}`" class="weekday-label">
                    {{ day }}
                  </label>
                </div>
              </div>
            </div>

            <div v-if="formData.recurringPattern === 'monthly'" class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-month icon"></i>
                毎月の日付
              </label>
              <div class="monthly-options">
                <div class="monthly-option">
                  <input id="monthlyDate" v-model="formData.monthlyType" type="radio" name="monthlyType" value="date"
                    class="monthly-radio">
                  <label for="monthlyDate" class="monthly-label">
                    <input v-model.number="formData.monthlyDate" type="number" min="1" max="31"
                      class="form-input monthly-input" :disabled="formData.monthlyType !== 'date'">
                    日
                  </label>
                </div>
                <div class="monthly-option">
                  <input id="monthlyWeek" v-model="formData.monthlyType" type="radio" name="monthlyType" value="weekday">
                  <label for="monthlyWeek" class="monthly-label">
                    第
                    <select v-model="formData.monthlyWeek" class="form-select monthly-select"
                      :disabled="formData.monthlyType !== 'weekday'">
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="-1">最終</option>
                    </select>
                    <select v-model.number="formData.monthlyWeekday" class="form-select monthly-select"
                      :disabled="formData.monthlyType !== 'weekday'">
                      <option v-for="(day, index) in weekDays" :key="index" :value="index">
                        {{ day }}
                      </option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <i class="mdi mdi-calendar-remove icon"></i>
                終了条件
              </label>
              <div class="end-condition-options">
                <div class="end-condition-option">
                  <input id="endNever" v-model="formData.recurringEndType" type="radio" name="recurringEndType"
                    value="never" class="end-condition-radio">
                  <label for="endNever" class="end-condition-label">
                    終了日なし
                  </label>
                </div>
                <div class="end-condition-option">
                  <input id="endDateOption" v-model="formData.recurringEndType" type="radio" name="recurringEndType"
                    value="date" class="end-condition-radio">
                  <label for="endDateOption" class="end-condition-label">
                    終了日:
                    <input v-model="formData.recurringEndDate" type="date" class="form-input end-date-input"
                      :min="formData.recurringStartDate" :disabled="formData.recurringEndType !== 'date'">
                  </label>
                </div>
                <div class="end-condition-option">
                  <input id="endCount" v-model="formData.recurringEndType" type="radio" name="recurringEndType"
                    value="count" class="end-condition-radio">
                  <label for="endCount" class="end-condition-label">
                    回数:
                    <input v-model.number="formData.recurringCount" type="number" min="1" max="999"
                      class="form-input count-input" :disabled="formData.recurringEndType !== 'count'">
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
            <input id="eventLocation" v-model="formData.location" type="text" class="form-input"
              placeholder="例：会議室A、オンライン、顧客先">
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-account-group icon"></i>
              参加者
            </label>
            <div class="master-select-section">
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
                参加者やチームを選択してください（複数選択可）
              </p>
              <div class="master-select-wrapper">
                <div class="selected-items">
                  <div v-for="participant in selectedParticipantsData" :key="participant.id" class="selected-tag">
                    <span>{{ participant.name }}</span>
                    <button type="button" @click="removeParticipant(participant.id)" class="tag-remove">×</button>
                  </div>
                  <button type="button" @click="openParticipantModal" class="btn-select-master">
                    <i class="mdi mdi-plus icon"></i>
                    参加者を追加
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                  <div v-for="facility in selectedFacilitiesData" :key="facility.id" class="selected-tag">
                    <span>{{ facility.name }}</span>
                    <span v-if="facility.capacity" class="tag-info">(定員: {{ facility.capacity }}名)</span>
                    <button type="button" @click="removeFacility(facility.id)" class="tag-remove">×</button>
                  </div>
                  <button type="button" @click="openFacilityModal" class="btn-select-master">
                    <i class="mdi mdi-plus icon"></i>
                    施設を追加
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                  <div v-for="equipment in selectedEquipmentData" :key="equipment.id" class="selected-tag">
                    <span>{{ equipment.name }}</span>
                    <span v-if="equipment.quantity" class="tag-info">(在庫: {{ equipment.quantity }})</span>
                    <button type="button" @click="removeEquipment(equipment.id)" class="tag-remove">×</button>
                  </div>
                  <button type="button" @click="openEquipmentModal" class="btn-select-master">
                    <i class="mdi mdi-plus icon"></i>
                    備品を追加
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                <input id="priorityHigh" v-model="formData.priority" type="radio" name="priority" value="high"
                  class="priority-radio">
                <label for="priorityHigh" class="priority-label high">
                  <i class="mdi mdi-arrow-up icon"></i>
                  高
                </label>
              </div>
              <div class="priority-option">
                <input id="priorityMedium" v-model="formData.priority" type="radio" name="priority" value="medium"
                  class="priority-radio">
                <label for="priorityMedium" class="priority-label medium">
                  <i class="mdi mdi-minus icon"></i>
                  中
                </label>
              </div>
              <div class="priority-option">
                <input id="priorityLow" v-model="formData.priority" type="radio" name="priority" value="low"
                  class="priority-radio">
                <label for="priorityLow" class="priority-label low">
                  <i class="mdi mdi-arrow-down icon"></i>
                  低
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="eventDescription">
              <i class="mdi mdi-file-document-outline icon"></i>
              メモ・説明
            </label>
            <textarea id="eventDescription" v-model="formData.description" class="form-textarea"
              placeholder="予定の詳細情報や議題などを記入してください..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="mdi mdi-lock-outline icon"></i>
              プライバシー設定
            </label>
            <div class="privacy-option">
              <input id="private-event-checkbox" v-model="formData.private" type="checkbox" class="privacy-checkbox">
              <label for="private-event-checkbox" class="privacy-label">
                <span class="privacy-text">プライベート予定にする</span>
                <p class="form-helper-text">
                  チェックを入れると、他のユーザー（参加者を除く）にはあなたの予定が「予定あり」とだけ表示され、詳細は非公開になります。
                </p>
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn btn-secondary">
              <i class="mdi mdi-close icon"></i>
              キャンセル
            </button>
            <button type="button" @click="showEventRelatedParties" class="btn btn-secondary">
              <i class="mdi mdi-eye-outline icon"></i>
              参加者の予定を確認
            </button>
            <button type="submit" :disabled="isLoading" class="btn btn-primary">
              <i v-if="isLoading" class="mdi mdi-loading icon loading-spin"></i>
              <i v-else class="mdi mdi-content-save icon"></i>
              <span v-if="initialData">{{ isLoading ? '更新中...' : '予定を更新' }}</span>
              <span v-else>{{ isLoading ? '保存中...' : '予定を保存' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <aw-dialog v-model="showModal" :initial-height="550" :draggable="true" :resize="true" :overlay="false" :fullscreen="mobile">
      <template #header>
        <div class="modal-header">
          <div v-if="modalType === 'participant'" class="modal-view-tabs">
            <button :class="{ active: modalView === 'participants' }" @click="modalView = 'participants'"
              class="modal-view-tab">
              <i class="mdi mdi-account icon"></i>
              参加者
            </button>
            <button :class="{ active: modalView === 'teams' }" @click="modalView = 'teams'" class="modal-view-tab">
              <i class="mdi mdi-account-group icon"></i>
              チーム
            </button>
          </div>

          <div class="search-box">
            <i class="mdi mdi-magnify icon"></i>
            <input v-model="searchQuery" type="text" class="search-input" :placeholder="getSearchPlaceholder()">
          </div>
        </div>
      </template>
      <div>
        <div class="modal-body">

          <div class="selection-list" v-if="modalView === 'participants'">
            <div v-if="filteredItems.length === 0" class="no-results">検索結果がありません</div>
            <label v-for="item in (filteredItems as MasterItem[])" :key="item.id" class="selection-item">
              <input type="checkbox" :value="item.id" :checked="isItemSelected(item.id)"
                @change="toggleItem(item.id)" class="selection-checkbox">
              <div class="selection-info">
                <div class="selection-name">{{ item.name }}</div>
                <div v-if="item.department" class="selection-meta">{{ item.department }}</div>
                <div v-if="item.isConflict" class="selection-conflict">
                  <i class="mdi mdi-alert icon"></i>
                  {{ item.conflictInfo }}
                </div>
              </div>
              <div class="h-100 d-flex align-center justify-center">
                <v-btn variant="text" color="primary" @click="viewUsageStatus(item)" :disabled="!formData.date"
                  :size="mobile ? 'small' : 'auto'">
                  {{ modalType === 'participant' ? '予定を確認' : '使用状況を確認' }}
                </v-btn>
              </div>
            </label>
          </div>

          <div class="selection-list" v-if="modalView === 'teams'">
            <div v-if="filteredItems.length === 0" class="no-results">検索結果がありません</div>
            <div v-for="team in (filteredItems as TeamItem[])" :key="team.id" class="team-selection-item">
              <div class="selection-info">
                <div class="selection-name">{{ team.name }}</div>
                <div class="selection-meta">メンバー: {{ team.memberCount || 0 }}名</div>
              </div>
              <button @click="addTeamMembers(team.id)" class="btn-add-team">
                <i class="mdi mdi-plus icon"></i>
                追加
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <button type="button" @click="closeModal" class="modal-footer-btn btn-secondary">
            キャンセル
          </button>
          <button type="button" @click="confirmSelection" class="modal-footer-btn btn-primary">
            選択を確定
          </button>
        </div>
      </template>
    </aw-dialog>

    <aw-dialog v-model="dialog" :initial-height="550" :draggable="true" :resize="true" :overlay="false" :fullscreen="mobile">
      <template #title>
        <span v-if="selected" class="list-title text-body-1">{{ selected?.name }}さんの{{ date ? formatDateForDb(date) : '' }}の予定一覧</span>
      </template>
      <DailyTimeline v-if="date" :events="events" :time-slots="timeSlots" :date="date" :time-to-pixels="timeToPixels"
        @event-click="() => { }" />
    </aw-dialog>

    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i class="mdi mdi-check icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>

    <aw-dialog v-model="isShowEventRelatedParties" :initial-height="550" :draggable="true" :resize="true" :overlay="false"
      :initial-width="1200" :fullscreen="mobile">
      <template #title>
        <span class="list-title text-body-1">参加者の予定一覧 ({{ targetDate ? formatDateForDb(targetDate) : '' }})</span>
      </template>
      <v-container>
        <GroupHorizontalTimeline :users="eventRelatedParties ?? []" :events="relatedPartyEvents" :date="targetDate" />
      </v-container>
    </aw-dialog>
  </div>
</template>

<script setup lang="ts">
import type { User } from 'firebase/auth'
import { useMaster } from '~/composables/master/useMaster'
import { useFacility } from '~/composables/useFacility'
import { useEquipment } from '~/composables/useEquipment'
import { useTeam } from '~/composables/useTeam'
import { useCalendar } from '~/composables/useCalendar';
import { useEventService } from '~/services/eventService'
import { useConstants } from '~/composables/common/useConstants'
import { useMasterData } from '~/composables/useMasterData'
import { useDisplay } from 'vuetify'
import GroupHorizontalTimeline from '~/components/Calendar/DailyView/GroupHorizontalTimeline.vue'

interface MasterItem {
  id: string;
  code: string;
  name: string;
  department?: string;
  capacity?: number;
  quantity?: number;
  avatar?: string;
  isConflict?: boolean;
  conflictInfo?: string;
}

interface TeamItem {
  id: string;
  code: string;
  name: string;
  members: string[];
  memberCount: number;
}

// ⭐︎ useCalendarから必要なユーティリティ関数をインポート
const { 
  timeToPixels, 
  timeSlots, 
  formatDateForDb, 
  formatDate, // useCalendar.tsで復活
} = useCalendar();

const { eventTypeDetails } = useConstants()

const { data: ownCompanies } = useMasterData<OwnCompany>('own-company')

const user = useState<User>('user')

const { mobile } = useDisplay()

const { back } = useRouter()
const { getListAsync: getUsersAsync } = useMaster('users')
const { getListAsync: getFacilitiesAsync } = useFacility()
const { getListAsync: getEquipmentsAsync } = useEquipment()
const { getListAsync: getTeamsAsync } = useTeam()
// ⭐︎ useEventServiceから必要な関数をインポート
const { 
  getEventsByParticipantInRange, 
  getEventsByEquipmentInRange, 
  getEventsByFacilityInRange, 
  createEvent,
  updateEvent, // 👈 追加
} = useEventService();

// UTCで日付文字列をDateオブジェクトに変換 (useCalendarにもあるが、ここでは依存しないように再定義)
const parseDateAsLocal = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`);

interface Props {
  date?: string,
  participantIds?: string[],
  initialData?: EventData // EventFormData
}

const props = withDefaults(defineProps<Props>(), {})

const weekDays = ['日', '月', '火', '水', '木', '金', '土']

useHead({
  title: 'TASCAL - 予定登録',
  meta: [
    { name: 'description', content: 'TASCALシステムで新しい予定を登録できます' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

const formData = reactive<EventFormData>({
  title: '',
  eventType: 'normal',
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
  facilities: [],
  equipmentIds: [],
  equipments: [],
  priority: 'medium',
  description: '',
  eventTypeColor: '',
  eventTypeName: '',
  private: false,
})
const errors = reactive<any>({})
const isLoading = ref(false)
const conflicts = ref<any[]>([])
const notification = reactive<any>({ show: false, message: '', type: 'success' })

const showModal = ref(false)
const modalType = ref<null | 'participant' | 'facility' | 'equipment'>(null)
const modalView = ref<'participants' | 'teams'>('participants')
const searchQuery = ref('')
const tempSelection = ref<string[]>([])

const participants = ref<MasterItem[]>([])
const participantsMaster = computed(() => {
  const combinedList = [
    ...participants.value,
    ...(ownCompanies.value?.map(company => {
      return {
        id: company.id,
        code: company.code,
        name: company.displayName || '未設定',
        department: '',
        avatar: company.avatar,
      }
    }) ?? [])
  ]

  return combinedList.map(item => {
    const conflict = conflicts.value.find(c => c.id === item.id && c.type === 'participant')
    if (conflict) {
      return { ...item, isConflict: true, conflictInfo: `${conflict.date} ${conflict.startTime}-${conflict.endTime} に「${conflict.eventTitle}」と重複` }
    } else {
      return { ...item, isConflict: false, conflictInfo: '' }
    }
  })
})
const facilitiesMaster = ref<MasterItem[]>([])
const equipmentMaster = ref<MasterItem[]>([])
const teamsMaster = ref<TeamItem[]>([])

const selectedParticipantsData = computed(() => participantsMaster.value.filter(p => formData.participantIds.includes(p.id)).sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } }))
const selectedFacilitiesData = computed(() => facilitiesMaster.value.filter(f => formData.facilityIds.includes(f.id)).sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } }))
const selectedEquipmentData = computed(() => equipmentMaster.value.filter(e => formData.equipmentIds.includes(e.id)).sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } }))

const filteredItems = computed((): MasterItem[] | TeamItem[] => {
  const query = searchQuery.value.toLowerCase();
  let sourceItems: MasterItem[] | TeamItem[] = [];

  switch (modalType.value) {
    case 'participant':
      sourceItems = modalView.value === 'participants' ? participantsMaster.value : teamsMaster.value;
      break;
    case 'facility':
      sourceItems = facilitiesMaster.value;
      break;
    case 'equipment':
      sourceItems = equipmentMaster.value;
      break;
  }

  const filtered = query
    ? sourceItems.filter(item => item.name.toLowerCase().includes(query) || (item as MasterItem).department?.toLowerCase().includes(query))
    : sourceItems;

  return filtered.slice().sort((a, b) => {
    if (a.code > b.code) return 1;
    if (a.code < b.code) return -1;
    return 0;
  });
});

const setDefaultValues = (form?: any) => {
  const defaults = {
    title: '', eventType: 'normal', dateType: 'single', date: '', startDate: '', endDate: '',
    recurringStartDate: '', recurringPattern: 'weekly', selectedWeekdays: [], monthlyType: 'date',
    monthlyDate: 1, monthlyWeek: '1', monthlyWeekday: 1, recurringEndType: 'never',
    recurringEndDate: '', recurringCount: 10, startTime: '', endTime: '', location: '',
    participantIds: [], participants: [], facilityIds: [], equipmentIds: [],
    priority: 'medium', description: '', private: false, equipments: [], eventTypeColor: '',
    eventTypeName: '', facilities: []
  };
  Object.assign(formData, defaults, form);

  if (!form) {
    const now = new Date();

    const toLocaleDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toLocaleTimeString = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const today = props.date ? props.date : toLocaleDateString(now);
    formData.date = today;
    formData.startDate = today;
    formData.endDate = today;
    formData.recurringStartDate = today;

    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    formData.startTime = toLocaleTimeString(startTime);
    formData.endTime = toLocaleTimeString(endTime);

    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    formData.recurringEndDate = toLocaleDateString(threeMonthsLater);
  }
}

watch(() => formData.dateType, (newType) => {
  const today = new Date().toISOString().split('T')[0];
  if (newType === 'single') {
    formData.startDate = ''; formData.endDate = ''; formData.recurringStartDate = '';
    if (!formData.date) formData.date = today;
  } else if (newType === 'range') {
    formData.date = ''; formData.recurringStartDate = '';
    if (!formData.startDate) formData.startDate = today;
    if (!formData.endDate) formData.endDate = today;
  } else if (newType === 'recurring') {
    formData.date = ''; formData.startDate = ''; formData.endDate = '';
    if (!formData.recurringStartDate) formData.recurringStartDate = today;
  }
});

const targetDate = computed(() => {
  let dateStr = '';
  switch (formData.dateType) {
    case 'single': dateStr = formData.date; break;
    case 'range': dateStr = formData.startDate; break;
    case 'recurring': dateStr = formData.recurringStartDate; break;
  }
  return dateStr ? parseDateAsLocal(dateStr) : new Date();
})

const openParticipantModal = () => {
  modalType.value = 'participant';
  modalView.value = 'participants';
  tempSelection.value = [...formData.participantIds];
  showModal.value = true
}
const openFacilityModal = () => { modalType.value = 'facility'; tempSelection.value = [...formData.facilityIds]; showModal.value = true }
const openEquipmentModal = () => { modalType.value = 'equipment'; tempSelection.value = [...formData.equipmentIds]; showModal.value = true }

const closeModal = () => { showModal.value = false; searchQuery.value = ''; tempSelection.value = [] }

const confirmSelection = () => {
  switch (modalType.value) {
    case 'participant':
      formData.participantIds = [...tempSelection.value];
      formData.participants = participantsMaster.value.filter(p => tempSelection.value.includes(p.id)).map(p => p.name);
      break
    case 'facility':
      formData.facilityIds = [...tempSelection.value];
      formData.facilities = facilitiesMaster.value.filter(f => tempSelection.value.includes(f.id)).map(f => f.name);
      break
    case 'equipment':
      formData.equipmentIds = [...tempSelection.value];
      formData.equipments = equipmentMaster.value.filter(e => tempSelection.value.includes(e.id)).map(e => e.name);
      break
  }
  closeModal()
}

const addTeamMembers = (teamId: string) => {
  const team = teamsMaster.value.find(t => t.id === teamId)
  if (team && team.members) {
    let addedCount = 0
    team.members.forEach((memberId: string) => {
      if (!tempSelection.value.includes(memberId)) {
        tempSelection.value.push(memberId)
        addedCount++
      }
    })

    if (addedCount > 0) {
      showNotification(`チーム「${team.name}」から${addedCount}名を追加しました`, 'success');
    } else {
      showNotification(`チーム「${team.name}」のメンバーは全員追加済みです`, 'info');
    }

    modalView.value = 'participants';
  }
}

const isItemSelected = (id: string) => tempSelection.value.includes(id)

const toggleItem = (id: string) => {
  const index = tempSelection.value.indexOf(id)
  if (index > -1) tempSelection.value.splice(index, 1)
  else tempSelection.value.push(id)
}

const removeParticipant = (id: string) => { const i = formData.participantIds.indexOf(id); if (i > -1) { formData.participantIds.splice(i, 1); } }
const removeFacility = (id: string) => { const i = formData.facilityIds.indexOf(id); if (i > -1) { formData.facilityIds.splice(i, 1); } }
const removeEquipment = (id: string) => { const i = formData.equipmentIds.indexOf(id); if (i > -1) { formData.equipmentIds.splice(i, 1); } }

const setAlldayTimes = (e?: Event) => {
  formData.startTime = '09:00'
  formData.endTime = '18:00'
  clearError('time')
  try {
    const target = e?.currentTarget as HTMLElement | undefined
    target?.blur()
  } catch (err) {
    // noop
  }
}

const getSearchPlaceholder = () => {
  if (modalType.value === 'participant' && modalView.value === 'teams') {
    return 'チーム名で検索...'
  }
  switch (modalType.value) {
    case 'participant': return '名前や部署で検索...';
    case 'facility': return '施設名で検索...';
    case 'equipment': return '備品名で検索...';
    default: return '検索...'
  }
}

const checkConflicts = async () => {
  if (isLoading.value || formData.dateType !== 'single' || !formData.date || !formData.startTime || !formData.endTime) {
    conflicts.value = []
    updateMasterConflicts()
    return
  }

  const checkDate = formData.date;
  const startTime = formData.startTime;
  const endTime = formData.endTime;

  try {
    isLoading.value = true
    
    // キャッシュ方式でも、リソース別取得関数は必要
    const results = await Promise.all([
      ...formData.participantIds.map(id => getEventsByParticipantInRange(id, checkDate, checkDate)),
      ...formData.facilityIds.map(id => getEventsByFacilityInRange(id, checkDate, checkDate)),
      ...formData.equipmentIds.map(id => getEventsByEquipmentInRange(id, checkDate, checkDate)),
    ])

    const allEvents = results.flat()

    const uniqueEventsMap = new Map()
    allEvents.forEach(event => {
      if (event && event.id && event.id !== props.initialData?.id) {
        uniqueEventsMap.set(event.id, event)
      }
    })
    const uniqueEvents = Array.from(uniqueEventsMap.values()) as EventDisplay[]

    const startDateTime = new Date(`${checkDate}T${startTime}:00`)
    const endDateTime = new Date(`${checkDate}T${endTime}:00`)

    conflicts.value = []

    uniqueEvents.forEach(event => {
      const eventStart = new Date(`${event.date}T${event.startTime}:00`)
      const eventEnd = new Date(`${event.date}T${event.endTime}:00`)

      if ((startDateTime < eventEnd) && (endDateTime > eventStart)) {
        
        const conflictingPids = event.participantIds?.filter(pid => formData.participantIds.includes(pid)) || []
        conflictingPids.forEach(pid => {
          const user = participantsMaster.value.find(u => u.id === pid)
          conflicts.value.push({
            id: pid,
            type: 'participant',
            name: user ? user.name : '不明な参加者',
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            eventTitle: event.title
          })
        })

        const conflictingFids = event.facilityIds?.filter(fid => formData.facilityIds.includes(fid)) || []
        conflictingFids.forEach(fid => {
          const facility = facilitiesMaster.value.find(f => f.id === fid)
          conflicts.value.push({
            id: fid,
            type: 'facility',
            name: facility ? facility.name : '不明な施設',
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            eventTitle: event.title
          })
        })

        const conflictingEids = event.equipmentIds?.filter(eid => formData.equipmentIds.includes(eid)) || []
        conflictingEids.forEach(eid => {
          const equipment = equipmentMaster.value.find(e => e.id === eid)
          conflicts.value.push({
            id: eid,
            type: 'equipment',
            name: equipment ? equipment.name : '不明な備品',
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            eventTitle: event.title
          })
        })
      }
    })
    
  } catch (error) {
    console.error('重複チェックエラー:', error)
    showNotification('重複チェックに失敗しました', 'error')
  } finally {
    isLoading.value = false
    updateMasterConflicts()
  }
}

watch(() => [formData.dateType, formData.date, formData.startTime, formData.endTime, formData.participantIds, formData.facilityIds, formData.equipmentIds], () => {
  if (formData.dateType === 'single') {
    checkConflicts()
  } else {
    clearConflicts()
  }
})

const updateMasterConflicts = () => {
  const markConflicts = (items: MasterItem[], type: 'facility' | 'equipment') => {
    return items.map(item => {
      const conflict = conflicts.value.find(c => c.id === item.id && c.type === type)
      if (conflict) {
        return { ...item, isConflict: true, conflictInfo: `${conflict.date} ${conflict.startTime}-${conflict.endTime} に「${conflict.eventTitle}」と重複` }
      } else {
        return { ...item, isConflict: false, conflictInfo: '' }
      }
    })
  }
  
  facilitiesMaster.value = markConflicts(facilitiesMaster.value, 'facility')
  equipmentMaster.value = markConflicts(equipmentMaster.value, 'equipment')
}

const clearConflicts = () => { conflicts.value = []; updateMasterConflicts() }

const getConflictIcon = (type: string) => { 
  switch(type) {
    case 'participant': return 'mdi-account-alert';
    case 'facility': return 'mdi-office-building-alert';
    case 'equipment': return 'mdi-chair-rolling'; 
    default: return 'mdi-alert-circle';
  }
}
const getConflictTypeName = (type: string) => { 
  switch(type) {
    case 'participant': return '参加者';
    case 'facility': return '施設';
    case 'equipment': return '備品';
    default: return '不明';
  }
}
// ⭐︎ 修正点: useCalendarから復活したformatDateを使用
// const formatDate = (date: string) => formatDate(parseDateAsLocal(date)); 

const validateField = (fieldName: keyof any) => { 
  if (fieldName === 'eventTitle' && !formData.title) errors.eventTitle = '予定タイトルは必須です';
  if (fieldName === 'eventDate' && formData.dateType === 'single' && !formData.date) errors.eventDate = '日付は必須です';
  if (fieldName === 'startDate' && formData.dateType === 'range' && !formData.startDate) errors.startDate = '開始日は必須です';
  if (fieldName === 'endDate' && formData.dateType === 'range' && (!formData.endDate || formData.endDate < formData.startDate)) errors.endDate = '有効な終了日を選択してください';
  if (fieldName === 'recurringStartDate' && formData.dateType === 'recurring' && !formData.recurringStartDate) errors.recurringStartDate = '開始日は必須です';
}
const validateTimeFields = () => { 
  if (!formData.startTime || !formData.endTime) {
    errors.time = '開始時間と終了時間は必須です';
    return;
  }
  if (formData.startTime >= formData.endTime) {
    errors.time = '終了時間は開始時間より後に設定してください';
  }
}
const validateForm = (): boolean => {
  Object.keys(errors).forEach(key => delete errors[key as keyof any])
  validateField('eventTitle')
  switch (formData.dateType) {
    case 'single': validateField('eventDate'); break
    case 'range': validateField('startDate'); validateField('endDate'); break
    case 'recurring': validateField('recurringStartDate'); break
  }
  validateTimeFields()
  return Object.keys(errors).length === 0
}
const clearError = (fieldName: keyof any) => { if (errors[fieldName]) delete errors[fieldName] }

const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notification.message = message; notification.type = type; notification.show = true
  setTimeout(() => { notification.show = false }, 3000)
}

const emit = defineEmits<{ (e: 'submit', data: any): void }>()

const handleSubmit = async () => {
  if (!validateForm()) return showNotification('入力内容を確認してください', 'error')
  
  if (formData.dateType === 'single' && conflicts.value.length > 0 && !confirm('重複があります。保存しますか？')) return

  emit('submit', formData)

  // isLoading.value = true
  // try {
  //   let eventIds: string[] = []
    
  //   if (props.initialData) {
  //     // 既存データがある場合は更新
  //     // NOTE: 単一イベントのみサポート（updateEventの制限による）
  //     eventIds = await updateEvent(props.initialData, { ...formData }) // 👈 updateEventを呼び出す
  //     showNotification('予定が正常に更新されました！') // 👈 メッセージを更新用に変更
  //   } else {
  //     // 既存データがない場合は新規作成
  //     eventIds = await createEvent({ ...formData })
  //     showNotification('予定が正常に保存されました！')
  //   }
    
  //   console.log(`Processed event IDs: ${eventIds.join(', ')}`)

  //   resetForm()
  // } catch (error) {
  //   console.error('処理エラー:', error)
  //   showNotification('保存/更新に失敗しました', 'error')
  // } finally {
  //   isLoading.value = false
  // }
}

const handleCancel = () => { if (confirm('入力内容が失われますが、よろしいですか？')) { resetForm(); back() } }
const resetForm = () => {
  Object.keys(errors).forEach(key => delete errors[key as keyof any])
  conflicts.value = []
  updateMasterConflicts()
  setDefaultValues()
}

const dialog = ref<boolean>(false)
const date = ref<Date>();
const selected = ref<MasterItem>();
const events = ref<any[]>([]) // EventDisplay[]

const viewUsageStatus = async (item: MasterItem) => {
  let checkDate = '';
  switch (formData.dateType) {
    case 'single': checkDate = formData.date; break;
    case 'range': checkDate = formData.startDate; break;
    case 'recurring': checkDate = formData.recurringStartDate; break;
  }

  if (item && checkDate) {
    selected.value = item
    date.value = parseDateAsLocal(checkDate) 
    
    if (modalType.value === 'participant') {
      events.value = await getEventsByParticipantInRange(item.id, checkDate, checkDate)
    } else if (modalType.value === 'facility') {
      events.value = await getEventsByFacilityInRange(item.id, checkDate, checkDate)
    } else if (modalType.value === 'equipment') {
      events.value = await getEventsByEquipmentInRange(item.id, checkDate, checkDate)
    }
    dialog.value = true
  }
}

const isShowEventRelatedParties = ref<boolean>(false)

const eventRelatedParties = computed(() => {
  return [
    ...participantsMaster.value.filter(e => formData.participantIds.some(e2 => e2 === e.id)).map(e => { return { id: e.id, code: e.code, type: 'user', name: e.name, avatar: e.avatar } }),
    ...facilitiesMaster.value.filter(e => formData.facilityIds.some(e2 => e2 === e.id)).map(e => { return { id: e.id, code: e.code, type: 'facility', name: e.name, avatar: e.avatar } }),
    ...equipmentMaster.value.filter(e => formData.equipmentIds.some(e2 => e2 === e.id)).map(e => { return { id: e.id, code: e.code, type: 'equipment', name: e.name, avatar: e.avatar } }),
  ] as GroupMember[]
})
const relatedPartyEvents = ref<EventDisplay[]>([]) // EventDisplay[]

const showEventRelatedParties = async () => {
  let targetDateString = '';
  switch (formData.dateType) {
    case 'single':
      targetDateString = formData.date;
      break;
    case 'range':
      targetDateString = formData.startDate;
      break;
    case 'recurring':
      targetDateString = formData.recurringStartDate;
      break;
    default:
      targetDateString = formatDateForDb(new Date());
  }
  
  if (!targetDateString) {
      console.warn('Target date is not set for viewing related parties.');
      return;
  }
  
  const displayDate = parseDateAsLocal(targetDateString);

  let result: EventDisplay[] = []
  for (const e of eventRelatedParties.value) {
    let eventsForResource: EventDisplay[] = [];
    switch (e.type) {
      case 'user':
        eventsForResource = await getEventsByParticipantInRange(e.id, targetDateString, targetDateString);
        break;
      case 'facility':
        eventsForResource = await getEventsByFacilityInRange(e.id, targetDateString, targetDateString);
        break;
      case 'equipment':
        eventsForResource = await getEventsByEquipmentInRange(e.id, targetDateString, targetDateString);
        break;
    }
    
    eventsForResource.forEach(event => {
      if (!result.some(e2 => e2.id === event.id)) {
        result.push(event);
      }
    });
  }
  
  relatedPartyEvents.value = result
  isShowEventRelatedParties.value = true
}

onMounted(() => {
  setDefaultValues(props.initialData)
  getUsersAsync().then(users => {
    participants.value = [
      ...(users as any[]).map(user => ({
        id: user.uid,
        code: user.code,
        name: user.displayName || '未設定',
        department: user.department || '',
        avatar: user.avatar,
      })),
    ]
    if (!props.initialData) {
      if (props.participantIds) {
        formData.participantIds = [...formData.participantIds, ...props.participantIds];
      } else if (user.value) {
        formData.participantIds.push(user.value.uid);
      }
      formData.participants = participantsMaster.value.filter(p => formData.participantIds.includes(p.id)).map(p => p.name);
      checkConflicts()
    }
  })
  getEquipmentsAsync().then(equipments => {
    equipmentMaster.value = (equipments as any[]).map(equipment => ({
      id: equipment.id,
      code: equipment.code,
      name: equipment.name,
      capacity: equipment.capacity,
      avatar: equipment.imageUrl,
    }))
  })
  getFacilitiesAsync().then(facilities => {
    facilitiesMaster.value = (facilities as any[]).map(facility => ({
      id: facility.id,
      code: facility.code,
      name: facility.name,
      capacity: facility.capacity,
      avatar: facility.imageUrl,
    }))
  })
  getTeamsAsync().then(teams => {
    teamsMaster.value = (teams as any[]).map(team => ({
      id: team.id,
      code: team.code,
      name: team.name,
      members: team.members || [],
      memberCount: team.members?.length || 0
    }))
  })
})
</script>

<style scoped>
/* 全てのスタイルをここに含めます */
.page-container {
  background-color: #f8f9fa;
  /* --background-light */
  color: #212529;
  /* --text-primary */
  line-height: 1.6;
  min-height: 100vh;
  padding: 24px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #ffffff;
  /* --background-white */
  border-radius: 12px;
  /* --radius-lg */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  /* --shadow-md */
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, var(--brand-color-1), var(--brand-color-2), var(--brand-color-3));
  /* --primary-color, --accent-color */
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
  color: #212529;
  /* --text-primary */
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-label .required {
  color: #dc2626;
  /* --danger-color */
  font-size: 12px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  font-size: 14px;
  color: #212529;
  /* --text-primary */
  background-color: #ffffff;
  /* --background-white */
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4361ee;
  /* --primary-color */
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  /* --background-light */
  color: #adb5bd;
  /* --text-light */
  cursor: not-allowed;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.event-type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.event-type-option {
  position: relative;
}

.event-type-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.event-type-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  font-size: 14px;
  font-weight: 500;
}

.event-type-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--event-type-color);
}

.event-type-label:hover {
  border-color: var(--event-type-color);
  background-color: color-mix(in srgb, var(--event-type-color) 10%, white);
}

.event-type-radio:checked+.event-type-label {
  border-color: var(--event-type-color);
  background-color: var(--event-type-color);
  color: white;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--event-type-color) 40%, transparent);
}

.event-type-radio:checked+.event-type-label .event-type-color-dot {
  background-color: white;
}

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
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  font-size: 14px;
  font-weight: 500;
}

.date-type-label:hover {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #eef2ff;
  /* --primary-light */
}

.date-type-radio:checked+.date-type-label {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.time-separator {
  font-weight: 600;
  color: #6c757d;
  /* --text-secondary */
  text-align: center;
}

.date-range-section,
.recurring-section {
  display: grid;
  gap: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  /* --background-light */
  border-radius: 8px;
  /* --radius-md */
}

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
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  font-size: 14px;
  font-weight: 500;
}

.weekday-label:hover {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #eef2ff;
  /* --primary-light */
}

.weekday-checkbox:checked+.weekday-label {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

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

.master-select-section {
  border: 2px dashed #dee2e6;
  /* --border-color */
  border-radius: 8px;
  /* --radius-md */
  padding: 20px;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.master-select-section:hover {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #eef2ff;
  /* --primary-light */
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
  background-color: #eef2ff;
  /* --primary-light */
  color: #4361ee;
  /* --primary-color */
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
  color: #4361ee;
  /* --primary-color */
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.tag-remove:hover {
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

.btn-select-master {
  background-color: transparent;
  color: #4361ee;
  /* --primary-color */
  border: 2px solid #4361ee;
  /* --primary-color */
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-select-master:hover {
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

.conflicts-section {
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  /* --radius-md */
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
  border-radius: 6px;
  /* --radius-sm */
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
  color: #212529;
  /* --text-primary */
}

.conflict-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6c757d;
  /* --text-secondary */
}

.conflict-event {
  font-size: 13px;
  color: #6c757d;
  /* --text-secondary */
}

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
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  font-size: 14px;
  font-weight: 500;
}

.priority-label:hover {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #eef2ff;
  /* --primary-light */
}

.priority-radio:checked+.priority-label {
  border-color: #4361ee;
  /* --primary-color */
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

.priority-radio:checked+.priority-label.low {
  background-color: #22c55e;
  border-color: #22c55e;
}

.priority-radio:checked+.priority-label.medium {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.priority-radio:checked+.priority-label.high {
  background-color: #dc2626;
  border-color: #dc2626;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #dee2e6;
  /* --border-color */
}

.btn {
  padding: 14px 28px;
  border-radius: 6px;
  /* --radius-sm */
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-footer-btn {
  padding: 14px 28px;
  border-radius: 6px;
  /* --radius-sm */
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background-color: #f8f9fa;
  /* --background-light */
  color: #6c757d;
  /* --text-secondary */
  border: 2px solid #dee2e6;
  /* --border-color */
}

.btn-secondary:hover {
  background-color: #dee2e6;
  /* --border-color */
  color: #212529;
  /* --text-primary */
}

.btn-primary {
  background-color: #4361ee;
  /* --primary-color */
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  /* --shadow-sm */
}

.btn-primary:hover {
  background-color: #3a53c4;
  /* --primary-hover */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  /* --shadow-md */
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background-color: #adb5bd;
  /* --text-light */
  cursor: not-allowed;
  transform: none;
}

.form-error {
  color: #dc2626;
  /* --danger-color */
  font-size: 13px;
  margin-top: 4px;
}

.form-group.error .form-input,
.form-group.error .form-textarea,
.form-group.error .form-select {
  border-color: #dc2626;
  /* --danger-color */
}

.modal-header {
  padding: 12px 24px;
}

.modal-body {
  padding: 24px;
  flex-grow: 1;
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
  color: #6c757d;
  /* --text-secondary */
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.search-input:focus {
  outline: none;
  border-color: #4361ee;
  /* --primary-color */
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.selection-list {
  display: grid;
  gap: 8px;
  flex-grow: 1;
  overflow-y: auto;
}

.no-results {
  text-align: center;
  color: #6c757d;
  /* --text-secondary */
  padding: 40px 0;
}

.selection-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.selection-item:hover {
  background-color: #f8f9fa;
  /* --background-light */
  border-color: #4361ee;
  /* --primary-color */
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
  color: #212529;
  /* --text-primary */
}

.selection-meta {
  font-size: 13px;
  color: #6c757d;
  /* --text-secondary */
  margin-top: 2px;
}

.selection-conflict {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #dc2626;
  /* --danger-color */
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  height: 65px;
  padding: 12px;
  border-top: 1px solid #dee2e6;
  /* --border-color */
}

.notification {
  position: fixed;
  top: 80px;
  right: 24px;
  background-color: #22c55e;
  /* --success-color */
  color: white;
  padding: 16px 24px;
  border-radius: 6px;
  /* --radius-sm */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  /* --shadow-lg */
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.notification.error {
  background-color: #dc2626;
  /* --danger-color */
}

.icon {
  font-size: 16px;
  line-height: 1;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
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

.privacy-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  /* --background-light */
  border-radius: 8px;
  /* --radius-md */
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.privacy-option:has(.privacy-checkbox:checked) {
  border-color: #4361ee;
  /* --primary-color */
  background-color: color-mix(in srgb, #4361ee 8%, white);
}

.privacy-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  accent-color: #4361ee;
  /* --primary-color */
  cursor: pointer;
}

.privacy-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.privacy-text {
  font-weight: 600;
  color: #212529;
  /* --text-primary */
}

.form-helper-text {
  font-size: 13px;
  color: #6c757d;
  /* --text-secondary */
  line-height: 1.5;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  /* --text-primary */
  margin-left: 20px;
  display: flex;
  align-items: center;
}

.list-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 20px;
  background-color: #4361ee;
  /* --primary-color */
  margin-right: 10px;
  border-radius: 2px;
}

.modal-view-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #dee2e6;
  /* --border-color */
}

.modal-view-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #6c757d;
  /* --text-secondary */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  transition: color 0.2s ease-in-out;
}

.modal-view-tab::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4361ee;
  /* --primary-color */
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.modal-view-tab.active {
  color: #4361ee;
  /* --primary-color */
}

.modal-view-tab.active::after {
  transform: scaleX(1);
}

.team-selection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #dee2e6;
  /* --border-color */
  border-radius: 6px;
  /* --radius-sm */
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.team-selection-item:hover {
  background-color: #f8f9fa;
  /* --background-light */
}

/* time input - from/to wrappers and allday button (visual only) */
.time-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* start / separator / end */
  gap: 8px;
  align-items: center;
}

.time-from-wrapper,
.time-to-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* ensure inputs take full available width inside wrappers */
.time-inputs .form-input {
  width: 100%;
  box-sizing: border-box;
}

.btn-allday {
  background-color: #f1f5f9; /* light gray */
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: default; /* visual only */
}

.btn-allday:hover {
  background-color: #e2e8f0;
}

/* small allday button placed next to the time label */
.time-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.time-label-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-allday-small {
  appearance: none;
  background-color: transparent;
  color: #000000;
  /* --primary-color */
  border: 2px solid #e2e8f0;
  /* --primary-color */
  padding: 0px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

/* hover style similar to btn-select-master */
.btn-allday-small:hover {
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}


.btn-add-team {
  background-color: #eef2ff;
  /* --primary-light */
  color: #4361ee;
  /* --primary-color */
  border: none;
  border-radius: 6px;
  /* --radius-sm */
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease-in-out;
  /* --transition */
}

.btn-add-team:hover {
  background-color: #4361ee;
  /* --primary-color */
  color: white;
}

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

  .form-group.row {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .event-type-options,
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

  .selection-list {
    flex-grow: 1;
  }
}
</style>