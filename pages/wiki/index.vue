<template>
    <v-container>
        <v-list-item>
            <template v-slot:append>
                <v-btn color="primary" variant="text" @click.stop="navigateTo('/wiki/new')">新しい記事を作成</v-btn>
            </template>
        </v-list-item>
        <v-row>
            <v-col>
                <WikiHeroSection
                    :title="hero.title"
                    :subtitle="hero.subtitle"
                    :searchable="true"
                    :searchPlaceHolder="hero.searchPlaceHolder"
                    @onClickSearch="handleClickSearch" />
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-chip v-for="n of 5" :key="`tag-${n}`" class="mr-2">tag-{{ n }}</v-chip>
            </v-col>
        </v-row>
        <v-row>
            <!-- <v-col>
                {{articles}}
            </v-col> -->
            <v-col cols="12" sm="7">
                <v-list>
                    <v-list-item v-for="(article, index) in articles" :key="`article-${index}`">
                        <WikiArticleIndex
                            :user-name="article.author"
                            :article="article"
                            class="ma-2"
                            @read-more="handleClickReadMore"
                            />
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col cols="12" sm="5">
                <v-card>
                    <v-card-text>
                        <PopularArticleIndexList :articles="articles" />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'
import { useDocumentRoot } from '~/composables/firebase/useDocumentRoot'

const { wikiArticleDocRoot } = useDocumentRoot()

const { getListAsync: getWikiArticles } = useFirestoreGeneral(wikiArticleDocRoot.collection())

// import { wikiArticles } from '~/services/wikiService'

// const articles = computed<WikiArticle[]>(() => {
//     return wikiArticles
// })

const articles = ref<WikiArticle[]>(await getWikiArticles())

const hero = ref<any>({
    title: 'チームの知見を共有しよう',
    subtitle: '社内の最新情報、技術ノウハウ、プロジェクト事例をみんなで共有するブログです',
    searchable: true,
    searchPlaceHolder: '記事を検索...'
})

const handleClickSearch = (e: any) => {
    alert(e)
}

const handleClickReadMore = (e: WikiArticle) => {
    // alert(JSON.stringify(e))
    navigateTo(`/wiki/${e.id}`)
}
</script>