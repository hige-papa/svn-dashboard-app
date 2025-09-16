import { orderBy, QueryConstraint, startAfter, limit, or, } from 'firebase/firestore';
import { useDocumentRoot } from "~/composables/firebase/useDocumentRoot";
import { useFirestore } from "~/composables/firebase/useFirestore";
import { useUuid } from '~/composables/common/useUuid';

export const useWiki = () => {
    const { generateUuid } = useUuid();
    const { wikiArticleDocRoot, wikiArticleHistoryDocRoot } = useDocumentRoot();
    const { updateDocWithRefAsync, addDocWithRefAsync, getDocRef, getDocWithRefAsync, getCollectionAsync, deleteDocWithRefAsync, countCollectionAsync } = useFirestore();

    const addAsync = async (m: any) => {
        const id = generateUuid();
        const ref = getDocRef(wikiArticleDocRoot.document(id))
        m.version = 1;
        return await addDocWithRefAsync(ref, m).then(async _ => {
            const snapShot = await getDocWithRefAsync(ref);
            if (snapShot?.exists()) {
                const data = snapShot.data() as any;
                data.id = id;

                // 履歴も作る
                const historyId = generateUuid();
                const historyRef = getDocRef(wikiArticleHistoryDocRoot.document(id, historyId));
                const historyData = {
                    snapshot: data,
                    version: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as WikiArticleHistory;
                await addDocWithRefAsync(historyRef, historyData);

                return data;
            }
            return 
        }).catch(_ => {
            return undefined;
        });
    };

    const getAsync = async (id: string) => {
        const ref = getDocRef(wikiArticleDocRoot.document(id))
        return await getDocWithRefAsync(ref).then(async response => {
            const data = response?.data() as any;
            data.id = id;
            return data;
        }).catch(_ => {
            return undefined;
        });
    };

    const getListAsync = async (...qc: QueryConstraint[]) => {
        const result = [] as any[]
        await getCollectionAsync(wikiArticleDocRoot.collection(), ...qc).then(async response => {
            if (!response.empty) {
                response.docs.forEach(e => {
                    const data = e.data() as any;
                    data.id = e.id;
                    result.push(data)
                })
            }
        }).catch(_ => {
            return undefined;
        });
        return result;
    };

    const getHistoriesAsync = async (articleId: string, ...qc: QueryConstraint[]) => {
        const result = [] as any[]
        await getCollectionAsync(wikiArticleHistoryDocRoot.collection(articleId), ...qc).then(async response => {
            if (!response.empty) {
                response.docs.forEach(e => {
                    const data = e.data() as any;
                    data.id = e.id;
                    result.push(data)
                })
            }
        }).catch(_ => {
            return undefined;
        });
        return result;
    }

    const countAsync = async (...qc: QueryConstraint[]) => {
        return await countCollectionAsync(wikiArticleDocRoot.collection(), ...qc).catch(_ => {
            return 0;
        });
    };

    const lastVisible = ref<any>(null);

    const loadedItems = ref<any[]>([]);

    const loadAsync = async (take: number = 20) => {
        const query = [
            orderBy('created_at', 'desc'),
            limit(take),
        ] as QueryConstraint[];

        if (lastVisible.value) {
            query.push(startAfter(lastVisible.value));
        }
        const response = await getCollectionAsync(wikiArticleDocRoot.collection(), ...query);
        lastVisible.value = response.docs[response.docs.length - 1];
        for (const e of response.docs) {
            const data = e.data() as any;
            data.id = e.id;
            loadedItems.value.push(data);
        }
        return response.size
    }

    const loadChunkAsync = async (take: number = 20) => {
        const query = [
            orderBy('created_at', 'desc'),
            limit(take),
        ] as QueryConstraint[];

        while (true) {
            if (lastVisible.value) {
                query.push(startAfter(lastVisible.value));
            }
            const response = await getCollectionAsync(wikiArticleDocRoot.collection(), ...query);
            if (response.empty) {
                break;
            }
            lastVisible.value = response.docs[response.docs.length - 1];
            for (const e of response.docs) {
                const data = e.data() as any;
                data.id = e.id;
                loadedItems.value.push(data);
            }
        }
        if (loadedItems.value.length === 0) {
            lastVisible.value = null;
        }
    }

    const updateAsync = async (id: string, m: any) => {
        const ref = getDocRef(wikiArticleDocRoot.document(id))
        m.version = (m.version ?? 1) + 1;
        await updateDocWithRefAsync(ref, m).then(async _ => {
            // 履歴も作る
            const snapShot = await getDocWithRefAsync(ref);
            if (snapShot?.exists()) {
                const data = snapShot.data() as any;
                data.id = id;
                const historyId = generateUuid();
                const historyRef = getDocRef(wikiArticleHistoryDocRoot.document(id, historyId));
                const historyData = {
                    snapshot: data,
                    version: (data.version ?? 1),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as WikiArticleHistory;
                await addDocWithRefAsync(historyRef, historyData);
            }
        });
        return
    };

    const deleteAsync = async (id: string) => {
        const ref = getDocRef(wikiArticleDocRoot.document(id))
        return await deleteDocWithRefAsync(ref)
    };

    return {
        addAsync,
        getAsync,
        getListAsync,
        loadAsync,
        loadedItems,
        loadChunkAsync,
        lastVisible,
        countAsync,
        updateAsync,
        deleteAsync,
        getHistoriesAsync,
    };
}