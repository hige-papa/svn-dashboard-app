import {
    Firestore,
    collection,
    collectionGroup,
    doc,
    query,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    QueryConstraint,
    DocumentReference,
    CollectionReference,
    runTransaction,
    getCountFromServer,
    writeBatch,
    Timestamp,
    serverTimestamp,
    type DocumentData,
} from 'firebase/firestore';
import { useDocumentRoot } from '~/composables/firebase/useDocumentRoot'
import type { User } from 'firebase/auth';

// --- Profiler for Firestore queries ---
const firestoreQueryStats = new Map<string, { count: number; totalTime: number }>();
let profilerFirstPrintDone = false;

const recordQuery = (collectionName: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  const key = collectionName;
  if (!firestoreQueryStats.has(key)) {
    firestoreQueryStats.set(key, { count: 0, totalTime: 0 });
  }
  const stats = firestoreQueryStats.get(key)!;
  stats.count += 1;
  stats.totalTime += duration;
};

export const printFirestoreDebugSummary = (force = false) => {
  // Auto-print only once on first call unless forced
  if (!force && profilerFirstPrintDone) {
    return;
  }

  if (!force) {
    profilerFirstPrintDone = true;
  }

  const collections: string[] = [];
  let totalQueries = 0;
  let totalTime = 0;

  firestoreQueryStats.forEach((stats, collection) => {
    collections.push(`${collection}=${stats.count}`);
    totalQueries += stats.count;
    totalTime += stats.totalTime;
  });

  const summary = `[Profiling] Firestore queries: ${collections.join(', ')}, total=${totalQueries}, elapsed=${totalTime.toFixed(2)}ms`;
  console.log(summary);

  // Detailed breakdown
  console.group('[Firestore Query Details]');
  firestoreQueryStats.forEach((stats, collection) => {
    console.log(`  ${collection}: ${stats.count} calls, ${stats.totalTime.toFixed(2)}ms (avg: ${(stats.totalTime / stats.count).toFixed(2)}ms)`);
  });
  console.groupEnd();

  // JSON output for easy analysis
  const jsonOutput = {
    total: totalQueries,
    elapsed: parseFloat(totalTime.toFixed(2)),
    collections: Array.from(firestoreQueryStats.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      totalTime: parseFloat(stats.totalTime.toFixed(2)),
      avgTime: parseFloat((stats.totalTime / stats.count).toFixed(2))
    }))
  };
  console.log('[Profiling JSON]', JSON.stringify(jsonOutput, null, 2));
};

export const resetFirestoreProfiler = () => {
  firestoreQueryStats.clear();
  profilerFirstPrintDone = false;
  console.log('[Profiling] Stats reset');
};

export const getFirestoreProfilerStats = () => {
  return {
    stats: Array.from(firestoreQueryStats.entries()).map(([name, stats]) => ({ name, ...stats })),
    firstPrintDone: profilerFirstPrintDone
  };
};


