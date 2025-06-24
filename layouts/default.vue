<script setup lang="ts">
</script>

<template>
    <v-app v-cloak>
        <AppHeader />
        <SideBar />
        <v-main>
            <slot></slot>
        </v-main>
    </v-app>
</template>