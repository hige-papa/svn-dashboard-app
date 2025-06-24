import { useDocumentRoot } from "~/composables/firebase/useDocumentRoot";
import { useFirestore } from "~/composables/firebase/useFirestore";
import { useUuid } from '~/composables/common/useUuid';

export const useFirestoreGeneral = (key: string) => {
    const { generateUuid } = useUuid();
    const { generalDocRoot } = useDocumentRoot();
    const { updateDocWithRefAsync, addDocWithRefAsync, getDocRef, getDocWithRefAsync, getCollectionAsync, deleteDocWithRefAsync } = useFirestore();

    const addAsync = async (m: any) => {
        const id = generateUuid();
        const ref = getDocRef(generalDocRoot.document(key, id))
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
        const ref = getDocRef(generalDocRoot.document(key, id))
        return await getDocWithRefAsync(ref).then(async response => {
            const data = response?.data() as any;
            data.id = id;
            return data;
        }).catch(_ => {
            return undefined;
        });
    };

    const getListAsync = async () => {
        const result = [] as any[]
        await getCollectionAsync(generalDocRoot.collection(key)).then(async response => {
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

    const updateAsync = async (id: string, m: any) => {
        const ref = getDocRef(generalDocRoot.document(key, id))
        return await updateDocWithRefAsync(ref, m);
    };

    const deleteAsync = async (id: string) => {
        const ref = getDocRef(generalDocRoot.document(key, id))
        return await deleteDocWithRefAsync(ref);
    };

    return {
        addAsync,
        getAsync,
        getListAsync,
        updateAsync,
        deleteAsync,
    };
};