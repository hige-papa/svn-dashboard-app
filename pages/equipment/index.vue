<template>
  <div class="page-container">
    <div class="container">
      <div class="header">
        <!-- <h1 class="app-title">TASCAL</h1> -->
        <p class="page-subtitle">備品管理</p>
      </div>
      
      <div class="content">
        <div class="search-filter-section">
          <div class="search-box">
            <i class="mdi mdi-magnify icon"></i>
            <input 
              v-model="searchQuery"
              type="text" 
              class="search-input" 
              placeholder="コード、名称で検索..."
              @input="filterItems"
            >
          </div>
          
          <div class="filter-controls">
            <button @click="navigateToItemForm" class="btn btn-primary">
              <i class="mdi mdi-plus icon"></i>
              新規備品
            </button>
          </div>
        </div>
        
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="mdi mdi-archive-outline icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalItems }}</div>
              <div class="stat-label">総備品種類</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon active">
              <i class="mdi mdi-package-variant-closed icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalCapacity }}</div>
              <div class="stat-label">総在庫数</div>
            </div>
          </div>
          
           <div class="stat-card">
            <div class="stat-icon departments">
               <i class="mdi mdi-tag-multiple-outline icon"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ categories.length }}</div>
              <div class="stat-label">カテゴリ数</div>
            </div>
          </div>
        </div>
        
        <div class="items-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="mdi mdi-format-list-bulleted-square icon"></i>
              備品一覧
              <span class="item-count">（{{ filteredItems.length }}件）</span>
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
          
          <div v-if="viewMode === 'grid'" class="items-grid">
            <div v-if="filteredItems.length === 0" class="no-results">
              <i class="mdi mdi-archive-search-outline icon"></i>
              <p>該当する備品が見つかりません</p>
            </div>
            
            <div 
              v-for="item in paginatedItems" 
              :key="item.id"
              class="item-card"
              @click="viewItemDetail(item)"
            >
              <div class="item-image-container">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="item-image">
                <div v-else class="image-placeholder">
                  <i class="mdi mdi-camera-off icon"></i>
                </div>
              </div>
              
              <div class="item-info">
                <p class="item-code">{{ item.code }}</p>
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-description">{{ item.description }}</p>
                
                <div class="item-meta">
                   <span class="capacity-badge">
                     <i class="mdi mdi-package-variant-closed icon"></i>
                     総数: {{ item.capacity }}
                   </span>
                </div>
              </div>
              
              <div class="item-actions">
                <button 
                  @click.stop="editItem(item)" 
                  class="action-btn edit"
                  title="編集"
                >
                  <i class="mdi mdi-pencil icon"></i>
                </button>
                <button 
                  @click.stop="deleteItem(item)" 
                  class="action-btn delete"
                  title="削除"
                >
                  <i class="mdi mdi-delete icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="items-table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>備品</th>
                  <th>コード</th>
                  <th>説明</th>
                  <th>総数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredItems.length === 0">
                  <td colspan="5" class="no-results-row">
                    該当する備品が見つかりません
                  </td>
                </tr>
                <tr 
                  v-for="item in paginatedItems" 
                  :key="item.id"
                  class="table-row"
                  @click="viewItemDetail(item)"
                >
                  <td class="item-cell">
                    <div class="item-image-small">
                      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="image">
                      <div v-else class="image-placeholder-small">
                        <i class="mdi mdi-camera-off icon"></i>
                      </div>
                    </div>
                    <div class="item-basic-info">
                      <div class="item-name">{{ item.name }}</div>
                    </div>
                  </td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.description }}</td>
                  <td>{{ item.capacity }}</td>
                  <td class="actions-cell">
                    <button 
                      @click.stop="editItem(item)" 
                      class="action-btn edit"
                      title="編集"
                    >
                      <i class="mdi mdi-pencil icon"></i>
                    </button>
                    <button 
                      @click.stop="deleteItem(item)" 
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
              （{{ filteredItems.length }}件中 {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredItems.length) }}件を表示）
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
    
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h3 class="modal-title">
                <i class="mdi mdi-alert icon"></i>
                備品の削除
              </h3>
            </div>
            <div class="modal-body">
              <p>
                <strong>{{ selectedItem?.name }}</strong> を削除しますか？
              </p>
              <p class="warning-text">
                この操作は取り消すことができません。
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
    
    <Transition name="notification">
      <div v-if="notification.show" class="notification" :class="notification.type">
        <i :class="notification.type === 'success' ? 'mdi mdi-check' : 'mdi mdi-alert'" class="icon"></i>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useEquipment } from '~/composables/useEquipment'

// Nuxt3の場合
const { push } = useRouter()

const { getListAsync, deleteAsync } = useEquipment()

// SEOメタタグ設定
useHead({
  title: 'TASCAL - 備品管理',
  meta: [
    { name: 'description', content: 'TASCALシステムの備品管理画面です' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/7.2.96/css/materialdesignicons.min.css' }
  ]
})

// リアクティブデータ
const items = ref<Equipment[]>([])
const filteredItems = ref<Equipment[]>([])
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const itemsPerPage = 12
const showDeleteModal = ref(false)
const selectedItem = ref<Equipment | null>(null)

const notification = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 計算プロパティ
const totalItems = computed(() => items.value.length)
const totalCapacity = computed(() => items.value.reduce((sum, item) => sum + (item.capacity ?? 0), 0))
const categories = computed(() => [...new Set(items.value.map(item => item.category))])

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => startIndex.value + itemsPerPage)

