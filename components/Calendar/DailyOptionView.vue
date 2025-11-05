<template>
    <div>
        <div class="container">
            <div class="header">
                <p class="page-subtitle">日別ステータスの詳細</p>
            </div>

            <div v-if="optionData" class="view-content">
                <div class="event-header">
                    <div class="event-title-section">
                        <h2 class="event-title">
                            <i class="mdi mdi-calendar-today icon"></i>
                            {{ formatDate(optionData.date) }}
                        </h2>
                        <p class="text-secondary">
                            {{ getUserName(optionData.uid) }} さんのオプション
                        </p>
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
                    <div class="detail-section">
                        <h3 class="section-title">
                            <i class="mdi mdi-briefcase-variant-outline icon"></i>
                            勤務形態
                        </h3>
                        <div class="detail-content">
                            <span class="option-badge"
                                :style="{ '--option-color': workstyleDetails[optionData.workStyle].color }">
                                <i :class="workstyleDetails[optionData.workStyle].icon" class="icon"></i>
                                {{ workstyleDetails[optionData.workStyle].name }}
                            </span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3 class="section-title">
                            <i class="mdi mdi-food-fork-drink icon"></i>
                            ランチ会
                        </h3>
                        <div class="detail-content">
                            <span class="option-badge"
                                :style="{ '--option-color': participationLunchStatusDetails[optionData.lunchParticipation].color }">
                                <i :class="participationLunchStatusDetails[optionData.lunchParticipation].icon"
                                    class="icon"></i>
                                {{ participationLunchStatusDetails[optionData.lunchParticipation].name }}
                            </span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3 class="section-title">
                            <i class="mdi mdi-silverware-fork-knife icon"></i>
                            夕食会
                        </h3>
                        <div class="detail-content">
                            <span class="option-badge"
                                :style="{ '--option-color': participationDinnerStatusDetails[optionData.dinnerParticipation].color }">
                                <i :class="participationDinnerStatusDetails[optionData.dinnerParticipation].icon"
                                    class="icon"></i>
                                {{ participationDinnerStatusDetails[optionData.dinnerParticipation].name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="view-actions">
                    <button type="button" @click="handleBack" class="btn btn-secondary">
                        <i class="mdi mdi-arrow-left icon"></i>
                        戻る
                    </button>
                </div>
            </div>

            <div v-else class="view-content-empty">
                <p>表示するデータがありません。</p>
            </div>
        </div>

        <Teleport to="body">
            <Transition name="modal">
                <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
                    <div class="modal-container" @click.stop>
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="mdi mdi-alert icon"></i>
                                オプションを削除
                            </h3>
                            <button type="button" @click="closeDeleteModal" class="modal-close">
                                <i class="mdi mdi-close icon"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>この日のオプション設定を削除してもよろしいですか？</p>
                            <p class="delete-warning">{{ formatDate(optionData.date) }}</p>
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
    </div>
</template>

<script setup lang="ts">
import { useConstants } from '~/composables/common/useConstants';

const { workstyleDetails, participationLunchStatusDetails, participationDinnerStatusDetails } = useConstants();

// --- PropsとEmits ---
interface Props {
    optionData: DailyUserOption;
    usersMaster: ExtendedUserProfile[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (event: 'edit', data: DailyUserOption): void;
    (event: 'delete', data: { userId: string, date: string }): void;
    (event: 'back'): void;
}>();

// --- リアクティブな状態 ---
const showDeleteModal = ref(false);

// --- ヘルパー関数 ---
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // UTCとして解釈されるのを防ぐため、タイムゾーンオフセットを考慮
    const localDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return `${localDate.getFullYear()}年${localDate.getMonth() + 1}月${localDate.getDate()}日（${weekDays[localDate.getDay()]}）`;
};

// userIdからユーザー名を取得するダミー関数
const getUserName = (userId: string) => {
    // 本来はpropsで渡されたユーザーマスタから検索します
    return props.usersMaster.find(e => { return e.uid === userId })?.displayName;
};

// --- イベントハンドラ ---
const handleEdit = () => {
    emit('edit', props.optionData);
};

const handleDelete = () => {
    showDeleteModal.value = true;
};

const handleBack = () => {
    emit('back');
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
};

const confirmDelete = () => {
    emit('delete', { userId: props.optionData.uid, date: props.optionData.date });
    closeDeleteModal();
};
</script>

<style scoped>
.container {
    /* max-width: 800px; */
    /* margin: 0 auto; */
    background-color: var(--background-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #6e7fca, #2a41a1);
    color: white;
    padding: 32px 40px;
    text-align: center;
}

.page-subtitle {
    font-size: 16px;
    font-weight: 400;
    opacity: 0.9;
}

.view-content {
    padding: 40px;
}

.view-content-empty {
    padding: 60px 40px;
    text-align: center;
    color: var(--text-secondary);
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

.event-title-section .event-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.text-secondary {
    color: var(--text-secondary);
    font-size: 14px;
}

.event-actions {
    display: flex;
    gap: 12px;
}

.event-details {
    display: grid;
    gap: 24px;
}

.detail-section {
    background-color: var(--background-light);
    border-radius: var(--radius-md);
    padding: 24px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.detail-content {
    color: var(--text-secondary);
}

.option-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background-color: var(--option-color, var(--primary-color));
}

.view-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
}

.btn {
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-secondary {
    background-color: #f8f9fa;
    color: #6c757d;
    border: 2px solid #dee2e6;
}

.btn-secondary:hover {
    background-color: #e9ecef;
}

.btn-danger {
    background-color: var(--danger-color);
    color: white;
}

.btn-danger:hover {
    background-color: #c0392b;
}

/* .modal-overlay,
.modal-container,
.modal-header,
.modal-title,
.modal-close,
.modal-body,
.modal-footer,
.delete-warning {
    /* EventView.vueからモーダル関連のスタイルをコピー */
} */

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
}

.modal-container {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 100%;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid #dee2e6;
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
}

.modal-body {
    padding: 24px;
    line-height: 1.7;
}

.delete-warning {
    font-weight: 600;
    color: var(--danger-color);
    background-color: #f8d7da;
    padding: 8px 12px;
    border-radius: 6px;
    margin: 12px 0;
    text-align: center;
}

.modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 24px;
    border-top: 1px solid #dee2e6;
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

.icon {
    font-size: 16px;
    line-height: 1;
}

@media (max-width: 768px) {
    .page-container {
        padding: 0;
    }

    .container {
        border-radius: 0;
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
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    .event-title-section .event-title {
        font-size: 20px;
    }

    .view-actions {
        justify-content: center;
    }
}
</style>