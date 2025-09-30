import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    verifyBeforeUpdateEmail,
    verifyPasswordResetCode,
    confirmPasswordReset,
    updateEmail,
    updatePassword,
    updatePhoneNumber,
    PhoneAuthProvider,
    RecaptchaVerifier,
    reauthenticateWithCredential,
    type Auth,
    type UserInfo,
    EmailAuthProvider,
    type ActionCodeSettings,
} from 'firebase/auth';

export const useAuth = () => {
    const auth = useState<Auth>('auth');

    const createUserWithEmailAndPasswordAsync = async (email: string, password: string, verify?: boolean) => {
        verify = verify ? verify : false
        return await createUserWithEmailAndPassword(auth.value, email, password)
            .then(async (response) => {
                console.log(`success create user with firebase authentication`);
                if (verify) await sendEmailVerificationAsync(response.user);
                return response.user;
            })
            .catch(error => {
                console.error("failed create user with firebase authentication", error);
                return null;
            });
    };

    const sendEmailVerificationAsync = async (u: any | null) => {
        u = u ? u : auth.value.currentUser;
        if (u) {
            await sendEmailVerification(u)
                .then(_ => {
                    console.log(`success send email verification`);
                })
                .catch(error => {
                    console.error("failed send email verification", error);
                });
        } else {
            console.log('user is signed out');
        }
    };

    const loginWithEmailAndPasswordAsync = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth.value, email, password);
    };

    const logoutAsync = async () => {
        await signOut(auth.value)
            .then(_ => {
                console.log("success logout with firebase authentication");
                navigateTo('/signin');
            })
            .catch(error => {
                console.error("failed logout with firebase authentication", error);
            });
    }

    const updateUserAsync = async (u: UserInfo) => {
        if (auth.value.currentUser) {
            return await updateProfile(auth.value.currentUser, u)
                .then(_ => {
                    // user.value = u;
                    console.log("success update user profile with firebase authentication");
                })
                .catch(error => {
                    console.error("failed update user profile firebase authentication", error);
                });
        }
    }

    const updatePhoneNumberAsync = async (verificationCode: string) => {
        if (auth.value.currentUser) {
            const applicationVerifier = new RecaptchaVerifier(auth.value, 'recaptcha-container');
            const provider = new PhoneAuthProvider(auth.value);
            const verificationId = await provider.verifyPhoneNumber('+16505550101', applicationVerifier);
            // Obtain the verificationCode from the user.
            const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
            await updatePhoneNumber(auth.value.currentUser, phoneCredential);
        }
    }

    const reauthenticateWithCredentialAsync = async (email: string, password: string) => {
        if (!auth.value?.currentUser) return
        const credential = EmailAuthProvider.credential(email, password)
        return await reauthenticateWithCredential(auth.value.currentUser, credential)
    }

    const sendPasswordResetEmailAsync = async (email: string) => {
        return await sendPasswordResetEmail(auth.value, email)
    }

    const verifyBeforeUpdateEmailAsync = async (code: string) => {
        if (!auth.value?.currentUser) return
        return await verifyBeforeUpdateEmail(auth.value.currentUser, code)
    }

    const verifyPasswordResetCodeAsync = async (code: string) => {
        return await verifyPasswordResetCode(auth.value, code)
    }

    const confirmPasswordResetAsync = async (code: string, newPassword: string) => {
        return await confirmPasswordReset(auth.value, code, newPassword)
    }

    const updatePasswordAsync = async (newPassword: string) => {
        const user = auth.value.currentUser
        if (user) {
            return await updatePassword(user, newPassword)
        } else {
            throw new Error('user is null')
        }
    }

    const updateEmailAsync = async (email: string) => {
        const user = auth.value.currentUser
        if (user) {
            return await updateEmail(user, email)
        } else {
            throw new Error('user is null')
        }
    }

    /**
     * 安全な方法でユーザーのメールアドレスを更新し、確認メールを送信します。
     * @param newEmail 更新したい新しいメールアドレス
     */
    const updateEmailWithVerification = async (newEmail: string): Promise<void> => {
        const user = auth.value.currentUser;

        if (!user) {
            throw new Error("ユーザーがログインしていません。");
        }

        // ユーザーをアプリにリダイレクトさせるための設定
        const actionCodeSettings = {
            url: 'https://tascal-app-a344b.firebaseapp.com/', // 更新完了後にリダイレクトさせたいURL
            handleCodeInApp: true,
        } as ActionCodeSettings;

        try {
            // updateEmail の代わりに verifyBeforeUpdateEmail を使用する
            await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);

            // この時点でUIにメッセージを表示する
            // 例: 「新しいメールアドレスに確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。」
            console.log("確認メールを送信しました。");

        } catch (error) {
            console.error("メールアドレス更新（確認メール送信）中にエラーが発生しました:", error);
            // ここで再認証が必要なエラーなどもハンドルする
            if ((error as any).code === 'auth/requires-recent-login') {
                // 再認証ロジック...
            }
            throw error; // エラーを呼び出し元に再度スローする
        }
    }

    return {
        createUserWithEmailAndPasswordAsync,
        loginWithEmailAndPasswordAsync,
        logoutAsync,
        updateUserAsync,
        sendPasswordResetEmailAsync,
        verifyBeforeUpdateEmailAsync,
        verifyPasswordResetCodeAsync,
        confirmPasswordResetAsync,
        updatePasswordAsync,
        updateEmailAsync,
        updateEmailWithVerification,
    };
};