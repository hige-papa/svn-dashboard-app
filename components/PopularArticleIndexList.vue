<template>
    <v-list>
        <v-list-item v-for="(article, index) in props.articles" :key="`pop-article-${index}`">
            <!-- <span>人気記事-{{ n }}</span> -->
             <!-- <div>{{ article }}</div> -->
            <PopularArticleIndex :article="article" class="ma-2"
                            @read-more="handleClickReadMore"></PopularArticleIndex>           
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
interface Props {
    articles: WikiArticle[]
}

const props = defineProps<Props>()

const handleClickReadMore = (e: WikiArticle) => {
    // alert(JSON.stringify(e))
    navigateTo(`/wiki/${e.id}`)
}
</script>

<style scoped>
.popular-post {
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
}

.popular-post:last-child {
    border-bottom: none;
}

.popular-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.popular-meta {
    font-size: 0.8rem;
    color: #666;
}
</style>