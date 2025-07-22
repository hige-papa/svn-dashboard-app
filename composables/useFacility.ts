import { orderBy, QueryConstraint, startAfter, limit, or, } from 'firebase/firestore';
import { useDocumentRoot } from "~/composables/firebase/useDocumentRoot";
import { useFirestore } from "~/composables/firebase/useFirestore";
import { useUuid } from '~/composables/common/useUuid';

export const useFacility = () => {
    const { generateUuid } = useUuid();
    const { facilityDocRoot } = useDocumentRoot();
    const { updateDocWithRefAsync, addDocWithRefAsync, getDocRef, getDocWithRefAsync, getCollectionAsync, deleteDocWithRefAsync, countCollectionAsync } = useFirestore();

    const addAsync = async (m: any) => {
        const id = generateUuid();
        const ref = getDocRef(facilityDocRoot.document(id))
        return await addDocWithRefAsync(ref, m).then(async _ => {
            const snapShot = await getDocWithRefAsync(ref);
            if (snapShot?.exists()) {
                const data = snapShot.data() as any;
                data.id = id;
                return data;
            }
            return 
        }).catch(_ => {
            return undefined;
        });
    };

    const getAsync = async (id: string) => {
        const ref = getDocRef(facilityDocRoot.document(id))
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
        await getCollectionAsync(facilityDocRoot.collection(), ...qc).then(async response => {
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

    const countAsync = async (...qc: QueryConstraint[]) => {
        return await countCollectionAsync(facilityDocRoot.collection(), ...qc).catch(_ => {
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
        const response = await getCollectionAsync(facilityDocRoot.collection(), ...query);
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
            const response = await getCollectionAsync(facilityDocRoot.collection(), ...query);
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
        const ref = getDocRef(facilityDocRoot.document(id))
        return await updateDocWithRefAsync(ref, m);
    };

    const deleteAsync = async (id: string) => {
        const ref = getDocRef(facilityDocRoot.document(id))
        return await deleteDocWithRefAsync(ref);
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
    };
};