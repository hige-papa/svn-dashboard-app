import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

 const firestore = useState<Firestore>('db');

/**
 * Firestoreのリアルタイムリスナーを提供するComposable
 *
 * @returns {object} `syncCollection`と`syncDocument`メソッドを持つオブジェクト
 */
export const useFirestoreSync = () => {

  // リスナーの購読を解除するための関数を保持
  let unsubscribe: Unsubscribe | null = null;

  /**
   * 指定されたパスのコレクションを監視します。
   * データはリアルタイムで更新されます。
   * @template T - 取得するドキュメントの型
   * @param {string} collectionPath - 監視するコレクションのパス (例: 'users')
   * @returns {{ data: Ref<T[]>, pending: Ref<boolean>, error: Ref<Error | null> }} リアクティブなデータ、読み込み状態、エラー
   */
  const syncCollection = <T extends DocumentData>(collectionPath: string) => {
    const data = ref<T[]>([]);
    const pending = ref(true);
    const error = ref<Error | null>(null);

    // コレクションへの参照を作成
    const collectionRef = collection(firestore.value, collectionPath);

    // onSnapshotでリスナーを設置
    unsubscribe = onSnapshot(
      collectionRef,
      (querySnapshot) => {
        // データをVueのrefに格納
        data.value = querySnapshot.docs.map(doc => ({
            id: doc.id, // ドキュメントIDも付与する
            ...doc.data(),
        })) as unknown as T[];
        pending.value = false;
      },
      (err) => {
        // エラーハンドリング
        console.error(`[Firestore Error] Failed to listen to collection ${collectionPath}:`, err);
        error.value = err;
        pending.value = false;
      }
    );

    return { data, pending, error };
  };

  /**
   * 指定されたパスのドキュメントを監視します。
   * データはリアルタイムで更新されます。
   * @template T - 取得するドキュメントの型
   * @param {string} documentPath - 監視するドキュメントのパス (例: 'users/user123')
   * @returns {{ data: Ref<T | null>, pending: Ref<boolean>, error: Ref<Error | null> }} リアクティブなデータ、読み込み状態、エラー
   */
  const syncDocument = <T extends DocumentData>(documentPath: string) => {
    const data = ref<T | null>(null);
    const pending = ref(true);
    const error = ref<Error | null>(null);

    // ドキュメントへの参照を作成
    const docRef = doc(firestore.value, documentPath);

    // onSnapshotでリスナーを設置
    unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        // ドキュメントが存在する場合
        if (docSnapshot.exists()) {
          data.value = {
              id: docSnapshot.id, // ドキュメントIDも付与する
              ...docSnapshot.data(),
          } as unknown as T;
        } else {
          // ドキュメントが存在しない場合
          data.value = null;
          console.warn(`[Firestore] Document at path "${documentPath}" does not exist.`);
        }
        pending.value = false;
      },
      (err) => {
        // エラーハンドリング
        console.error(`[Firestore Error] Failed to listen to document ${documentPath}:`, err);
        error.value = err;
        pending.value = false;
      }
    );

    return { data, pending, error };
  };

  // コンポーネントがアンマウントされるときにリスナーを自動的に解除
  onUnmounted(() => {
    if (unsubscribe) {
      // console.log('Firestore listener unsubscribed.');
      unsubscribe();
    }
  });

  return {
    syncCollection,
    syncDocument,
  };
};