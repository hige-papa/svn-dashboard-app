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
import { wikiArticles } from '~/services/wikiService'

const { params } = useRoute()

const id = computed(() => {
    return Number(params.id)
})

const article = computed(() => {
    return wikiArticles.find(e => e.id === id.value)
})
</script>