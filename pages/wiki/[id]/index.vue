<template>
    <v-container>
        <v-card v-if="article">
            <v-card-text>
                <MarkdownRenderer :content="article.content"></MarkdownRenderer>
                <!-- {{ article }} -->
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text color="red" @click="startDelete">記事を削除</v-btn>
                <v-btn text @click="navigateTo('/wiki')">一覧に戻る</v-btn>
                <v-btn text color="primary" @click="navigateTo(`/wiki/${article.id}/edit`)">記事を編集</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
    <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
            <v-card-title class="headline">記事を削除しますか？</v-card-title>
            <v-card-text>この操作は元に戻せません。本当に削除しますか？</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="deleteDialog = false">キャンセル</v-btn>
                <v-btn color="red" text @click="confirmDelete">削除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'

const { getAsync: getWikiArticle, deleteAsync: deleteWikiArticle } = useFirestoreGeneral('wikiArticles')

// import { wikiArticles } from '~/services/wikiService'

const { params } = useRoute()

const id = computed(() => {
    return params.id as string
})

// const article = computed(() => {
//     return wikiArticles.find(e => e.id === id.value)
// })

const article = ref<WikiArticle | null>(await getWikiArticle(id.value))

const deleteDialog = ref<boolean>(false)

const startDelete = () => {
    deleteDialog.value = true
}

const confirmDelete = async () => {
    if(!article.value) return
    await deleteWikiArticle(article.value.id as string).then(_ => {
        navigateTo('/wiki')
    })
}   
</script>