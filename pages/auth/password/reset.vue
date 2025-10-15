<template>
  <div class="password-reset-form-container">
    <h2 class="form-title">パスワードのリセット</h2>
    <p class="form-description">
      アカウントに登録されているメールアドレスを入力してください。パスワード再設定用のリンクを送信します。
    </p>
    <form @submit.prevent="handlePasswordReset" class="form">
      <div class="form-group">
        <label for="email" class="form-label">メールアドレス</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="form-input"
          placeholder="your-email@example.com"
        />
      </div>

      <div v-if="successMessage" class="message success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="message error-message">
        {{ errorMessage }}
      </div>

      <button type="submit" :disabled="loading" class="submit-button">
        <span v-if="loading">送信中...</span>
        <span v-else>リセットメールを送信</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  getAuth,
  sendPasswordResetEmail,
  type AuthError,
  type ActionCodeSettings,
} from 'firebase/auth';

// head設定
useHead({
  title: 'TASCAL - パスワード再設定'
});

// リアクティブな状態変数
const email = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// パスワードリセット処理
const handlePasswordReset = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const auth = getAuth();
    
    // パスワードリセット完了後にリダイレクトさせたいページのURLを指定します。
    // 一般的にはログインページが良いでしょう。
    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/signin?password_reset=true`, // リダイレクト先URL
      handleCodeInApp: false,
    };
    
    // パスワードリセットメールを送信
    await sendPasswordResetEmail(auth, email.value, actionCodeSettings);

    successMessage.value =
      'パスワード再設定用のメールを送信しました。受信箱をご確認ください。';

  } catch (error) {
    // Firebaseからのエラーをハンドリング
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/user-not-found':
        errorMessage.value = '指定されたメールアドレスのアカウントが見つかりません。';
        break;
      case 'auth/invalid-email':
        errorMessage.value = 'メールアドレスの形式が正しくありません。';
        break;
      default:
        errorMessage.value = 'エラーが発生しました。もう一度お試しください。';
        console.error('Password reset error:', authError);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.password-reset-form-container {
  max-width: 420px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  text-align: center;
  margin-bottom: 0.5rem;
}

.form-description {
  font-size: 0.9rem;
  color: #4a5568;
  text-align: center;
  margin-bottom: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background-color: #2b6cb0;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.submit-button:hover:not(:disabled) {
  background-color: #2c5282;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  background-color: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.error-message {
  background-color: #fed7d7;
  color: #742a2a;
  border: 1px solid #fbb6b6;
}
</style>