// composables/firestoreGeneral/useFirestoreGeneral.ts

import { orderBy, QueryConstraint, startAfter, limit } from 'firebase/firestore';
import { ref } from 'vue';
import { useDocumentRoot } from "~/composables/firebase/useDocumentRoot";
import { useFirestore } from "~/composables/firebase/useFirestore";
import { useUuid } from '~/composables/common/useUuid';

export const useFirestoreGeneral = (key: string) => {
    const { generateUuid } = useUuid();
    const { generalDocRoot } = useDocumentRoot();
    const { 
        updateDocWithRefAsync, 
        addDocWithRefAsync, 
        addWithBatch,
        getDocRef, 
        getDocWithRefAsync, 
        getCollectionAsync, 
        deleteDocWithRefAsync, 
        countCollectionAsync,
        getCollectionRef: getColRef // useFirestoreからgetCollectionRefを別名でインポート
    } = useFirestore();

    const addAsync = async (m: any) => {
        const id = generateUuid();
        const ref = getDocRef(generalDocRoot.document(key, id))
        
        const entityWithId = { ...m, id };

        try {
            await addDocWithRefAsync(ref, entityWithId);
            return entityWithId;
        } catch (error) {
            console.error(`[useFirestoreGeneral:${key}] addAsync failed`, error);
            return undefined;
        }
    };

    const addWithBatchAsync = async (models: any[]) => {
        const request: BatchAction[] = []
        for (const m of models) {
            request.push({
                reference: getDocRef(generalDocRoot.document(key, generateUuid())),
                entity: m
            })
        }
        return await addWithBatch(request)
    }

    const getAsync = async (id: string) => {
        const ref = getDocRef(generalDocRoot.document(key, id))
        
        try {
            const response = await getDocWithRefAsync(ref);
            
            if (response?.exists()) {
                const data = response.data() as any;
                data.id = id;
                return data;
            }
            return undefined; 
        } catch (error) {
            console.error(`[useFirestoreGeneral:${key}] getAsync failed for id: ${id}`, error);
            return undefined;
        }
    };

    const getDocRefAsync = (id: string) => {
        return getDocRef(generalDocRoot.document(key, id))
    };

    const getListAsync = async (...qc: QueryConstraint[]) => {
        const result = [] as any[]
        try {
            const response = await getCollectionAsync(generalDocRoot.collection(key), ...qc);
            
            if (!response.empty) {
                response.docs.forEach(e => {
                    const data = e.data() as any;
                    data.id = e.id;
                    result.push(data)
                })
            }
        } catch (error) {
            console.error(`[useFirestoreGeneral:${key}] getListAsync failed`, error);
            return [];
        }
        return result;
    };

    const countAsync = async (...qc: QueryConstraint[]) => {
        return await countCollectionAsync(generalDocRoot.collection(key), ...qc).catch(error => {
            console.error(`[useFirestoreGeneral:${key}] countAsync failed`, error);
            return 0;
        });
    };

    const lastVisible = ref<any>(null);
    const loadedItems = ref<any[]>([]);

    const loadAsync = async (take: number = 20) => {
        const queryConstraints = [
            orderBy('createdAt', 'desc'), 
            limit(take),
        ] as QueryConstraint[];

        if (lastVisible.value) {
            queryConstraints.push(startAfter(lastVisible.value));
        }

        try {
            const response = await getCollectionAsync(generalDocRoot.collection(key), ...queryConstraints);
            
            if (!response.empty) {
                lastVisible.value = response.docs[response.docs.length - 1];
            } else {
                lastVisible.value = null; 
            }

            for (const e of response.docs) {
                const data = e.data() as any;
                data.id = e.id;
                loadedItems.value.push(data);
            }
            return response.size
        } catch (error) {
            console.error(`[useFirestoreGeneral:${key}] loadAsync failed`, error);
            return 0;
        }
    }

    const loadChunkAsync = async (take: number = 20) => {
        const baseQuery = [
            orderBy('createdAt', 'desc'), 
            limit(take),
        ] as QueryConstraint[];

        while (true) {
            let currentQuery = [...baseQuery];
            if (lastVisible.value) {
                currentQuery.push(startAfter(lastVisible.value));
            }
            
            try {
                const response = await getCollectionAsync(generalDocRoot.collection(key), ...currentQuery);
                
                if (response.empty) {
                    break;
                }
                
                lastVisible.value = response.docs[response.docs.length - 1];
                
                for (const e of response.docs) {
                    const data = e.data() as any;
                    data.id = e.id;
                    loadedItems.value.push(data);
                }
            } catch (error) {
                console.error(`[useFirestoreGeneral:${key}] loadChunkAsync failed`, error);
                break;
            }
        }
        
        if (loadedItems.value.length === 0) {
            lastVisible.value = null;
        } else {
             lastVisible.value = null; 
        }
    }

    const updateAsync = async (id: string, m: any) => {
        const ref = getDocRef(generalDocRoot.document(key, id))
        return await updateDocWithRefAsync(ref, m)
    };

    const deleteAsync = async (id: string) => {
        const ref = getDocRef(generalDocRoot.document(key, id))
        return await deleteDocWithRefAsync(ref)
    };

    /**
     * FirestoreのCollectionReferenceを直接取得する関数を公開
     */
    const getCollectionRef = () => {
        return getColRef(generalDocRoot.collection(key));
    };

    return {
        addAsync,
        addWithBatchAsync,
        getAsync,
        getDocRefAsync,
        getListAsync,
        loadAsync,
        loadedItems,
        loadChunkAsync,
        lastVisible,
        countAsync,
        updateAsync,
        deleteAsync,
        getCollectionRef,
    };
};