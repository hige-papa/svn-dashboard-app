<template>
  <!-- <div v-if="isDevelopment" class="debug-controls mb-2" style="display: flex; gap: 8px; justify-content: flex-end;">
    <v-btn size="small" color="warning" variant="outlined" @click="handleClearCache">
      <v-icon start>mdi-cached</v-icon>
      キャッシュクリア
    </v-btn>
    <v-btn size="small" color="info" variant="outlined" @click="handleShowProfiler">
      <v-icon start>mdi-chart-line</v-icon>
      パフォーマンス測定結果
    </v-btn>
  </div> -->

  <div class="calendar-container w-100 table_box">
    <v-table class="table-field">
      <thead>
        <tr>
          <td class="day-header sticky corner">メンバー</td>
          <td v-for="day in weekDays" :key="dateToDateString(day)" :class="[
            'day-header',
            { 'today-header': isToday(day) }
          ]">
            <div :class="[
              'day-name',
              {
                'sunday': day.getDay() === 0,
                'saturday': day.getDay() === 6,
                'holiday': getHolidayName(day)
              }
            ]">
              {{ getDayOfWeek(day) }}曜日<span v-if="getHolidayName(day)" class="holiday-indicator">（祝）</span>
            </div>
            <div class="d-flex align-center justify-center gap-3">
              <div class="day-date">{{ formatShortDate(day) }}</div>
              <v-chip v-if="getOfficeCountOptimized(day) > 0" size="small" color="primary" variant="outlined"
                class="office-count-chip">
                <v-icon icon="mdi-office-building" size="x-small" class="mr-1"></v-icon>
                {{ getOfficeCountOptimized(day) }}人
              </v-chip>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, rowIndex) in weeklyScheduleData" :key="row.id">
          <tr class="schedule-row">
            <td class="user-cell sticky">
              <div class="d-flex align-center justify-center mb-2">
                <v-avatar color="grey">
                  <v-img v-if="row.avatar" :src="row.avatar"></v-img>
                  <v-icon v-else :icon="row.icon" size="x-large"></v-icon>
                </v-avatar>
              </div>
              <div class="user-name">{{ row.name }}</div>
              <div v-if="row.extension" class="user-extension">内線：{{ row.extension }}</div>
            </td>
            
            <td v-for="(cell, cellIndex) in row.days" :key="cell.dateString"
              :class="['day-cell', { 'today-cell': cell.isToday }]" 
              @click="row.type === 'user' ? handleSelectDay(row.user, cell.date) : null">
              
              <div v-if="row.type === 'user'" class="mt-1">
                <v-tooltip text="勤務形態" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" :icon="cell.workStyleDetails?.icon" :color="cell.workStyleDetails?.color"
                      :size="cell.workStyleDetails?.size">
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ランチ" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" :icon="cell.lunchDetails?.icon"
                      :color="cell.lunchDetails?.color" :size="cell.lunchDetails?.size"
                      class="ml-2">
                    </v-icon>
                  </template>
                </v-tooltip>
                <v-tooltip text="ディナー" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" :icon="cell.dinnerDetails?.icon"
                      :color="cell.dinnerDetails?.color" :size="cell.dinnerDetails?.size"
                      class="ml-2">
                    </v-icon>
                  </template>
                </v-tooltip>
              </div>
              
              <div v-for="(event, index) in cell.visibleEvents" :key="event.id"
                :class="['event', 'event-type']"
                :style="{ '--event-color': isViewable(event) ? `${eventTypeDetails[event.eventType]?.color}` : 'grey' }">
                <template v-if="isViewable(event)">
                  <div v-if="event.conflicted" class="pa-0 ma-0 d-flex align-center">
                    <v-icon icon="mdi-alert-circle" size="small" color="warning"
                      class="mr-1"></v-icon>
                    <span class="text-warning" style="font-size: 10px;">重複予定あり</span>
                  </div>
                  <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                  <div class="event-title">{{ event.title }}</div>
                </template>
                <template v-else>
                  <div class="event-time-range">{{ event.startTime }}-{{ event.endTime }}</div>
                  <div class="event-title">予定あり</div>
                </template>
              </div>

              <!-- <div 
                v-if="cell.allEvents.length > cell.visibleEvents.length" 
                class="more-events"
              >
                +{{ cell.allEvents.length - cell.visibleEvents.length }}件
              </div> -->
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCalendar, getMasterDataCache, getMasterDataCacheAsync } from '~/composables/useCalendar';
import { useConstants } from '~/composables/common/useConstants';
import { printFirestoreDebugSummary, resetFirestoreProfiler } from '~/composables/firebase/useFirestore';
import type { User } from 'firebase/auth';

const user = useState<User>('user');

