<template>
    <v-container>
            {{ user?.role }}
        <v-card v-if="article">
            <v-card-text>
                <MarkdownRenderer :content="article.content"></MarkdownRenderer>
                <!-- {{ article }} -->
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="showHistories">編集履歴を見る</v-btn>
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
    <v-dialog v-model="historyDialog" max-width="800">
        <v-card>
            <v-card-title class="headline">編集履歴</v-card-title>
            <v-card-text>
                <v-list>
                    <v-list-item v-for="(history, index) in histories" :key="`history-${index}`">
                        <v-list-item-content>
                            <v-list-item-title>バージョン {{ history.version }} - {{ history.snapshot.title }}</v-list-item-title>
                            <v-list-item-subtitle>更新日: {{ history.updatedAt }} - 更新者: {{ history.snapshot.author }}</v-list-item-subtitle>
                        </v-list-item-content>
                        {{ history.snapshot }}
                        <v-list-item-action>
                            <v-btn text @click="navigateTo(`/wiki/${history.snapshot.id}/edit`)">このバージョンを編集</v-btn>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="historyDialog = false">閉じる</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useWiki } from '~/composables/useWiki'

const { getAsync: getWikiArticle, deleteAsync: deleteWikiArticle, updateAsync: updateWikiArticle, getHistoriesAsync: getArticleHistories } = useWiki()

const user = useState<ExtendedUserProfile>('userProfile')

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

const histories = ref<WikiArticleHistory[]>([])

const loadHistories = async () => {
    if(!article.value) return
    histories.value = await getArticleHistories(article.value.id as string)
    console.log(histories.value)
}

const historyDialog = ref<boolean>(false)

const showHistories = async () => {
    await loadHistories()
    historyDialog.value = true
}

const rollBackArticle = async (history: WikiArticleHistory) => {
    if(!article.value) return
    const newVersion = history.version + 1
    const updatedArticle = history.snapshot
    updatedArticle.version = newVersion
    await updateWikiArticle(article.value.id as string, updatedArticle).then(_ => {
        navigateTo(`/wiki/${article.value?.id}`)
    })
}
</script>