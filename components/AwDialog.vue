<template>
    <Transition name="modal-fade">
        <div class="modal-area" v-if="modelValue">
            <div v-if="overlay" class="modal-overlay" @click.self="closeModal"></div>
            <div ref="modalRef" class="modal-content" :style="modalStyle" role="dialog" aria-modal="true"
                aria-labelledby="modal-title">
                <header ref="headerRef" :class="['modal-header', { 'draggable': draggable }]" @pointerdown.prevent="($event) => { if (draggable) { startDrag($event) } }" @dblclick="fullscreen">
                    <h2 id="modal-title" class="modal-title">
                        <slot name="title"></slot>
                    </h2>
                    <button class="close-button" @click="closeModal" aria-label="モーダルを閉じる">
                        &times;
                    </button>
                </header>

                <div class="modal-body-top">
                    <slot name="header"></slot>
                </div>

                <main class="modal-body">
                    <slot />
                </main>

                <div v-if="resize" v-for="dir in ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']" :key="dir"
                    :class="['resize-handle', dir]" @pointerdown.prevent="startResize($event, dir)"></div>
                    
                <footer class="modal-footer">
                    <slot name="footer"></slot>
                </footer>

            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { type CSSProperties } from 'vue';

// ----- Props & Emits --------------------------------------------------------

interface Props {
    modelValue: boolean
    initialWidth?: number
    initialHeight?: number
    minWidth?: number
    minHeight?: number
    draggable?: boolean
    resize?: boolean
    overlay?: boolean,
    fullscreen?: boolean,
};

const props = withDefaults(defineProps<Props>(), {
    initialWidth: 550,
    initialHeight: 400,
    minWidth: 100,
    minHeight: 100,
    draggable: false,
    resize: false,
    overlay: true,
    fullscreen: false,
});

const emit = defineEmits(['update:modelValue']);

// ----- Refs for DOM Elements ------------------------------------------------

const modalRef = ref<HTMLElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);

// ----- Draggable State ------------------------------------------------------
const isDragging = ref(false);
const position = ref({ x: 0, y: 0 });
const startDragInfo = { mouseX: 0, mouseY: 0, modalX: 0, modalY: 0 };
const modalSizeOnDrag = { width: 0, height: 0 };

// ----- Resizable State ------------------------------------------------------
const isResizing = ref(false);
const size = ref({
    width: props.fullscreen ? window.innerWidth : props.initialWidth,
    height: props.fullscreen ? window.innerHeight : props.initialHeight
});
// ▼ リサイズ方向と開始時のモーダル位置を保持する変数を追加 ▼
const resizeDirection = ref('');
const startResizeInfo = { mouseX: 0, mouseY: 0, modalWidth: 0, modalHeight: 0, modalX: 0, modalY: 0 };

// ----- Computed Properties --------------------------------------------------

const modalStyle = computed((): CSSProperties => ({
    position: 'absolute',
    transform: `translate(${position.value.x}px, ${position.value.y}px)`,
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
}));

// ----- Methods --------------------------------------------------------------

const closeModal = () => {
    emit('update:modelValue', false);
};

// --- Drag Logic (変更なし) ---
const startDrag = (event: PointerEvent) => {
    if (!modalRef.value || !headerRef.value) return;
    isDragging.value = true;
    const rect = modalRef.value.getBoundingClientRect();
    modalSizeOnDrag.width = rect.width;
    modalSizeOnDrag.height = rect.height;
    startDragInfo.mouseX = event.clientX;
    startDragInfo.mouseY = event.clientY;
    startDragInfo.modalX = position.value.x;
    startDragInfo.modalY = position.value.y;
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', stopDrag);
    headerRef.value.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
};

