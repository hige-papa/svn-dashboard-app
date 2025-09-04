<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">SQLServer接続テスト</p>
        <p class="page-description">
          ローカルSQL Server（COTA-NA-NOTE）に対する接続テストを実行します。<br>
          データベース：SampleDb、認証方式：SQL認証（ユーザー：svn）<br>
          テーブル「DB基本情報」から100件ずつデータを取得し、スクロールで追加読み込みします。
        </p>
      </div>
      
      <div class="content">
        <!-- データソース選択ボタン -->
        <div class="datasource-section">
          <v-card>
            <v-card-title>
              <span class="text-h6">データソース選択</span>
            </v-card-title>
            <v-card-text>
              <v-btn-toggle
                v-model="dataSource"
                variant="outlined"
                mandatory
                @update:model-value="onDataSourceChange"
              >
                <v-btn value="table">
                  <v-icon left>mdi-table</v-icon>
                  Table
                </v-btn>
                <v-btn value="view">
                  <v-icon left>mdi-eye</v-icon>
                  View
                </v-btn>
                <v-btn value="sp">
                  <v-icon left>mdi-cog</v-icon>
                  SP
                </v-btn>
              </v-btn-toggle>
              
              <!-- ストアドプロシージャ用パラメータ入力 -->
              <v-expand-transition>
                <div v-show="showParameters" class="parameter-section">
                  <v-row class="mt-4">
                    <v-col cols="12">
                      <div class="parameter-title">請求番号範囲指定</div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="minValue"
                        type="number"
                        label="最小値（任意）"
                        placeholder="未入力可"
                        variant="outlined"
                        density="compact"
                        :error-messages="parameterError"
                        @keydown.enter="fetchData"
                        clearable
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="1" class="d-flex align-center justify-center">
                      <span class="text-h6">～</span>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="maxValue"
                        type="number"
                        label="最大値（任意）"
                        placeholder="未入力可"
                        variant="outlined"
                        density="compact"
                        :error-messages="parameterError"
                        @keydown.enter="fetchData"
                        clearable
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3" class="d-flex align-center">
                      <v-btn
                        @click="fetchData"
                        color="primary"
                        variant="elevated"
                        :loading="loading"
                        :disabled="!!parameterError"
                        prepend-icon="mdi-refresh"
                      >
                        更新
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </div>
        
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="mdi mdi-database-check icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ loading ? '...' : totalDisplayed || 0 }}</div>
              <div class="stat-label">表示件数</div>
            </div>
          </div>
        </div>
        
        <div class="data-table-section">
          <v-card>
            <v-card-title>
              <span class="text-h6">{{ getDataSourceTitle() }}</span>
              <v-spacer></v-spacer>
              <span class="text-subtitle-2">
                {{ totalDisplayed }}件 / {{ totalCount }}件
                <span v-if="hasMore" class="text-caption text-grey">(スクロールで続きを読み込み)</span>
              </span>
            </v-card-title>
            
            <div class="table-container" ref="tableContainer" @scroll="handleScroll">
              <!-- SPでデータがない場合の案内メッセージ -->
              <div v-if="dataSource === 'sp' && items.length === 0 && !loading" class="sp-instruction">
                <v-alert
                  type="info"
                  variant="tonal"
                  prominent
                >
                  <v-alert-title>ストアドプロシージャ検索</v-alert-title>
                  <p>請求番号の範囲を指定して「更新」ボタンを押してください。</p>
                  <p class="text-caption">※ 最小値・最大値は両方とも未入力でも検索可能です（全件取得）</p>
                  <p class="text-caption">※ どちらか片方のみの入力も可能です</p>
                </v-alert>
              </div>
              
              <v-data-table
                :headers="headers"
                :items="items"
                :loading="loading"
                :items-per-page="-1"
                hide-default-footer
                class="elevation-1"
                loading-text="データを読み込み中..."
                no-data-text="データがありません"
              >
              </v-data-table>
              
              <!-- 追加読み込み中のローディング -->
              <div v-if="loadingMore" class="loading-more">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="24"
                ></v-progress-circular>
                <span class="ml-2">追加データを読み込み中...</span>
              </div>
              
              <!-- 全件読み込み完了メッセージ -->
              <div v-if="!hasMore && totalDisplayed > 0" class="all-loaded">
                <v-icon color="success">mdi-check-circle</v-icon>
                <span class="ml-2">すべてのデータを読み込みました（{{ totalDisplayed }}件）</span>
              </div>
            </div>
          </v-card>
        </div>
        
        <div v-if="error" class="error-section">
          <v-alert
            type="error"
            variant="tonal"
            closable
            @click:close="error = null"
          >
            <v-alert-title>接続エラー</v-alert-title>
            <div class="error-details">
              <p><strong>{{ errorDetails?.message || error }}</strong></p>
              <p v-if="errorDetails?.troubleshooting" class="troubleshooting">
                <v-icon size="small">mdi-lightbulb-outline</v-icon>
                {{ errorDetails.troubleshooting }}
              </p>
              <div v-if="errorDetails?.serverAttempted" class="connection-info">
                <small>
                  接続試行先: {{ errorDetails.serverAttempted }} / {{ errorDetails.database }}
                </small>
              </div>
              <div v-if="errorDetails?.dataSource" class="datasource-info">
                <small>
                  データソース: {{ errorDetails.dataSource }}
                </small>
              </div>
              <!-- デバッグ情報 -->
              <details v-if="errorDetails" class="debug-info mt-2">
                <summary class="text-caption">詳細情報（デバッグ用）</summary>
                <pre class="text-caption mt-1">{{ JSON.stringify(errorDetails, null, 2) }}</pre>
              </details>
            </div>
            <template v-slot:append>
              <v-btn @click="fetchData" size="small" variant="outlined">
                再試行
              </v-btn>
            </template>
          </v-alert>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ApiResponse {
  success: boolean;
  data: any[];
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  dataSource?: string;
}

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const errorDetails = ref<any>(null);
const data = ref<ApiResponse | null>(null);
const items = ref<any[]>([]);
const headers = ref<any[]>([]);
const currentPage = ref(1);
const totalCount = ref(0);
const hasMore = ref(true);
const tableContainer = ref<HTMLElement | null>(null);

