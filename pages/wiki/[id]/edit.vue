<template>
    <v-container>
        <v-list-item>
            <v-btn icon @click.stop="navigateTo(`/wiki/${id}`)">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
        </v-list-item>
        <v-card>
            <v-card-title>
                記事を更新
            </v-card-title>
            <v-card-text>
                <v-form>
                    <v-text-field
                        v-model="form.title"
                        label="タイトル"
                        required
                    ></v-text-field>
                    <v-textarea
                        v-model="form.summary"
                        label="概要"
                        required
                    ></v-textarea>
                    <v-textarea
                        v-model="form.content"
                        label="内容 (Markdown形式)"
                        rows="10"
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
                    <v-btn text @click="preview = false" @click.stop="handleSubmit">更新する</v-btn>
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

const { getAsync: getWikiArticle, updateAsync: updateWikiArticle } = useWiki()

const user = useState<ExtendedUserProfile>('userProfile')

const tags = ref<Tag[]>([])

const categories = ref<Tag[]>([])

const { params } = useRoute()

const id = computed(() => {
    return params.id as string
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

// ローカルストレージに編集状況を記録
import { useLocalStorage } from '~/composables/common/useLocalStorage'

const localStorageKey = `wiki-article-edit-${id.value}`

const { getItem, setItem } = useLocalStorage(localStorageKey)

watch(form, (newVal) => {
    setItem(localStorageKey, JSON.stringify(newVal))
}, { deep: true })

const preview = ref<boolean>(false)

const handleShowPreview = () =>{
    preview.value = true
}

const handleSubmit = async () => {
    if(!form.value.title || !form.value.content || !form.value.summary) return
    await updateWikiArticle(id.value, form.value).then(_ => {
        localStorage.removeItem(localStorageKey)
        navigateTo(`/wiki/${id.value}`)
    })
}

onMounted(async () => {
    const updating = getItem(localStorageKey)
    if (updating) {
        form.value = JSON.parse(updating) as WikiArticleForm
    } else {
        const article = await getWikiArticle(id.value)
        if (article) {
            form.value = article as WikiArticleForm
        } else {
            navigateTo('/wiki')
        }
    }

    getTagsAsync().then(response => {
        tags.value = response
    })
    getCategoriesAsync().then(response => {
        categories.value = response
    })
})
</script>