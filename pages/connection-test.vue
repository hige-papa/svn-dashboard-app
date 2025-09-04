<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <p class="page-subtitle">SQLServer接続テスト</p>
        <p class="page-description">
          ローカルSQL Server（COTA-NA-NOTE）に対する接続テストを実行します。<br>
          データベース：SampleDb、認証方式：SQL認証（ユーザー：svn）<br>
          テーブル「DB基本情報」から上位100件のデータを取得して表示します。
        </p>
      </div>
      
      <div class="content">
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="mdi mdi-database-check icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ loading ? '...' : data?.count || 0 }}</div>
              <div class="stat-label">取得件数</div>
            </div>
          </div>
        </div>
        
        <div class="data-table-section">
          <v-card>
            <v-card-title>
              <span class="text-h6">DB基本情報（上位100件）</span>
            </v-card-title>
            
            <v-data-table
              :headers="headers"
              :items="items"
              :loading="loading"
              :items-per-page="25"
              class="elevation-1"
              loading-text="データを読み込み中..."
              no-data-text="データがありません"
            >
            </v-data-table>
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
}

const loading = ref(true);
const error = ref<string | null>(null);
const errorDetails = ref<any>(null);
const data = ref<ApiResponse | null>(null);
const items = ref<any[]>([]);
const headers = ref<any[]>([]);

// データ取得関数
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  errorDetails.value = null;
  
  try {
    const response = await $fetch<ApiResponse>('/api/connection-test');
    data.value = response;
    items.value = response.data || [];
    
    // ヘッダーを動的に生成
    if (items.value.length > 0) {
      headers.value = Object.keys(items.value[0]).map(key => ({
        title: key,
        key: key,
        sortable: true
      }));
    }
  } catch (err: any) {
    console.error('データ取得エラー:', err);
    error.value = err.data?.message || 'データの取得に失敗しました';
    errorDetails.value = err.data || null;
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

.error-section {
  margin-top: 20px;
}
</style>