const paginatedItems = computed(() => {
  return filteredItems.value.slice(startIndex.value, endIndex.value).sort((a, b) => { if (a.code > b.code) { return 1 } else { return -1 } })
})

// ---ダミーデータとAPIモック---
// 実際のアプリケーションでは、これをAPI呼び出しに置き換えます。
const equipments = ref<Equipment[]>([])

const fetchAllItems = async (): Promise<Equipment[]> => {
  console.log('Fetching all items...')
  return await getListAsync()
}

const deleteItemApi = async (itemId: string): Promise<void> => {
  console.log(`Deleting item ${itemId}...`)
  return await deleteAsync(itemId).then(_ => {
    equipments.value.splice(equipments.value.findIndex(e => { return e.id === itemId }), 1)
  })
}
// ---ここまで---

// メソッド
const loadItems = async () => {
  try {
    const itemData = await fetchAllItems()
    items.value = itemData
    filteredItems.value = [...items.value]
  } catch (error) {
    console.error('備品の読み込みに失敗しました:', error)
    showNotification('備品の読み込みに失敗しました', 'error')
  }
}

const filterItems = () => {
  filteredItems.value = items.value.filter(item => {
    const searchLower = searchQuery.value.toLowerCase()
    return !searchQuery.value || 
      item.name.toLowerCase().includes(searchLower) ||
      item.code.toLowerCase().includes(searchLower)
  })
  currentPage.value = 1
}

const navigateToItemForm = () => {
  push('/equipment/new')
}

const viewItemDetail = (item: Equipment) => {
  push(`/equipment/${item.id}`)
}

const editItem = (item: Equipment) => {
  push(`/equipment/${item.id}/edit`)
}

const deleteItem = (item: Equipment) => {
  selectedItem.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedItem.value = null
}

const confirmDelete = async () => {
  if (!selectedItem.value) return
  
  try {
    await deleteItemApi(selectedItem.value.id)
    
    const itemIndex = items.value.findIndex(i => i.id === selectedItem.value!.id)
    if (itemIndex !== -1) {
      items.value.splice(itemIndex, 1)
    }
    
    filterItems()
    showNotification(`${selectedItem.value.name} を削除しました`, 'success')
    closeDeleteModal()
  } catch (error) {
    console.error('備品の削除に失敗しました:', error)
    showNotification('備品の削除に失敗しました', 'error')
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
  loadItems()
})
</script>

<style scoped>
/* 既存のスタイルをコピー */
:root {
  --background-light: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --background-white: #ffffff;
  --radius-lg: 12px;
  --radius-md: 8px;
  --radius-sm: 6px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --primary-color: #4361ee;
  --accent-color: #7209b7;
  --border-color: #dee2e6;
  --transition: all 0.2s ease-in-out;
  --primary-light: #e0e6fd;
  --primary-hover: #3a53c4;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

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
  background: linear-gradient(135deg, var(--brand-color-1), var(--brand-color-2), var(--brand-color-3));
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
.items-section {
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
.item-count {
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
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.item-card {
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}
.item-image-container {
  width: 100%;
  height: 180px;
  background-color: #f0f0f0;
}
.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.image-placeholder .icon {
  font-size: 48px;
}
.item-info {
  padding: 16px;
  flex-grow: 1;
}
.item-code {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  margin-bottom: 8px;
}
.item-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.item-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 42px; /* 2行分の高さを確保 */
}
.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.capacity-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: var(--primary-light);
  color: var(--primary-color);
}
.item-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  margin-top: auto;
}
.action-btn {
  width: 36px;
  height: 36px;
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
.action-btn.delete {
  background-color: #fee2e2;
  color: #dc2626;
  margin-left: auto;
}
.action-btn.delete:hover {
  background-color: #dc2626;
  color: white;
}
.items-table-container {
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
  vertical-align: middle;
}
.table-row {
  cursor: pointer;
  transition: var(--transition);
}
.table-row:hover {
  background-color: var(--background-light);
}
.item-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.item-image-small {
  width: 60px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: #f0f0f0;
}
.item-image-small .image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.image-placeholder-small .icon {
  font-size: 20px;
}
.item-basic-info .item-name {
  font-weight: 500;
  color: var(--text-primary);
}
.actions-cell {
  text-align: right;
}
.actions-cell .action-btn {
  display: inline-flex;
}
.no-results-row {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
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
.icon {
  font-size: 16px;
  line-height: 1;
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
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}
.notification-enter-from,
.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
@media (max-width: 768px) {
  .page-container { padding: 0; }
  .container { border-radius: 0; }
  .header { padding: 24px 20px; }
  .content { padding: 24px 20px; }
  .search-filter-section { flex-direction: column; align-items: stretch; gap: 16px; }
  .filter-controls { flex-wrap: wrap; justify-content: space-between; }
  .items-grid { grid-template-columns: 1fr; }
  .stats-section { grid-template-columns: 1fr; }
  .section-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .modal-container { margin: 20px; max-height: calc(100vh - 40px); }
}
</style>