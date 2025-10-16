<template>
    <v-container>
        <!-- {{ user?.role }}:{{ editable }} -->
        <v-list-item v-if="editable">
            <template v-slot:append>
                <v-btn color="primary" variant="text" @click.stop="navigateTo('/wiki/new')">新しい記事を作成</v-btn>
                <v-btn v-if="editable" color="primary" variant="text" @click.stop="navigateTo('/wiki/category')">カテゴリーメンテナンス</v-btn>
                <v-btn v-if="editable" color="primary" variant="text" @click.stop="navigateTo('/wiki/tag')">タグメンテナンス</v-btn>
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
                <!-- <v-chip v-for="n of 5" :key="`tag-${n}`" class="mr-2">tag-{{ n }}</v-chip> -->
                <v-chip
                    v-for="(category, index) in categories"
                    :key="`category-${index}`"
                    :color="category.color"
                    class="ma-1">
                    {{ category.text }}
                </v-chip>
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
import { useWiki } from '~/composables/useWiki'
import { type QueryConstraint, where } from 'firebase/firestore'
import { useMaster } from '~/composables/master/useMaster'

const { getListAsync: getCategoriesAsync } = useMaster('categories')

const categories = ref<Tag[]>([])

onMounted(() => {
    getCategoriesAsync().then(response => {
        categories.value = response
    })
})

const user = useState<ExtendedUserProfile>('userProfile')

const editable = computed(() => {
    return user.value?.role === 'admin'
})

const { getListAsync: getWikiArticles } = useWiki()

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

// 前方一致検索用クエリ生成
const getPrefixQuery = (searchTerm: string) => {
    const end = searchTerm.replace(/.$/, c => 
        String.fromCharCode(c.charCodeAt(0) + 1)
    )
    return [searchTerm, end]
}

const handleClickSearch = async (e: any) => {
    // alert(e)
    if (e) {
        const query: QueryConstraint[] = []
        const [start, end] = getPrefixQuery(e)
        query.push(where('title', '>=', start))
        query.push(where('title', '<', end))
        articles.value = await getWikiArticles(...query)
    } else {
        articles.value = await getWikiArticles()
    }
}

const handleClickReadMore = (e: WikiArticle) => {
    // alert(JSON.stringify(e))
    navigateTo(`/wiki/${e.id}`)
}

// head設定
useHead({
  title: 'TASCAL - Wikiページ'
});

</script>