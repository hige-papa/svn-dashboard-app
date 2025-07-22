<script setup lang="ts">
// import { useAuth } from '~/composables/firebase/useAuth'
import { useDisplay } from 'vuetify'

// const { logoutAsync } = useAuth()
const { mobile } = useDisplay()

const state = useState<AppState>('appState')
</script>

<template>
    <v-app-bar app>
        <v-app-bar-nav-icon v-if="mobile" @click.stop="state.drawer = !state.drawer"></v-app-bar-nav-icon>
        <v-icon @click="navigateTo('/')" icon="mdi-calendar-check-outline" class="ml-5" color="primary" size="x-large"></v-icon>
        <v-app-bar-title>
            <h3 class="title">TASCAL</h3>
        </v-app-bar-title>
        <v-spacer></v-spacer>
        <!-- <v-tooltip text="ログアウト">
            <template v-slot:activator="{ props }">
                <v-icon v-bind="props" icon="mdi-logout" @click="logoutAsync" class="mr-5"></v-icon>
            </template>
        </v-tooltip> -->
        
        <!-- <template v-slot:append>
            <v-menu open-on-click location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn color="primary" class="mr-3" icon v-bind="props">
                        <v-avatar color="white">
                            <v-icon icon="mdi-account"></v-icon>
                        </v-avatar>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item dense @click="">
                        <template v-slot:prepend>
                            <v-icon icon="mdi-logout"></v-icon>
                        </template>
                        <span>ログアウト</span>
                    </v-list-item>
                </v-list>
            </v-menu>
        </template> -->
    </v-app-bar>
</template>

<style lang="css" scoped>
.title {
    color: #4a6cf7;
}
</style>