<script setup lang="ts">
const { currentRoute } = useRouter()
</script>

<template>
    <v-app v-cloak>
        <AppHeader />
        <SideBar />
        <v-main>
            <div>{{ currentRoute.name }}</div>
            <slot></slot>
        </v-main>
    </v-app>
</template>