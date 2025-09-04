<template>
    <v-card>
        <v-card-text>
            <div class="popular-post">
                <div class="popular-title">{{ props.article.title }}</div>
                <div class="popular-meta">{{ props.article.author }} • {{ props.article.created_date }}</div>
                <a class="read-more" @click.stop="handleClickReadMore">続きを読む →</a>
            </div>
            <!-- <span>{{ props.article.title }}</span> -->
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
interface Props {
    article: WikiArticle
}

const props = defineProps<Props>()

const emit = defineEmits(['readMore'])

const handleClickReadMore = () => {
    emit('readMore', props.article)
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