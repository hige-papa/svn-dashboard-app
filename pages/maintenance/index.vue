<template>
    <v-container>
        <v-row>
            <v-col cols="6" sm="2" v-for="(m, index) in menu" :key="`menu-${index}`">
                <v-btn color="primary" height="150px" class="w-100" :prepend-icon="m.icon" @click="goTo(m.path)">{{ m.label }}</v-btn>
            </v-col>
        </v-row>
    </v-container>
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
        icon: 'mdi-cog',
        isActive: false,
        path: '/facility'
    },
    {
        id: 'equipments',
        label: '備品',
        icon: 'mdi-help-circle',
        isActive: false,
        path: '/equipment'
    }
]

const goTo = (path: string) => {
    navigateTo(path)
}
</script>