// 開発環境判定
const isDevelopment = computed(() => process.env.NODE_ENV === 'development');

// 型定義は親コンポーネントまたはグローバルで定義されていると仮定し、ここでは割愛します
type Props = {
  users: ExtendedUserProfile[];
  company?: any;
  facilities?: any[];
  equipments?: any[];
  weekDays: Date[];
  events: EventDisplay[];
  dailyOptions: DailyUserOption[];
  holidays: Holiday[];
  getUserSchedulesForDay?: (userId: string, date: Date | null) => EventDisplay[];
};

const props = defineProps<Props>();

const emit = defineEmits(['dayClick']);

const masterDataCache = getMasterDataCache();

// ヘルパー関数: Dateオブジェクトを 'YYYY-MM-DD' 形式の文字列に変換
const dateToDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ヘルパー関数: リソースIDと日付から一意のキーを生成
const createResourceKey = (type: RowType, id: string, dateStr: string): string => {
  return `${type}_${id}_${dateStr}`;
};

const isViewable = (event: EventDisplay) => {
  return event.private ? (event.participantIds?.includes(user.value.uid)) ?? false : true
}

const {
  eventTypeDetails,
  workstyleDetails,
  participationLunchStatusDetails,
  participationDinnerStatusDetails,
} = useConstants()

const {
  getDayOfWeek,
  formatShortDate,
  formatDateForDb,
} = useCalendar();

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const getHolidayName = (date: Date): string => {
  return props.holidays.find(h => h.date === formatDateForDb(date))?.name || '';
};

type RowType = 'user' | 'company' | 'facility' | 'equipment'

// --- **最適化 1: 日次オプションの事前インデックス化** ---
const dailyOptionMap = computed<Record<string, DailyUserOption>>(() => {
  const map: Record<string, DailyUserOption> = {};
  if (!props.dailyOptions) return map;

  props.dailyOptions.forEach(option => {
    const key = `${option.uid}_${option.date}`;
    map[key] = option;
  });
  return map;
});

const getDailyOptionsOptimized = (uid: string, date: Date): DailyUserOption | undefined => {
  const dateStr = dateToDateString(date);
  const key = `${uid}_${dateStr}`;
  return dailyOptionMap.value[key];
}

// 指定日の出社人数を集計（getDailyOptionsOptimizedを利用するため高速化）
const visibleUsers = computed(() => {
  return props.users.filter(u => u.visible);
});

const getOfficeCountOptimized = (date: Date) => {
  return visibleUsers.value.filter(user => {
    const workStyle = getDailyOptionsOptimized(user.uid, date)?.workStyle;
    return workStyle === 'office';
  }).length;
}

// --- **最適化 2: イベントの事前インデックス化 & 重複チェック** ---

// イベントが時間的に重複しているかチェックするヘルパー
const checkTimeConflict = (eventA: EventDisplay, eventB: EventDisplay): boolean => {
    const parseTime = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m; // 分単位に変換
    };

    const startA = parseTime(eventA.startTime);
    const endA = parseTime(eventA.endTime);
    const startB = parseTime(eventB.startTime);
    const endB = parseTime(eventB.endTime);

    // 時間が重複しているか: (Aの開始 < Bの終了) かつ (Aの終了 > Bの開始)
    return (startA < endB && endA > startB);
};

const eventsByResourceIdAndDate = computed<Record<string, EventDisplay[]>>(() => {
  const map: Record<string, EventDisplay[]> = {};
  const processedEvents = new Map<string, EventDisplay>(props.events.map(e => [e.id, { ...e, conflicted: false }]));

  if (!props.events || !Array.isArray(props.events)) {
    return map;
  }

  // 1. 重複チェックを行いながら、リソースごとにイベントをマップに格納
  props.events.forEach(event => {
    const dateKey = event.date; 
    if (!dateKey) return;

    // リソースタイプとIDのリスト
    const resourceKeys: { type: RowType; id: string; }[] = [];

    // ユーザー
    event.participantIds?.forEach(id => resourceKeys.push({ type: 'user', id }));
    
    // 会社 (company.idがparticipantIdsに含まれる場合を考慮)
    if (props.company && event.participantIds?.includes(props.company.id)) {
      resourceKeys.push({ type: 'company', id: props.company.id });
    }
    
    // 施設
    event.facilityIds?.forEach(id => resourceKeys.push({ type: 'facility', id }));
    
    // 備品
    event.equipmentIds?.forEach(id => resourceKeys.push({ type: 'equipment', id }));
    
    // 2. マップへの格納と重複チェック
    resourceKeys.forEach(({ type, id }) => {
      const key = createResourceKey(type, id, dateKey);
      
      if (!map[key]) {
        map[key] = [];
      } else {
        // 重複チェック: 既にマップにあるイベントと時間帯が重複するか確認
        map[key].forEach(existingEvent => {
          if (checkTimeConflict(event, existingEvent)) {
            // 重複フラグを両方のイベントに設定
            processedEvents.get(event.id)!.conflicted = true;
            processedEvents.get(existingEvent.id)!.conflicted = true;
          }
        });
      }
      // マップにはまだ conflicted フラグが更新されていないイベントを追加
      map[key].push(event);
    });
  });

  // 3. 最終的なマップの値を processedEvents の更新済みデータに置き換える
  const finalMap: Record<string, EventDisplay[]> = {};
  for (const key in map) {
    const events = map[key];
    finalMap[key] = events.map(e => processedEvents.get(e.id)!).sort((a, b) => {
        // 表示順序をstartTimeでソート
        return a.startTime.localeCompare(b.startTime);
    });
  }

  return finalMap;
});

