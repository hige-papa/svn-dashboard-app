<template>
    <v-container>
        <v-card>
            <v-card-title>
                新しい記事を作成
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
                    <v-select v-model="form.tags" :items="categories" label="タグ" multiple chips></v-select>
                    <v-text-field
                        v-model="form.tags"
                        label="タグ (カンマ区切り)"
                    ></v-text-field>
                    <v-text-field
                        v-model="form.category"
                        label="カテゴリー"
                    ></v-text-field>
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
                    <v-btn text @click="preview = false" @click.stop="handleSubmit">投稿する</v-btn>
                </template>
            </v-list-item>
        </template>
    </aw-dialog>
</template>

<script setup lang="ts">
import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'

const { addAsync: addWikiArticle } = useFirestoreGeneral('wikiArticles')

const user = useState<ExtendedUserProfile>('userProfile')

const categories = ref<any[]>(['カテゴリ1','カテゴリ2','カテゴリ3'])

const form = ref<WikiArticleForm>({
    title: '',
    content: '',
    summary: '',
    tags: [],
    category: '',
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
</script>