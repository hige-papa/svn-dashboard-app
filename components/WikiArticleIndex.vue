<template>
    <article class="article-card">
        <div class="article-meta">
            <v-icon v-if="props.article.image" :icon="props.article.image"></v-icon>
            <div v-else-if="props.article.author" class="author-avatar">{{ props.article.author[0] }}</div>
            <v-icon v-else>mdi-account</v-icon>
            <div class="article-info">
                <div>{{ props.article.author }} • {{ props.article.department }}</div>
                <div>{{ formatDate(props.article.createdAt) }}</div>
            </div>
        </div>
        <!-- <p class="article-category">{{ props.article.category?.text }}</p> -->
         <!-- {{props.article}} -->
        <v-chip
            :color="props.article.category?.color"
            class="ma-1">
            {{ props.article.category?.text }}
        </v-chip>
        <!-- <p class="article-tag">{{ props.article.tags[0] }}</p> -->
        <h2 class="article-title">{{ props.article.title }}</h2>
        <p class="article-excerpt">
            {{ props.article.summary }}
        </p>
        <a class="read-more" @click.stop="handleClickReadMore">続きを読む →</a>
    </article>
</template>

<script setup lang="ts">
interface Props {
    article: WikiArticle
}

const categories = ref<Tag[]>([])

const props = defineProps<Props>()

const emit = defineEmits(['readMore'])

const handleClickReadMore = () => {
    emit('readMore', props.article)
}

const formatDate = (date: any) => {
    try {
        return date?.toDate()?.toLocaleString()
    } catch (error) {
        return undefined
    }
}
</script>

<style scoped>
/* Articles */
.articles {
    display: grid;
    gap: 2rem;
}

.article-card {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.article-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.article-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.author-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
}

.article-info {
    font-size: 0.9rem;
    color: #666;
}

.article-title {
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #333;
}

.article-excerpt {
    color: #666;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.read-more {
    color: #667eea;
    text-decoration: none;
    font-weight: bold;
    transition: color 0.3s ease;
}

.read-more:hover {
    color: #764ba2;
}
</style>