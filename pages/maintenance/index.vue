<template>
    <div class="page-container">
        <v-container class="h-100">
            <v-row>
                <v-col cols="6" sm="2" v-for="(m, index) in menu" :key="`menu-${index}`">
                    <v-btn height="150px" class="w-100" @click="goTo(m.path)" stacked>
                        <template v-slot:prepend>
                            <v-icon color="primary" :icon="m.icon"></v-icon>
                        </template>
                        {{ m.label }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup lang="ts">
const menu = [
    {
        id: 'users',
        label: 'ユーザー',
        icon: 'mdi-account-multiple',
        isActive: false,
        path: '/users'
    },
    {
        id: 'facilities',
        label: '施設',
        icon: 'mdi-sofa',
        isActive: false,
        path: '/facility'
    },
    {
        id: 'equipments',
        label: '備品',
        icon: 'mdi-tools',
        isActive: false,
        path: '/equipment'
    },
    {
        id: 'user-help',
        label: 'ユーザーヘルプ',
        icon: 'mdi-help-circle-outline',
        isActive: false,
        path: '/manuals/user-help'
    },
    {
        id: 'project-manual',
        label: 'プロジェクトマニュアル',
        icon: 'mdi-apps',
        isActive: false,
        path: '/manuals/project-manual'
    },
    {
        id: 'developer-guide',
        label: '開発者マニュアル',
        icon: 'mdi-application-braces-outline',
        isActive: false,
        path: '/manuals/developer-guide'
    }
]

const goTo = (path: string) => {
    navigateTo(path)
}
</script>

<style lang="css" scoped>
/* 全体のページスタイル */
.page-container {
    background-color: var(--background-light);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
    padding: 24px;
}

.card {
    color: white;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
}
</style>