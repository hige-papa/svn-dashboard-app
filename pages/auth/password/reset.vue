<template>
    <v-container>
        <v-card @keydown.enter="sendPasswordResetEmail">
            <v-card-text>
                <v-alert v-if="complete" type="success">
                    <p>{{ email }}宛にメールを送信しました。</p>
                    <p>メールをご確認ください。</p>
                </v-alert>
                <v-text-field
                    v-else
                    v-model="email"
                    label="email"
                    variant="outlined"
                    prepend-icon="mdi-email"
                    hide-details>
                </v-text-field>
            </v-card-text>
            <v-card-actions v-if="!complete">
                <v-spacer></v-spacer>
                <v-btn color="primary" @click.stop="sendPasswordResetEmail" :loading="loading">パスワードリセットのメールを送信する</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/firebase/useAuth'

definePageMeta({
    layout: false
})

const { sendPasswordResetEmailAsync } = useAuth()

const email = ref<string>('')

const complete = ref<boolean>(false)

const loading = ref<boolean>(false)

const sendPasswordResetEmail = async () => {
    loading.value = true
    await sendPasswordResetEmailAsync(email.value).then(_ => {
        console.log(`success to send password reset email`)
        complete.value = true
    }).catch(error => {
        alert('メールの送信に失敗しました')
        console.error(`failed to send password reset email`, error)
    }).finally(() => {
        loading.value = false
    })
}
</script>