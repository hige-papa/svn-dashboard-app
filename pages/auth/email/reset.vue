<template>
  <div class="email-change-form-container">
    <h2 class="form-title">メールアドレスの変更</h2>
    <p class="form-description">
      新しいメールアドレスと現在のパスワードを入力してください。
    </p>
    <form @submit.prevent="handleChangeEmail" class="form">
      <div class="form-group">
        <label for="new-email" class="form-label">新しいメールアドレス</label>
        <input
          id="new-email"
          v-model="newEmail"
          type="email"
          required
          class="form-input"
          placeholder="new-email@example.com"
        />
      </div>
      <div class="form-group">
        <label for="current-password" class="form-label">現在のパスワード</label>
        <input
          id="current-password"
          v-model="currentPassword"
          type="password"
          required
          class="form-input"
          placeholder="現在のパスワード"
        />
      </div>

      <div v-if="successMessage" class="message success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="message error-message">
        {{ errorMessage }}
      </div>

      <button type="submit" :disabled="loading" class="submit-button">
        <span v-if="loading">処理中...</span>
        <span v-else>確認メールを送信</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  type AuthError,
  type ActionCodeSettings,
} from 'firebase/auth';

// head設定
useHead({
  title: 'TASCAL - メールアドレス再設定'
});

// リアクティブな状態変数
const newEmail = ref('');
const currentPassword = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// メールアドレス変更処理
const handleChangeEmail = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    // ユーザーが存在しない場合はエラー
    if (!user || !user.email) {
      throw new Error('ユーザーがログインしていません。');
    }

    // --- 1. ユーザーの再認証 ---
    // 重要な操作の前に、ユーザーが本人であることを確認します。
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value);
    await reauthenticateWithCredential(user, credential);
    
    // パスワードリセット完了後にリダイレクトさせたいページのURLを指定します。
    // 一般的にはログインページが良いでしょう。
    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/signin?email_reset=true`, // リダイレクト先URL
      handleCodeInApp: false,
    };

    // --- 2. 新しいメールアドレスの確認メールを送信 ---
    // この関数は、ユーザーが新しいメールアドレスのリンクをクリックするまで、
    // 実際のメールアドレス変更を保留します。
    await verifyBeforeUpdateEmail(user, newEmail.value, actionCodeSettings);

    successMessage.value =
      '確認メールを送信しました。新しいメールアドレスの受信箱を確認し、変更を完了してください。';
    
    // フォームをリセット
    newEmail.value = '';
    currentPassword.value = '';

  } catch (error) {
    // Firebaseからのエラーをハンドリング
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/wrong-password':
        errorMessage.value = '現在のパスワードが間違っています。';
        break;
      case 'auth/invalid-email':
        errorMessage.value = '新しいメールアドレスの形式が正しくありません。';
        break;
      case 'auth/email-already-in-use':
        errorMessage.value = 'このメールアドレスは既に使用されています。';
        break;
      case 'auth/requires-recent-login':
        errorMessage.value = 'セキュリティのため、再ログインが必要です。一度ログアウトしてから再度お試しください。';
        break;
      default:
        errorMessage.value = 'エラーが発生しました。もう一度お試しください。';
        console.error('Email change error:', authError);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.email-change-form-container {
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