const onDrag = (event: PointerEvent) => {
    if (!isDragging.value) return;
    const deltaX = event.clientX - startDragInfo.mouseX;
    const deltaY = event.clientY - startDragInfo.mouseY;
    let newX = startDragInfo.modalX + deltaX;
    let newY = startDragInfo.modalY + deltaY;
    if (newX + modalSizeOnDrag.width > window.innerWidth) newX = window.innerWidth - modalSizeOnDrag.width;
    if (newX < 0) newX = 0;
    if (newY + modalSizeOnDrag.height > window.innerHeight) newY = window.innerHeight - modalSizeOnDrag.height;
    if (newY < 0) newY = 0;
    position.value = { x: newX, y: newY };
};

const stopDrag = () => {
    isDragging.value = false;
    window.removeEventListener('pointermove', onDrag);
    window.removeEventListener('pointerup', stopDrag);
    if (headerRef.value) headerRef.value.style.cursor = 'grab';
    document.body.style.userSelect = '';
};

// --- ▼ Resize Logic (汎用化) ▼ ---
const startResize = (event: PointerEvent, direction: string) => {
    isResizing.value = true;
    resizeDirection.value = direction; // 操作方向を保存

    startResizeInfo.mouseX = event.clientX;
    startResizeInfo.mouseY = event.clientY;
    startResizeInfo.modalWidth = size.value.width;
    startResizeInfo.modalHeight = size.value.height;
    // リサイズ開始時のモーダル位置も保存
    startResizeInfo.modalX = position.value.x;
    startResizeInfo.modalY = position.value.y;

    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', stopResize);

    // 操作方向に応じたカーソルに変更
    document.body.style.cursor = `${direction}-resize`;
    document.body.style.userSelect = 'none';
};

const onResize = (event: PointerEvent) => {
    if (!isResizing.value) return;

    const deltaX = event.clientX - startResizeInfo.mouseX;
    const deltaY = event.clientY - startResizeInfo.mouseY;

    let newWidth = startResizeInfo.modalWidth;
    let newHeight = startResizeInfo.modalHeight;
    let newX = startResizeInfo.modalX;
    let newY = startResizeInfo.modalY;

    const direction = resizeDirection.value;

    // 水平方向のリサイズ
    if (direction.includes('e')) {
        newWidth = startResizeInfo.modalWidth + deltaX;
    } else if (direction.includes('w')) {
        newWidth = startResizeInfo.modalWidth - deltaX;
        newX = startResizeInfo.modalX + deltaX;
    }

    // 垂直方向のリサイズ
    if (direction.includes('s')) {
        newHeight = startResizeInfo.modalHeight + deltaY;
    } else if (direction.includes('n')) {
        newHeight = startResizeInfo.modalHeight - deltaY;
        newY = startResizeInfo.modalY + deltaY;
    }

    // 最小サイズの制約
    if (newWidth < props.minWidth) {
        if (direction.includes('w')) {
            newX += newWidth - props.minWidth;
        }
        newWidth = props.minWidth;
    }
    if (newHeight < props.minHeight) {
        if (direction.includes('n')) {
            newY += newHeight - props.minHeight;
        }
        newHeight = props.minHeight;
    }

    // 画面の境界を超えないように制限
    if (newX < 0) {
        newWidth += newX;
        newX = 0;
    }
    if (newY < 0) {
        newHeight += newY;
        newY = 0;
    }
    if (newX + newWidth > window.innerWidth) {
        newWidth = window.innerWidth - newX;
    }
    if (newY + newHeight > window.innerHeight) {
        newHeight = window.innerHeight - newY;
    }

    size.value = { width: newWidth, height: newHeight };
    position.value = { x: newX, y: newY };
};

const isFullscreen = ref<boolean>(false)

const fullscreen = () => {
    if (props.fullscreen) return
    if (isFullscreen.value) {
        size.value = { width: props.initialWidth, height: props.initialHeight };
        nextTick(() => {
            const width = size.value.width;
            const height = size.value.height;
            position.value = {
                x: (window.innerWidth - width) / 2,
                y: ((window.innerHeight - height) / 2) - 30,
            };
        });
    } else {
        size.value = { width: window.innerWidth, height: window.innerHeight };
        position.value = { x: 0, y: 0 };
    }
    isFullscreen.value = !isFullscreen.value
}

