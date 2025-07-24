<template>
    <v-card v-if="content" :color="color" :elevation="elevation" :class="['markdown-renderer-wrapper', cardClass]" :variant="variant">
        <v-card-title v-if="title" class="text-h6">{{ title }}</v-card-title>
        <v-card-text>
            <div ref="markdownContainer" class="markdown-content-container" v-html="renderedMarkdown" />
        </v-card-text>
    </v-card>
    <v-alert v-else-if="showEmptyAlert" type="info" variant="tonal" class="ma-2">
        コンテンツがありません
    </v-alert>
</template>

<script setup lang="ts">
interface Props {
    title?: string
    /** レンダリングするMarkdown文字列 */
    content?: string
    /** カードの立体感レベル (0-24) */
    elevation?: number | string
    /** カラー */
    color?: string
    /** カードの見た目バリアント */
    variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
    /** 追加のCSSクラス */
    cardClass?: string
    /** コンテンツが空の時にアラートを表示するか */
    showEmptyAlert?: boolean
    /** コードハイライトを有効にするか */
    enableCodeHighlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    content: '',
    elevation: 2,
    variant: 'elevated',
    color: '',
    cardClass: '',
    showEmptyAlert: true,
    enableCodeHighlight: true
})

const markdownContainer = ref<HTMLElement | null>(null)

// Markdownライブラリの動的インポート
const renderMarkdown = async (markdown: string): Promise<string> => {
    if (!markdown?.trim()) return ''

    try {
        // Client-side でのみ実行
        if (process.client) {
            const { marked } = await import('marked')

            // marked v16.0.0 対応 - 使用可能なオプションのみ設定
            marked.setOptions({
                breaks: true,
                gfm: true,
            })

            // 基本的なMarkdownをHTMLに変換
            const rawHtml = marked(markdown) as string

            // DOMPurifyでサニタイゼーション
            const { default: DOMPurify } = await import('dompurify')
            const cleanHtml = DOMPurify.sanitize(rawHtml, {
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'br', 'strong', 'em', 'u', 's', 'del',
                    'ul', 'ol', 'li',
                    'blockquote',
                    'pre', 'code',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'a', 'img',
                    'hr',
                    'div', 'span'
                ],
                ALLOWED_ATTR: [
                    'href', 'target', 'rel', 'title', 'alt', 'src',
                    'class', 'id', 'style'
                ]
            })

            // HTMLにクラスを追加（正規表現による後処理）
            let processedHtml = cleanHtml

            // 見出しタグにクラスとIDを追加
            processedHtml = processedHtml.replace(/<h([1-6])>([^<]+)<\/h[1-6]>/g, (match, level, text) => {
                // 見出しテキストからIDを生成（英数字、ひらがな、カタカナ、漢字対応）
                const id = text
                    .toLowerCase()
                    .replace(/[^\w\u3042-\u3096\u30A1-\u30FA\u4E00-\u9FAF\s]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/^-+|-+$/g, '')

                return `<h${level} class="md-heading md-h${level}" id="${id}">${text}</h${level}>`
            })

            // 段落にクラスを追加
            processedHtml = processedHtml.replace(/<p>/g, '<p class="md-paragraph">')

            // リストにクラスを追加
            processedHtml = processedHtml.replace(/<ul>/g, '<ul class="md-list md-ul">')
            processedHtml = processedHtml.replace(/<ol>/g, '<ol class="md-list md-ol">')
            processedHtml = processedHtml.replace(/<li>/g, '<li class="md-list-item">')

            // 引用にクラスを追加
            processedHtml = processedHtml.replace(/<blockquote>/g, '<blockquote class="md-blockquote">')

            // コードブロックにクラスを追加
            processedHtml = processedHtml.replace(/<pre><code>/g, '<pre class="md-code-block"><code class="md-code">')
            processedHtml = processedHtml.replace(/<pre><code class="language-(\w+)">/g, '<pre class="md-code-block"><code class="md-code language-$1">')

            // インラインコードにクラスを追加
            processedHtml = processedHtml.replace(/<code>/g, '<code class="md-code">')

            // テーブルにクラスを追加
            processedHtml = processedHtml.replace(/<table>/g, '<div class="md-table-wrapper"><table class="md-table">')
            processedHtml = processedHtml.replace(/<\/table>/g, '</table></div>')

            // 水平線にクラスを追加
            processedHtml = processedHtml.replace(/<hr>/g, '<hr class="md-hr">')
            processedHtml = processedHtml.replace(/<hr\/>/g, '<hr class="md-hr">')

            // 強調系要素にクラスを追加
            processedHtml = processedHtml.replace(/<strong>/g, '<strong class="md-strong">')
            processedHtml = processedHtml.replace(/<em>/g, '<em class="md-em">')
            processedHtml = processedHtml.replace(/<del>/g, '<del class="md-del">')

            // 画像にクラスを追加
            processedHtml = processedHtml.replace(/<img([^>]*?)>/g, '<img$1 class="md-image">')

            // リンクを新しいタブで開くよう設定
            processedHtml = processedHtml.replace(/<a href="([^"]*)"([^>]*?)>/g, '<a href="$1"$2 target="_blank" rel="noopener noreferrer">')

            return processedHtml
        }

        // サーバーサイドでは何もしない
        return ''
    } catch (error) {
        console.error('Markdown rendering error:', error)
        return '<p class="md-error">Markdownの解析中にエラーが発生しました</p>'
    }
}

