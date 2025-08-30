<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const { loginWithEmailAndPasswordAsync } = useAuth()

const id = ref<string>('')
const password = ref<string>('')
const message = ref<string>('')
const showPassword = ref<boolean>(false)
const isLoading = ref<boolean>(false)

// 半角英数字のみを許可する入力制御
const filterAlphanumeric = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9@._-]/g, '')
}

// IDの入力制御（メールアドレス用の記号も許可）
const onIdInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const filtered = target.value.replace(/[^a-zA-Z0-9@._-]/g, '')
    id.value = filtered
    target.value = filtered
}

// パスワードの入力制御
const onPasswordInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const filtered = target.value.replace(/[^a-zA-Z0-9]/g, '')
    password.value = filtered
    target.value = filtered
}

// バリデーション関数
const validateInput = (): boolean => {
    message.value = ''
    
    // 必須チェック
    if (!id.value.trim()) {
        message.value = 'IDを入力してください。'
        return false
    }
    
    if (!password.value.trim()) {
        message.value = 'パスワードを入力してください。'
        return false
    }
    
    // メールアドレス形式チェック
    if (!id.value.includes('@')) {
        message.value = 'メールアドレスを入力してください。'
        return false
    }
    
    return true
}

const showForgotPasswordMessage = () => {
    alert('実装中')
}

const signin = async () => {
    if (!validateInput()) {
        return
    }
    
    isLoading.value = true
    message.value = ''
    
    try {
        const result = await loginWithEmailAndPasswordAsync(id.value, password.value)
        if (result) {
            console.log('Login successful', result)
            await navigateTo('/')
        } else {
            message.value = 'ログインに失敗しました。'
        }
    } catch (error: any) {
        console.error('Login error:', error)
        console.log('Error code:', error?.code)
        console.log('Error message:', error?.message)
        console.log('Full error object:', JSON.stringify(error, null, 2))
        
        // Firebaseのエラーコードに基づいて詳細なメッセージを表示
        if (error?.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message.value = '入力されたメールアドレスは登録されていません。'
                    break
                case 'auth/wrong-password':
                    message.value = 'パスワードが正しくありません。'
                    break
                case 'auth/invalid-email':
                    message.value = 'メールアドレスの形式が正しくありません。'
                    break
                case 'auth/user-disabled':
                    message.value = 'このアカウントは無効になっています。'
                    break
                case 'auth/too-many-requests':
                    message.value = 'ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください。'
                    break
                case 'auth/network-request-failed':
                    message.value = 'ネットワークエラーが発生しました。接続を確認してください。'
                    break
                case 'auth/invalid-credential':
                case 'auth/invalid-login-credentials':
                    message.value = 'メールアドレスまたはパスワードが正しくありません。'
                    break
                case 'auth/missing-password':
                    message.value = 'パスワードを入力してください。'
                    break
                case 'auth/weak-password':
                    message.value = 'パスワードが弱すぎます。'
                    break
                default:
                    message.value = `ログインに失敗しました。（エラーコード: ${error.code}）`
            }
        } else if (error?.message) {
            // エラーコードがない場合はメッセージから判定を試行
            const errorMessage = error.message.toLowerCase()
            if (errorMessage.includes('user-not-found') || errorMessage.includes('no user record')) {
                message.value = '入力されたメールアドレスは登録されていません。'
            } else if (errorMessage.includes('wrong-password') || errorMessage.includes('password')) {
                message.value = 'パスワードが正しくありません。'
            } else {
                message.value = 'ログインに失敗しました。IDまたはパスワードが正しくありません。'
            }
        } else {
            message.value = 'ログインに失敗しました。IDまたはパスワードが正しくありません。'
        }
    } finally {
        isLoading.value = false
    }
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
                        <div v-if="message" class="text-red-darken-2 text-body-2 mb-2 pa-2 bg-red-lighten-5 rounded">
                            {{ message }}
                        </div>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field 
                            v-model="id" 
                            label="id" 
                            variant="outlined" 
                            class="mt-2"
                            @input="onIdInput"
                            placeholder="メールアドレスを入力"
                        ></v-text-field>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-text-field 
                            v-model="password" 
                            label="password" 
                            :type="showPassword ? 'text' : 'password'" 
                            variant="outlined" 
                            class="mt-2" 
                            @keydown.enter="signin"
                            @input="onPasswordInput"
                            placeholder="パスワードを入力"
                        ></v-text-field>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-checkbox v-model="showPassword" label="パスワードを表示する" color="primary" hide-details></v-checkbox>
                    </v-list-item>
                    <v-list-item class="pa-1 text-right">
                        <a href="#" @click.prevent="showForgotPasswordMessage" class="text-primary text-decoration-none">パスワードをお忘れの方 ></a>
                    </v-list-item>
                    <v-list-item class="pa-1">
                        <v-btn 
                            @click="signin" 
                            :loading="isLoading"
                            :disabled="isLoading"
                            class="mt-2 w-100" 
                            variant="elevated" 
                            color="primary"
                        >
                            ログイン
                        </v-btn>
                    </v-list-item>
                </v-list>
            </v-container>
        </v-card>
    </v-container>
</template>