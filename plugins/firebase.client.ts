import { defineNuxtPlugin } from '#app';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { type User, getAuth, onAuthStateChanged, TwitterAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '~/firebase.config';
import { getVertexAI, getGenerativeModel, type ModelParams } from "firebase/vertexai";
// import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

export default defineNuxtPlugin(async () => {
    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig);
    initializeFirestore(firebaseApp, {
        ignoreUndefinedProperties: true
    });
    const db = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    const storage = getStorage(firebaseApp);
    const functions = getFunctions(firebaseApp, 'asia-northeast1');
    const analytics = getAnalytics(firebaseApp);
    const twitterAuthProvider = new TwitterAuthProvider();
    const user = ref<User | null>();
    const isAdmin = ref<boolean>();

    watch(user, async () => {
        if (user.value) {
            const result = await user.value.getIdTokenResult(true);
            isAdmin.value = result.claims.admin == true;
        } else {
            isAdmin.value = false;
        }
    });

    // Firebase Auth が初期化されたら
    const getUserAsync = () => {
        return new Promise<User | null>((resolve) => {
            var unsubscribe = onAuthStateChanged(auth, (user) => {
                // user オブジェクトを resolve
                resolve(user);

                // 登録解除
                unsubscribe();
            });
        });
    };

    user.value = await getUserAsync();

    onAuthStateChanged(auth, () => {
        if (auth.currentUser) {
            user.value = auth.currentUser;
            console.log('user logged in');
        } else {
            user.value = undefined;
            console.log('user logged out');
        }
    });

    // // Initialize the Gemini Developer API backend service
    // const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

    // // Create a `GenerativeModel` instance with a model that supports your use case
    // const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });
    
    // Initialize the Vertex AI service
    const vertexAI = getVertexAI(firebaseApp);

    // Initialize the generative model with a model that supports your use case
    // Gemini 1.5 models are versatile and can be used with all API capabilities
    const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" } as ModelParams);

    useState('firebaseApp', () => firebaseApp);
    useState('auth', () => auth);
    useState('db', () => db);
    useState('storage', () => storage);
    useState('functions', () => functions)
    useState('twitterAuthProvider', () => twitterAuthProvider);
    useState('user', () => user);
    useState('analytics', () => analytics);
    useState('isAdmin', () => isAdmin);
    useState('ai', () => model);
});