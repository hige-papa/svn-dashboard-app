<template>
    <div class="page-container">
        <v-container class="h-100">
            <v-row>
                <v-col cols="6" sm="2" v-for="(m, index) in menu" :key="`menu-${index}`">
                    <v-btn height="140px" class="w-100" @click="goTo(m.path)" stacked>
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
// head設定
useHead({
  title: 'TASCAL - 技術共有'
});

const menu = [
    {
        id: 'dragable-modal',
        label: '可動式のモーダルのサンプル',
        icon: 'mdi-application-braces-outline',
        isActive: false,
        path: '/techstacks/dragable-modal'
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
    background: linear-gradient(135deg, var(--brand-color-1), var(--brand-color-2), var(--brand-color-3));
}

@media (max-width: 768px) {
    .page-container {
        padding: 8px;
    }
}
</style>