// ハッシュマップからイベントを取得
const getUserEventsForDayOptimized = (type: RowType, id: string, date: Date): EventDisplay[] => {
  if (type === 'user' && props.getUserSchedulesForDay) {
    try {
      return props.getUserSchedulesForDay(id, date);
    } catch (e) {
      console.warn('[WeeklyCalendarView] props.getUserSchedulesForDay threw error, falling back to local filter', e);
    }
  }

  const dateStr = dateToDateString(date);
  const key = createResourceKey(type, id, dateStr);
  return eventsByResourceIdAndDate.value[key] || [];
};

// ----------------------------------------------------------------------
// --- **最適化 3: 全表示データの事前集約** ---

const getRowData = (resource: any, type: RowType) => {
  const isUser = type === 'user';
  const resourceId = isUser ? resource.uid : resource.id;

  return {
    id: resourceId,
    type: type,
    user: isUser ? resource : null,
    name: resource.displayName || resource.name,
    avatar: resource.avatar,
    extension: resource.extension,
    icon: type === 'user' ? 'mdi-account' : 
          type === 'company' ? 'mdi-domain' : 
          type === 'facility' ? 'mdi-sofa' : 'mdi-tools',
    days: props.weekDays.map(date => {
      const dateStr = dateToDateString(date);
      const allEvents = getUserEventsForDayOptimized(type, resourceId, date);
      const visibleEvents = allEvents //allEvents.slice(0, 2);

      // ユーザー固有の情報
      let workStyleDetails = null;
      let lunchDetails = null;
      let dinnerDetails = null;
      if (isUser) {
        const dailyOption = getDailyOptionsOptimized(resourceId, date);
        const workStyle = dailyOption?.workStyle;
        const lunchParticipation = dailyOption?.lunchParticipation;
        const dinnerParticipation = dailyOption?.dinnerParticipation;
        
        workStyleDetails = workstyleDetails[workStyle ?? 'pending'];
        lunchDetails = participationLunchStatusDetails[lunchParticipation ?? 'pending'];
        dinnerDetails = participationDinnerStatusDetails[dinnerParticipation ?? 'pending'];
      }

      return {
        date,
        dateString: dateStr,
        isToday: isToday(date),
        allEvents,
        visibleEvents,
        workStyleDetails,
        lunchDetails,
        dinnerDetails
      };
    })
  };
};

const me = computed(() => {
  return visibleUsers.value?.find(u => u.uid === user.value.uid) ?? undefined
})

const sortedUser = computed(() => {
  return visibleUsers.value.filter(u => u.uid != user.value.uid).sort((a, b) => {
    // ... (ソートロジックは変更なし)
    if (a.uid === user.value.uid && b.uid !== user.value.uid) return -1;
    if (b.uid === user.value.uid && a.uid !== user.value.uid) return 1;

    const sortOrderA = a.sortOrder || '';
    const sortOrderB = b.sortOrder || '';
    if (sortOrderA !== sortOrderB) {
      return sortOrderA.localeCompare(sortOrderB);
    }

    const group1Departments = ['営業部', 'システム部', '総務部'];
    const isGroup1A = group1Departments.includes(a.department || '');
    const isGroup1B = group1Departments.includes(b.department || '');

    if (isGroup1A && !isGroup1B) return -1;
    if (!isGroup1A && isGroup1B) return 1;

    const codeA = a.code || '';
    const codeB = b.code || '';
    return codeA.localeCompare(codeB);
  });
})

