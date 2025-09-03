<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const { loginWithEmailAndPasswordAsync } = useAuth()

const id = ref<string>('')

const password = ref<string>('')

const message = ref<string>('')

// Tascal ロゴのデータURL
const tascalLogoDataUrl = ref<string>('')

// コンポーネントマウント時にデータURLを設定
onMounted(() => {
    // ここにbase64ファイルの内容（データURL）を設定してください
    // 例: tascalLogoDataUrl.value = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
    // 実際のデータURLを添付ファイルから取得して設定してください
})

const signin = async () => {
    message.value = ''
    await loginWithEmailAndPasswordAsync(id.value, password.value).then(_ => {
        navigateTo('/')
    }).catch(error => {
        if (error.code.indexOf("auth/invalid-credential") >= 0) {
            message.value = 'メールアドレスまたはパスワードが間違っています'
        }
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
                <v-img 
                    v-if="tascalLogoDataUrl"
                    :src="tascalLogoDataUrl"
                    alt="Tascal Logo"
                    max-width="200"
                    max-height="150"
                    contain
                ></v-img>
                <div v-else class="text-center">
                    <v-icon size="48" class="mb-2">mdi-domain</v-icon>
                    <p class="text-h6">Tascal</p>
                </div>
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