<template>
    <v-container class="fill-height">
        <v-card class="w-100 h-100">
            <v-card-title>
                <v-btn
                    variant="text"
                    @click.stop="navigateTo('/wiki')">
                    <template v-slot:prepend>
                        <v-icon>mdi-chevron-left</v-icon>
                    </template>
                    戻る
                </v-btn>
                <div class="ml-4">新しい記事を作成</div>
            </v-card-title>
            <v-card-text>
                <v-form class="pl-4 pr-4">
                    <v-text-field
                        v-model="form.title"
                        label="タイトル"
                        variant="outlined"
                        required
                    ></v-text-field>
                    <v-textarea
                        v-model="form.summary"
                        label="概要"
                        variant="outlined"
                        required
                    ></v-textarea>
                    <v-textarea
                        v-model="form.content"
                        label="内容 (Markdown形式)"
                        rows="10"
                        variant="outlined"
                        required
                    ></v-textarea>
                    <v-select
                        v-model="form.category"
                        :items="categories"
                        item-title="text"
                        label="カテゴリー"
                        variant="outlined"
                        return-object>
                    </v-select>                    
                    <v-autocomplete
                        v-model="form.tags"
                        :items="tags"
                        item-title="text"
                        label="タグ"
                        variant="outlined"
                        multiple
                        chips
                        return-object>
                    </v-autocomplete>
                    <v-text-field
                        v-model="form.image"
                        label="画像URL"
                        variant="outlined"
                    ></v-text-field>
                    <v-btn color="primary" class="mt-4" @click.stop="handleShowPreview">記事のプレビューを確認</v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-container>
    <aw-dialog
        v-model="preview"
        :initial-height="600"
        :initial-width="800"
        title="記事プレビュー"
    >
        <v-card-text>
            <MarkdownRenderer :content="form.content"></MarkdownRenderer>
        </v-card-text>
        <template #footer>
            <v-list-item>
                <template #append>
                    <v-btn text @click="preview = false" @click.stop="handleSubmit">投稿する</v-btn>
                </template>
            </v-list-item>
        </template>
    </aw-dialog>
</template>

<script setup lang="ts">
import { useWiki } from '~/composables/useWiki'
import { useMaster } from '~/composables/master/useMaster'

const { addAsync: addCategoryAsync, getListAsync: getCategoriesAsync, deleteAsync: deleteCategoryAsync } = useMaster('categories')

const { addAsync: addTagAsync, getListAsync: getTagsAsync, deleteAsync: deleteTagAsync } = useMaster('tags')

const { addAsync: addWikiArticle } = useWiki()

const user = useState<ExtendedUserProfile>('userProfile')

const tags = ref<Tag[]>([])

const categories = ref<Tag[]>([])

const editable = computed(() => {
    return user.value?.role === 'admin'
})

// const categories = ref<any[]>(['カテゴリ1','カテゴリ2','カテゴリ3'])

const form = ref<WikiArticleForm>({
    title: '',
    content: '',
    summary: '',
    tags: [],
    category: undefined,
    image: '',
    author: user.value?.displayName || '匿名',
    department: user.value?.department || '未設定',
})

const preview = ref<boolean>(false)

const handleShowPreview = () =>{
    preview.value = true
}

const handleSubmit = async () => {
    // ここでフォームの内容をサーバーに送信する処理を実装
    await addWikiArticle(form.value).then(_ => {
        console.log('記事が投稿されました！')
    }).catch(error => {
        console.error('記事の投稿に失敗しました:', error)
    })
}

onMounted(() => {
    if(!editable.value){
        alert('記事の作成権限がありません。')
        navigateTo('/wiki')
    }
    getTagsAsync().then(response => {
        tags.value = response
    })
    getCategoriesAsync().then(response => {
        categories.value = response
    })
})
</script>