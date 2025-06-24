<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const { loginWithEmailAndPasswordAsync } = useAuth()

const id = ref<string>('')

const password = ref<string>('')

const message = ref<string>('')

const signin = async () => {
    message.value = ''
    await loginWithEmailAndPasswordAsync(id.value, password.value).then(_ => {
        navigateTo('/')
    }).catch(err => {
        message.value = 'idまたはパスワードが違います'
    })
}

definePageMeta({
    layout: false
})
</script>

<template>
    <v-container class="d-flex align-center justify-center" :fluid="mobile">
        <v-card :width="mobile ? '100%' : '50%'">
            <v-sheet color="grey-lighten-1" height="250px" class="d-flex align-center justify-center">
                <p>ロゴイメージ等</p>
            </v-sheet>
            <v-container>
                <v-list>
                    <v-list-item class="pa-1">
                        <p v-if="message" class="text-red text-body-2">{{ message }}</p>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field v-model="id" label="id" variant="outlined" class="mt-2"></v-text-field>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field v-model="password" label="password" type="password" variant="outlined" class="mt-2" @keydown.enter="signin"></v-text-field>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-btn @click="signin" class="mt-2 w-100" variant="elevated" color="primary">ログイン</v-btn>
                    </v-list-item>
                </v-list>
            </v-container>
        </v-card>
    </v-container>
</template>