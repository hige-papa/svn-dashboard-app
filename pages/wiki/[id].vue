<template>
    <v-container>
        <v-card v-if="article">
            <v-card-text>
                <MarkdownRenderer :content="article.content"></MarkdownRenderer>
                <!-- {{ article }} -->
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { useFirestoreGeneral } from '~/composables/firestoreGeneral/useFirestoreGeneral'

const { getAsync: getWikiArticle } = useFirestoreGeneral('wikiArticles')

// import { wikiArticles } from '~/services/wikiService'

const { params } = useRoute()

const id = computed(() => {
    return params.id as string
})

// const article = computed(() => {
//     return wikiArticles.find(e => e.id === id.value)
// })

const article = ref<WikiArticle | null>(await getWikiArticle(id.value))
</script>