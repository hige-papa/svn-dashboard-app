<template>
    <article class="article-card">
        <div class="article-meta">
            <v-icon v-if="props.icon" :icon="props.icon"></v-icon>
            <div v-else class="author-avatar">{{ props.userName[0] }}</div>
            <div class="article-info">
                <div>{{ props.userName }} • {{ props.userSection }}</div>
                <div>{{ displayDate }}</div>
            </div>
        </div>
        <h2 class="article-title">{{ title }}</h2>
        <p class="article-excerpt">
            {{ props.article }}
        </p>
        <a href="#" class="read-more">続きを読む →</a>
    </article>
</template>

<script setup lang="ts">
interface Props {
    icon?: string
    userName: string
    userSection: string
    title: string
    article: string
    createdAt: Date
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
})

const displayDate = computed(() => {
    const year = props.createdAt.getFullYear()
    const month = props.createdAt.getMonth() + 1
    const day = props.createdAt.getDate()

    return `${year}年${month}月${day}日`
})
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