// データソース関連
const dataSource = ref<'table' | 'view' | 'sp'>('table');
const minValue = ref<number | null>(null);
const maxValue = ref<number | null>(null);

// 計算プロパティ
const totalDisplayed = computed(() => items.value.length);
const showParameters = computed(() => dataSource.value === 'sp');
const parameterError = computed(() => {
  if (dataSource.value === 'sp') {
    // 両方に値が入力されている場合のみ、min ≤ max をチェック
    const hasMinValue = minValue.value !== null && minValue.value !== undefined;
    const hasMaxValue = maxValue.value !== null && maxValue.value !== undefined;
    
    if (hasMinValue && hasMaxValue && Number(minValue.value) > Number(maxValue.value)) {
      return '最小値は最大値以下である必要があります';
    }
  }
  return null;
});

// データソース別のタイトルを取得
const getDataSourceTitle = () => {
  switch (dataSource.value) {
    case 'table': return 'DB基本情報（テーブル）';
    case 'view': return 'VW基本情報（ビュー）';
    case 'sp': return 'SP基本情報（ストアドプロシージャ）';
    default: return 'データベース情報';
  }
};

// データソース切り替え時の処理
const onDataSourceChange = () => {
  console.log('データソース変更:', dataSource.value);
  
  // SP以外の場合はパラメータをクリア
  if (dataSource.value !== 'sp') {
    minValue.value = null;
    maxValue.value = null;
    // SP以外の場合は自動でデータを再取得
    fetchData();
  } else {
    // SPの場合は自動取得せず、ユーザーの入力と更新ボタンを待つ
    items.value = [];
    totalCount.value = 0;
    hasMore.value = true;
  }
};

// スクロールイベントハンドラー
const handleScroll = async (event: Event) => {
  if (loadingMore.value || !hasMore.value) return;
  
  const target = event.target as HTMLElement;
  const scrollTop = target.scrollTop;
  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;
  
  // 底部まで100px以内になったら次のページを読み込み
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    await loadMoreData();
  }
};

