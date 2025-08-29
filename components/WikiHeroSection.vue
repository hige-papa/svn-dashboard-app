<template>
    <section class="hero">
        <h1>{{ props.title }}</h1>
        <p>{{ props.subtitle }}</p>
        <div v-if="props.searchable" class="search-bar">
            <input type="text" v-model="keyword" :placeholder="props.searchPlaceHolder" id="searchInput">
            <button class="search-btn" @click.stop="handleClickSearch">🔍</button>
        </div>
    </section>
</template>

<script setup lang="ts">
interface Props { 
    title: string
    subtitle: string
    searchable: boolean
    searchPlaceHolder: string
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    searchable: false,
    searchPlaceHolder: '検索キーワードを入力'
})

const emit = defineEmits(['onClickSearch'])

const keyword = ref<string>('')

const handleClickSearch = () => {
    emit('onClickSearch', keyword.value)
}
</script>

<style scoped>
/* Hero Section */
.hero {
    background: white;
    padding: 4rem 0;
    text-align: center;
    margin: 2rem 0;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 2rem;
}

.search-bar {
    max-width: 500px;
    margin: 0 auto;
    position: relative;
}

.search-bar input {
    width: 100%;
    padding: 1rem 1.5rem;
    border: 2px solid #e1e5e9;
    border-radius: 50px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s ease;
}

.search-bar input:focus {
    border-color: #667eea;
}

.search-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.search-btn:hover {
    transform: translateY(-50%) scale(1.05);
}
</style>