// Markdownをレンダリング
const renderedMarkdown = ref<string>('')

// レンダリング関数
const updateRenderedMarkdown = async () => {
    renderedMarkdown.value = await renderMarkdown(props.content || '')
}

// 初期レンダリング
onMounted(() => {
    updateRenderedMarkdown()
})

// コンテンツ変更時の処理
watch(() => props.content, async () => {
    await updateRenderedMarkdown()

    await nextTick()
    if (props.enableCodeHighlight && markdownContainer.value) {
        // コードハイライトライブラリがある場合はここで実行
        // 例: await $highlightCode(markdownContainer.value)
    }
})
</script>

<style scoped>
/* コンポーネントのルートスタイル */
.markdown-renderer-wrapper {
    /* このコンポーネント専用のスコープ */
    isolation: isolate;
    contain: layout style;
    /* より強力な隔離 */
    position: relative;
    z-index: 0;
}

.markdown-content-container {
    line-height: 1.7;
    color: rgb(var(--v-theme-on-surface));
    /* フォントリセット */
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    /* 完全な隔離 */
    contain: layout style;
    isolation: isolate;
}

/* Markdown要素のスタイル - より具体的なセレクターで完全にスコープ化 */
.markdown-renderer-wrapper .markdown-content-container :deep(.md-heading) {
    margin: 1.5rem 0 1rem 0;
    font-weight: 600;
    line-height: 1.3;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h1) {
    font-size: 2rem;
    border-bottom: 2px solid rgb(var(--v-theme-primary));
    padding-bottom: 0.5rem;
    margin-top: 0;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h2) {
    font-size: 1.6rem;
    border-bottom: 1px solid rgb(var(--v-theme-outline));
    padding-bottom: 0.3rem;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h3) {
    font-size: 1.3rem;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h4) {
    font-size: 1.1rem;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h5) {
    font-size: 1rem;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-h6) {
    font-size: 0.9rem;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-paragraph) {
    margin: 1rem 0;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-list) {
    margin: 1rem 0;
    padding-left: 2rem;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-list-item) {
    margin: 0.5rem 0;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-blockquote) {
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background-color: rgb(var(--v-theme-surface-variant));
    border-left: 4px solid rgb(var(--v-theme-primary));
    border-radius: 4px;
    color: rgb(var(--v-theme-on-surface-variant));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-blockquote .md-paragraph) {
    margin: 0;
    font-style: italic;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-code-block) {
    background-color: rgb(var(--v-theme-surface-variant));
    color: rgb(var(--v-theme-on-surface-variant)); /* 修正点：文字色を追加 */
    border: 1px solid rgb(var(--v-theme-outline));
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
    overflow-x: auto;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-code) {
    background-color: rgb(var(--v-theme-surface-variant));
    /* ↓ この行の値を --v-theme-primary から変更 */
    color: rgb(var(--v-theme-on-surface-variant));
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-code-block .md-code) {
    background-color: transparent;
    padding: 0;
    color: inherit;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-table-wrapper) {
    overflow-x: auto;
    margin: 1rem 0;
    border-radius: 4px;
    border: 1px solid rgb(var(--v-theme-outline));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-table) {
    width: 100%;
    border-collapse: collapse;
    background-color: rgb(var(--v-theme-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-table th),
.markdown-renderer-wrapper .markdown-content-container :deep(.md-table td) {
    padding: 0.75rem;
    border-bottom: 1px solid rgb(var(--v-theme-outline));
    text-align: left;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-table th) {
    background-color: rgb(var(--v-theme-surface-variant));
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface-variant));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-table tr:last-child th),
.markdown-renderer-wrapper .markdown-content-container :deep(.md-table tr:last-child td) {
    border-bottom: none;
}

.markdown-renderer-wrapper .markdown-content-container :deep(a) {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
}

.markdown-renderer-wrapper .markdown-content-container :deep(a:hover) {
    border-bottom-color: rgb(var(--v-theme-primary));
}

/* 画像スタイル - md-imageクラスがついた要素のみに適用 */
.markdown-renderer-wrapper .markdown-content-container :deep(.md-image) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
    display: block;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-hr) {
    margin: 2rem 0;
    border: none;
    border-top: 1px solid rgb(var(--v-theme-outline));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-strong) {
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-em) {
    font-style: italic;
    color: rgb(var(--v-theme-on-surface));
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-del) {
    text-decoration: line-through;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.7;
}

.markdown-renderer-wrapper .markdown-content-container :deep(.md-error) {
    color: rgb(var(--v-theme-error));
    background-color: rgb(var(--v-theme-error-container));
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

/* プリントメディア対応 */
@media print {
    .markdown-renderer-wrapper .markdown-content-container :deep(.md-code-block) {
        background-color: #f5f5f5 !important;
        border: 1px solid #ccc !important;
    }

    .markdown-renderer-wrapper .markdown-content-container :deep(.md-blockquote) {
        background-color: #f9f9f9 !important;
        border-left: 4px solid #333 !important;
    }
}

/* ダークテーマでの調整 */
@media (prefers-color-scheme: dark) {
    .markdown-renderer-wrapper .markdown-content-container :deep(.md-table) {
        background-color: rgb(var(--v-theme-surface));
    }
}
</style>