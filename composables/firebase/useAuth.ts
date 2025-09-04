import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    verifyPasswordResetCode,
    confirmPasswordReset,
    updatePassword,
    updatePhoneNumber,
    PhoneAuthProvider,
    RecaptchaVerifier,
    type Auth,
    type UserInfo,
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

    const sendPasswordResetEmailAsync = async (email: string) => {
        return await sendPasswordResetEmail(auth.value, email)
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

    return {
        createUserWithEmailAndPasswordAsync,
        loginWithEmailAndPasswordAsync,
        logoutAsync,
        updateUserAsync,
        sendPasswordResetEmailAsync,
        verifyPasswordResetCodeAsync,
        confirmPasswordResetAsync,
        updatePasswordAsync,
    };
};