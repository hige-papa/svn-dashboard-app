<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'
import { useDisplay } from 'vuetify'

// head設定
useHead({
  title: 'TASCAL - ログイン'
});

const { mobile } = useDisplay()
const { loginWithEmailAndPasswordAsync } = useAuth()

const email = ref<string>('')

const password = ref<string>('')

const showPassword = ref<boolean>(false)

const message = ref<string>('')

const loadging = ref<boolean>(false)

const signin = async () => {
    message.value = ''
    loadging.value = true
    await loginWithEmailAndPasswordAsync(email.value, password.value).then(_ => {
        navigateTo('/')
    }).catch(err => {
        message.value = 'idまたはパスワードが違います'
    }).finally(() => {
        loadging.value = false
    })
}

definePageMeta({
    layout: false
})
</script>

<template>
    <v-container class="d-flex align-center justify-center" :fluid="mobile">
        <v-card :width="mobile ? '100%' : '50%'" @keydown.enter="signin">
            <!-- <v-img class="w-100" src="/public/img/logo-001.png" height="150px"></v-img> -->
            <v-sheet height="200" class="d-flex align-center justify-center">
                <v-img class="w-100" src="/public/img/logo-001.png" height="200px"></v-img>
            </v-sheet>
            <v-card-text>
                <v-list>
                    <v-list-item class="pa-1">
                        <p v-if="message" class="text-red text-body-2">{{ message }}</p>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field
                            v-model="email"
                            label="email"
                            variant="outlined"
                            prepend-icon="mdi-email"
                            class="mt-2" />
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field
                            label="パスワード"
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'" 
                            variant="outlined"
                            prepend-icon="mdi-lock"
                            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            @click:append-inner="showPassword = !showPassword"
                            class="mt-2" />
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-btn @click="signin" class="mt-2 w-100" variant="elevated" color="primary" :loading="loadging">ログイン</v-btn>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <template #append>
                            <v-btn color="primary" variant="text" @click.stop="navigateTo('/auth/password/reset')">
                                パスワードを忘れた方はこちら
                            </v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-container>
</template>