<template>
    <v-container>
        <v-alert v-if="alertMessage" :type="alertMessage.type">{{ alertMessage.message }}</v-alert>
        <v-card v-if="verified" @keydown.enter="reset">
            <v-card-title>パスワードの再設定</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            label="パスワード"
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'" 
                            variant="outlined"
                            prepend-icon="mdi-lock"
                            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            @click:append-inner="showPassword = !showPassword"
                            hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field
                            label="パスワード確認"
                            v-model="passwordConfirm"
                            :type="showPassword ? 'text' : 'password'" 
                            variant="outlined"
                            prepend-icon="mdi-lock"
                            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            @click:append-inner="showPassword = !showPassword"
                            hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click.stop="reset" :loading="loading">パスワードを更新する</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'

definePageMeta({
    layout: false
})

const { verifyPasswordResetCodeAsync, confirmPasswordResetAsync } = useAuth()

const { query } = useRoute()

const code = computed(() => {
    return query.oobCode as string
})

const verified = ref<boolean>(false)

interface AlertMessage {
    message: string
    type: "success" | "info" | "warning" | "error" | undefined
}

const alertMessage = ref<AlertMessage>()

const verifyPasswordResetCode = async (code: string) => {
    await verifyPasswordResetCodeAsync(code).then(response => {
        console.log(`success to verify password reset code: ${response}`)
        verified.value = true
    }).catch(error => {
        console.error(`failed to verify password reset code`, error)
        alertMessage.value = {
            message: '無効なURLです',
            type: 'error'
        }
    })
}

const password = ref<string>('')

const passwordConfirm = ref<string>('')

const showPassword = ref<boolean>(false)

const loading = ref<boolean>(false)

const reset = async () => {
    if (password.value != passwordConfirm.value) {
        alert('パスワード確認が一致しません')
        return
    }
    loading.value = true
    await confirmPasswordResetAsync(code.value, password.value).then(_ => {
        console.log('success reset password')
        loading.value = false
        password.value = ''
        passwordConfirm.value = ''
        navigateTo('/signin')
    }).catch(error =>{
        console.error('failed reset password', error)
        alert('パスワードのリセットに失敗しました')
    }).finally(() => {
        loading.value = false
    })
}

onMounted(async () => {
    await verifyPasswordResetCode(code.value)
})
</script>