// すべての行データを描画前に一度だけ計算して格納する（メインの算出プロパティ）
const weeklyScheduleData = computed(() => {
  const data = [];
  
  if (me.value) {
    data.push(getRowData(me.value, 'user'));
  }
  if (props.company) {
    data.push(getRowData(props.company, 'company'));
  }
  if (props.facilities?.length) {
    props.facilities.forEach(f => data.push(getRowData(f, 'facility')));
  }
  if (props.equipments?.length) {
    props.equipments.forEach(e => data.push(getRowData(e, 'equipment')));
  }
  sortedUser.value.forEach(u => data.push(getRowData(u, 'user')));

  return data;
});

// 各日ごとに表示するイベントを制限
const getVisibleEvents = (events: EventDisplay[], limit: number = 2) => {
  return events.slice(0, limit);
};

const handleSelectDay = (user: ExtendedUserProfile, date: Date) => {
  emit('dayClick', { user: user, date: date })
}

// ----------------------------------------------------------------------
// onMounted & Debug functions

onMounted(() => {
  console.log('[WeeklyCalendarView] mounted at', new Date().toISOString());
  try {
    console.log('[WeeklyCalendarView] initial props.events.length =', Array.isArray(props.events) ? props.events.length : 0);
    console.log('[WeeklyCalendarView] initial props.dailyOptions.length =', Array.isArray(props.dailyOptions) ? props.dailyOptions.length : 0);
  } catch (e) {
    // ignore
  }
  setTimeout(() => {
    console.group('[WeeklyCalendarView] performance summary');
    console.log('Component mounted and props loaded');
    console.log('Cache status: users cached?', masterDataCache.value.has('users'));
    console.log('Cache status: holidays cached?', masterDataCache.value.has('holidays'));
    console.groupEnd();
    try {
      printFirestoreDebugSummary();
    } catch (e) {
      console.warn('Failed to call printFirestoreDebugSummary', e);
    }
  }, 500);
});

const handleClearCache = async () => {
  console.log('[Debug] Clearing master data cache...');
  masterDataCache.value.clear();
  resetFirestoreProfiler();
  console.log('[Debug] Cache cleared. Reloading data...');
  
  try {
    await Promise.all([
      getMasterDataCacheAsync('users', true),
      getMasterDataCacheAsync('holidays', true),
    ]);
    console.log('[Debug] Data reloaded successfully');
  } catch (error) {
    console.error('[Debug] Failed to reload data:', error);
  }
};

const handleShowProfiler = () => {
  console.log('[Debug] Showing profiler summary...');
  printFirestoreDebugSummary(true);
};
</script>

<style scoped>
/* スタイル部分は変更なし */

.calendar-container {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: 100%;
}

.user-cell {
  flex: 1;
  text-align: center;
  vertical-align: middle;
  border-right: 1px solid var(--border-color);
  max-width: 176.5px;
  overflow: hidden;
  background-color: #FFF;
  z-index: 30;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  white-space: nowrap;
}

.user-extension {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 2px;
}

.day-header {
  height: 60px;
  background-color: var(--background-light);
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  min-width: 110px;
  text-align: center;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.day-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.sunday {
  color: var(--accent-color);
}

.saturday {
  color: var(--primary-color);
}

.holiday {
  color: var(--accent-color);
}

.holiday-indicator {
  color: var(--accent-color);
}

.today-header {
  background-color: var(--primary-light);
  border-bottom: 2px solid var(--primary-color);
}

.schedule-row {
  height: 105px;
  min-height: 80px;
  width: 100%;
  vertical-align: top;
}

.day-cell {
  flex: 1;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  min-width: 174.5px;
  max-width: 174.5px;
  overflow: hidden;
}

.day-cell:last-child {
  border-right: none;
}

.schedule-row:last-child .day-cell {
  border-bottom: none;
}

.today-cell {
  background-color: var(--primary-light);
}

.event {
  border-radius: var(--radius-sm);
  margin-top: 5px;
  padding: 4px 8px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  z-index: 10;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.event:last-child {
  margin-bottom: 5px;
}

.event:hover {
  z-index: 20;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.event-time-range {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-title {
  font-size: 11px;
  line-height: 1.2;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-type {
  background-color: color-mix(in srgb, var(--event-color) 15%, #FFF);
  border-left: 4px solid var(--event-color);
}

.table-field {
  width: 100%;
  table-layout: fixed;
}

.table_box {
  overflow-x: auto;
}

.sticky {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
}

.sticky.corner {
  z-index: 2;
}

@media (max-width: 768px) {
  .user-cell {
    max-width: 120px;
  }

  .user-name {
    font-size: 12px;
  }

  .user-extension {
    font-size: 11px;
    color: var(--text-secondary);
    text-align: center;
    margin-top: 2px;
  }

  .day-cell {
    min-width: 110px;
  }

  .day-name,
  .day-date {
    font-size: 12px;
  }
}

.more-events {
  margin-top: 5px;
  font-size: 11px;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
  text-align: center;
}
</style>