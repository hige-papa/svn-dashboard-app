<template>
    <v-container>
        <v-row>
            <v-col>
                <v-btn @click.stop="switchHero">switch</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <WikiHeroSection :title="hero.title" :subtitle="hero.subtitle" :searchable="true"
                    :searchPlaceHolder="hero.searchPlaceHolder" @onClickSearch="handleClickSearch"/>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-chip v-for="n of 5" :key="`tag-${n}`" class="mr-2">tag-{{ n }}</v-chip>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" sm="7">
                <v-list>
                    <v-list-item v-for="(article, index) in articles" :key="`article-${index}`">
                        <WikiArticleIndex
                            :icon="article.icon"
                            :user-name="article.userName"
                            :user-section="article.userSection"
                            :title="article.title"
                            :article="article.article"
                            :created-at="article.createdAt"
                            class="ma-2"
                        />
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col cols="12" sm="5">
                <v-card>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="n of 10" :key="`fav-article-${n}`">
                                <span>人気記事-{{ n }}</span>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
const data = ref<any[]>([
    {
        title: 'チームの知見を共有しよう',
        subtitle: '社内の最新情報、技術ノウハウ、プロジェクト事例をみんなで共有するブログです',
        searchable: true,
        searchPlaceHolder: '記事を検索...'
    },
    {
        title: '日本経済について',
        subtitle: '',
        searchable: false,
        searchPlaceHolder: '記事を検索...'
    }
])

const hero = ref<any>(data.value[0])

const switchHero = () => {
    hero.value = data.value[1]
}

const handleClickSearch = (e: any) => {
    alert(e)
}

const articles = ref<any[]>([
    {
        icon: 'mdi-account',
        userName: '山田 太郎',
        userSection: 'システム部',
        title: '',
        article: '',
        createdAt: new Date(),
    },
    {
        icon: '',
        userName: '山田 花子',
        userSection: '経理部',
        title: '',
        article: '',
        createdAt: new Date(),
    },
    {
        icon: '',
        userName: '佐藤 次郎',
        userSection: '営業部',
        title: '',
        article: '',
        createdAt: new Date(),
    }
])
</script>