export const useFirestore = () => {
    const firestore = useState<Firestore>('db');

    const user = useState<User>('user')

    const getCollection = (c: string) => {
        return collection(firestore.value, c);
    };

    const getCollectionGroup = (c: string) => {
        return collectionGroup(firestore.value, c);
    };

    const getCollectionAsync = async (c: string, ...qc: QueryConstraint[]) => {
        const startTime = performance.now();
        const q = query(
            collection(firestore.value, c),
            ...qc
        );
        return getDocs(q)
            .then(response => {
                recordQuery(c, startTime);
                console.log(`success get from firebase firestore => ${c}`, response);
                return response;
            })
            .catch(error => {
                recordQuery(c, startTime);
                console.error(`failed get from firebase firestore => ${c}`, error);
                throw error;
            });
    };

    const getCollectionWithCollectionGroupAsync = async (c: string, ...qc: QueryConstraint[]) => {
        const q = query(
            collectionGroup(firestore.value, c),
            ...qc
        );
        return getDocs(q)
            .then(response => {
                console.log(`success get from firebase firestore => ${c}`, response);
                return response;
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${c}`, error);
                throw error;
            });
    };

    const countCollectionAsync = async (c: string, ...qc: QueryConstraint[]) => {
        const q = query(
            collection(firestore.value, c),
            ...qc
        );
        return getCountFromServer(q)
            .then(response => {
                console.log(`success get from firebase firestore => ${c}`, response);
                return response.data().count;
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${c}`, error);
                throw error;
            });
    };

    const getDocAsync = async (c: string, id: string) => {
        const docRef = doc(firestore.value, c, id);
        return getDoc(docRef)
            .then(response => {
                console.log(`success get from firebase firestore => ${c}/${id}`, response);
                if (response.exists()) {
                    return response;
                } else {
                    return null;
                }
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${c}/${id}`, error);
                throw error;
            });
    };

    const getDocRef = (d: string) => {
        return doc(firestore.value, d);
    };

    const getDocWithRefAsync = async (r: DocumentReference) => {
        return getDoc(r)
            .then(response => {
                console.log(`success get from firebase firestore => ${r.path}:${r.id}`, response);
                if (response.exists()) {
                    return response;
                } else {
                    return null;
                }
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${r.path}:${r.id}`, error);
                throw error;
            });
    };

    const existsDocWithRefAsync = async (r: DocumentReference) => {
        return getDoc(r)
            .then(response => {
                return response.exists()
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${r.path}:${r.id}`, error);
                throw error;
            });
    };

    const getCollectionRef = (c: string) => {
        return collection(firestore.value, c);
    };

    const getCollectionWithRefAsync = async (r: CollectionReference, ...qc: QueryConstraint[]) => {
        const q = query(r, ...qc);
        return getDocs(q)
            .then(response => {
                console.log(`success get from firebase firestore => ${r.path}`, response);
                return response;
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${r.path}`, error);
                throw error;
            });
    };

    const getCollectionWithWhereAsync = async (c: string, w: QueryConstraint) => {
        const q = query(
            collection(firestore.value, c),
            w
        );
        return getDocs(q)
            .then(response => {
                console.log(`success get from firebase firestore => ${c}`);
                return response;
            })
            .catch(error => {
                console.error(`failed get from firebase firestore => ${c}`, error);
                return undefined;
            });
    };

    const setDocWithRefAsync = async (r: DocumentReference, d: any) => {
        d.createdAt = d.createdAt ? d.createdAt : serverTimestamp();
        d.updatedAt = serverTimestamp();
        d.createdBy = d.createdBy ? d.createdBy : user.value.displayName;
        d.updatedBy = user.value.displayName;
        return setDoc(r, d)
            .then(_ => {
                console.log(`success add to firebase firestore => ${r.path}:${r.id}`);
                return r;
            })
            .catch(error => {
                console.error(`failed add to firebase firestore => ${r.path}:${r.id}`, error);
                return null;
            });
    };

    const addDocAsync = async (c: string, d: any) => {
        d.createdAt = serverTimestamp();
        d.updatedAt = serverTimestamp();
        d.createdBy = d.createdBy ? d.createdBy : user.value.displayName;
        d.updatedBy = user.value.displayName;
        return addDoc(collection(firestore.value, c), d)
            .then(response => {
                console.log(`success add to firebase firestore => ${c}:${response.id}`);
                return response;
            })
            .catch(error => {
                console.error(`failed add to firebase firestore => ${c}`, error);
                return null;
            });
    };

    const addDocWithRefAsync = async (r: DocumentReference, d: any) => {
        d.createdAt = serverTimestamp();
        d.updatedAt = serverTimestamp();
        d.createdBy = d.createdBy ? d.createdBy : user.value.displayName;
        d.updatedBy = user.value.displayName;
        return setDoc(r, d)
            .then(_ => {
                console.log(`success add to firebase firestore => ${r.path}:${r.id}`);
                return r;
            })
            .catch(error => {
                console.error(`failed add to firebase firestore => ${r.path}:${r.id}`, error);
                return null;
            });
    };

    const addWithBatch = async (actions: BatchAction[]) => {
        const batch = writeBatch(firestore.value);
        for (const action of actions) {
            if (action.entity) {
                action.entity.createdAt = serverTimestamp();
                action.entity.updatedAt = serverTimestamp();
                action.entity.createdBy = action.entity.createdBy ? action.entity.createdBy : user.value.displayName;
                action.entity.updatedBy = user.value.displayName;
                batch.set(action.reference, action.entity);
            }
        }
        return batch.commit();
    };

    const updateDocAsync = async (c: string, id: string, d: any) => {
        d.updatedAt = serverTimestamp();
        d.updatedBy = user.value.displayName;
        return updateDoc(doc(firestore.value, c, id), d)
            .then(_ => {
                console.log(`success update to firebase firestore => ${c}:${id}`);
            })
            .catch(error => {
                console.error(`failed update to firebase firestore => ${c}:${id}`, error);
                throw error;
            });
    };

    const updateDocWithRefAsync = async (r: DocumentReference, d: any) => {
        d.updatedAt = serverTimestamp();
        d.updatedBy = user.value.displayName;
        return updateDoc(r, d)
            .then(_ => {
                console.log(`success update to firebase firestore => ${r.path}:${r.id}`);
            })
            .catch(error => {
                console.error(`failed update to firebase firestore => ${r.path}:${r.id}`, error);
                throw error;
            });
    };

    const updateWithBatch = async (actions: BatchAction[]) => {
        const batch = writeBatch(firestore.value);
        for (const action of actions) {
            if (action.entity) {
                action.entity.updatedAt = serverTimestamp();
                batch.update(action.reference, action.entity);
            }
        }
        return batch.commit();
    };

    const deleteDocAsync = async (c: string, id: string) => {
        return deleteDoc(doc(firestore.value, c, id))
            .then(_ => {
                console.log(`success delete from firebase firestore => ${c}:${id}`);
            })
            .catch(error => {
                console.error(`failed delete from firebase firestore => ${c}:${id}`, error);
                throw error;
            });
    };

    const deleteDocWithRefAsync = async (r: DocumentReference) => {
        return deleteDoc(r)
            .then(_ => {
                console.log(`success delete from firebase firestore => ${r.path}:${r.id}`);
            })
            .catch(error => {
                console.error(`failed delete from firebase firestore => ${r.path}:${r.id}`, error);
                throw error;
            });
    };

    const deleteWithBatch = async (actions: BatchAction[]) => {
        const batch = writeBatch(firestore.value);
        for (const action of actions) {
            batch.delete(action.reference);
        }
        return batch.commit();
    }

    const generateSequenceNumberAsync = async (manageCollection: string, targetCollection: string, numberField: string, start?: number) => {
        start ??= 0;
        const path = `${manageCollection}/${targetCollection}`;
        const docRef = doc(firestore.value, path);
        return runTransaction(firestore.value, async (transaction) => {
            return transaction.get(docRef).then((doc) => {
                if (doc.exists()) {
                    const newNumber = doc.data()[numberField] === 'undefined' ? start : doc.data()[numberField] + 1;
                    transaction.update(docRef, { [numberField]: newNumber });
                    return newNumber;
                }
                else {
                    transaction.set(docRef, { [numberField]: 0 });
                    return 0;
                }
            });
        })
    };

    return {
        getCollection,
        getCollectionGroup,
        getCollectionAsync,
        getCollectionWithCollectionGroupAsync,
        getCollectionWithWhereAsync,
        getDocAsync,
        getDocRef,
        getDocWithRefAsync,
        getCollectionRef,
        getCollectionWithRefAsync,
        countCollectionAsync,
        addDocAsync,
        addDocWithRefAsync,
        addWithBatch,
        setDocWithRefAsync,
        updateDocAsync,
        updateDocWithRefAsync,
        updateWithBatch,
        deleteDocAsync,
        deleteDocWithRefAsync,
        deleteWithBatch,
        generateSequenceNumberAsync,
        existsDocWithRefAsync,
    };
};