// 追加データの読み込み
const loadMoreData = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  
  try {
    const nextPage = currentPage.value + 1;
    const params = new URLSearchParams({
      page: nextPage.toString(),
      limit: '100',
      dataSource: dataSource.value
    });
    
    // SPの場合はパラメータを追加
    if (dataSource.value === 'sp') {
      if (minValue.value !== null) params.append('minValue', minValue.value.toString());
      if (maxValue.value !== null) params.append('maxValue', maxValue.value.toString());
    }
    
    console.log('フロントエンド: 追加データ取得開始', {
      page: nextPage,
      dataSource: dataSource.value,
      url: `/api/connection-test?${params.toString()}`
    });
    
    const response = await $fetch<ApiResponse>(`/api/connection-test?${params.toString()}`);
    
    console.log('フロントエンド: 追加データ取得成功', response);
    
    if (response.success && response.data.length > 0) {
      // 既存のデータに新しいデータを追加
      items.value.push(...response.data);
      currentPage.value = nextPage;
      hasMore.value = response.hasMore;
      totalCount.value = response.totalCount;
      
      console.log(`ページ${nextPage}のデータを追加: ${response.data.length}件`);
    } else {
      hasMore.value = false;
    }
  } catch (err: any) {
    console.error('フロントエンド: 追加データ取得エラー', {
      error: err,
      message: err?.message,
      data: err?.data
    });
    error.value = '追加データの取得に失敗しました';
  } finally {
    loadingMore.value = false;
  }
};

// データ取得関数（初回読み込み用）
const fetchData = async () => {
  // パラメータバリデーション
  if (parameterError.value) {
    error.value = parameterError.value;
    return;
  }
  
  loading.value = true;
  error.value = null;
  errorDetails.value = null;
  items.value = [];
  currentPage.value = 1;
  hasMore.value = true;
  
  try {
    const params = new URLSearchParams({
      page: '1',
      limit: '100',
      dataSource: dataSource.value
    });
    
    // SPの場合はパラメータを追加
    if (dataSource.value === 'sp') {
      if (minValue.value !== null) params.append('minValue', minValue.value.toString());
      if (maxValue.value !== null) params.append('maxValue', maxValue.value.toString());
    }
    
    console.log('フロントエンド: データ取得開始', {
      dataSource: dataSource.value,
      url: `/api/connection-test?${params.toString()}`
    });
    
    const response = await $fetch<ApiResponse>(`/api/connection-test?${params.toString()}`);
    
    console.log('フロントエンド: データ取得成功', response);
    
    data.value = response;
    items.value = response.data || [];
    totalCount.value = response.totalCount || 0;
    hasMore.value = response.hasMore;
    
    // ヘッダーを動的に生成
    if (items.value.length > 0) {
      headers.value = Object.keys(items.value[0]).map(key => ({
        title: key,
        key: key,
        sortable: true
      }));
    }
  } catch (err: any) {
    console.error('フロントエンド: データ取得エラー', {
      error: err,
      message: err?.message,
      data: err?.data,
      statusCode: err?.statusCode
    });
    
    error.value = err.data?.message || err?.message || 'データの取得に失敗しました';
    errorDetails.value = err.data || { message: err?.message || 'Unknown error' };
  } finally {
    loading.value = false;
  }
};

// ページロード時にデータを取得
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.page-subtitle {
  font-size: 28px;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

.page-description {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  line-height: 1.6;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.datasource-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.parameter-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
  margin-top: 16px;
}

.parameter-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.stats-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-width: 200px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .icon {
  font-size: 24px;
  color: #1976d2;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.data-table-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-container {
  max-height: 600px;
  overflow-y: auto;
}

.sp-instruction {
  padding: 20px;
  margin-bottom: 16px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  color: #666;
  font-size: 14px;
}

.all-loaded {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #e8f5e8;
  border-top: 1px solid #c8e6c9;
  color: #2e7d32;
  font-size: 14px;
  font-weight: 500;
}

.error-section {
  margin-top: 20px;
}

.debug-info {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