const stopResize = () => {
    isResizing.value = false;
    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue) {
        closeModal();
    }
};

// ----- Lifecycle Hooks (変更なし) --------------------------------------------

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('pointermove', onDrag);
    window.removeEventListener('pointerup', stopDrag);
    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', stopResize);
});

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        size.value = {
            width: props.fullscreen ? window.innerWidth : props.initialWidth,
            height: props.fullscreen ? window.innerHeight : props.initialHeight
        };
        nextTick(() => {
            const width = size.value.width;
            const height = size.value.height;
            position.value = {
                x: props.fullscreen ? 0 : (window.innerWidth - width) / 2,
                y: props.fullscreen ? 0 : ((window.innerHeight - height) / 2) - 30,
            };
        });
    }
});
</script>

<style scoped>
.modal-area {
    position: fixed;
    top: 0;
    left: 0;
    /* width: 100%;
    height: 100%; */
    z-index: 3000;
}

/* オーバーレイ: 画面全体を覆う */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 4000;
}

/* モーダル本体: ドラッグのために absolute 配置 */
.modal-content {
    position: relative;
    /* ハンドルの配置基準 */
    background: var(--background-light);
    color: var(--text-primary);
    border-radius: 5px;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 5000;
}

/* ヘッダー: ドラッグハンドルの役割 */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    justify-items: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border-color);
    user-select: none;
}

.modal-header .draggable {
    cursor: grab;
}

.modal-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
}

.close-button {
    border: none;
    background: transparent;
    font-size: 1.75rem;
    font-weight: 300;
    color: var(--gray-color);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
}

.close-button:hover {
    color: var(--dark-color);
}

.modal-body-top {
    
}

/* ボディ: コンテンツエリア */
.modal-body {
    overflow-y: auto;
    flex-grow: 1;
    /* コンテンツが少なくても高さを埋める */
}

.modal-footer {
    /* ▼ 以下のプロパティは不要なため削除、またはコメントアウトします */
    /* position: sticky;
    bottom: 0;
    left: 0;
    width: 100%; */
    background: var(--background-light);
    z-index: 9;
    flex-shrink: 0; /* (任意) フッターが縮まないように指定すると、より堅牢になります */
}

/* トランジションアニメーション */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
    transition: all 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
    transform: scale(0.9) translateY(-30px);
}

/* ▼ リサイズハンドルのスタイルを全方位に対応 ▼ */
.resize-handle {
    position: absolute;
    z-index: 10;
    /* ハンドルの当たり判定を広げるため透明にする */
    background: transparent;
}

.resize-handle.n {
    top: -5px;
    left: 10px;
    right: 10px;
    height: 10px;
    cursor: n-resize;
}

.resize-handle.s {
    bottom: -5px;
    left: 10px;
    right: 10px;
    height: 10px;
    cursor: s-resize;
}

.resize-handle.e {
    top: 10px;
    bottom: 10px;
    right: -5px;
    width: 10px;
    cursor: e-resize;
}

.resize-handle.w {
    top: 10px;
    bottom: 10px;
    left: -5px;
    width: 10px;
    cursor: w-resize;
}

.resize-handle.ne {
    top: -5px;
    right: -5px;
    width: 12px;
    height: 12px;
    cursor: ne-resize;
}

.resize-handle.nw {
    top: -5px;
    left: -5px;
    width: 12px;
    height: 12px;
    cursor: nw-resize;
}

.resize-handle.se {
    bottom: -5px;
    right: -5px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
}

.resize-handle.sw {
    bottom: -5px;
    left: -5px;
    width: 12px;
    height: 12px;
    cursor: sw-resize;
}
</style>