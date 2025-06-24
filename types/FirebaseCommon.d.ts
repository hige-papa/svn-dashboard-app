import type { DocumentReference, Timestamp } from "firebase/firestore"

export { BatchAction };

declare global {
    interface BatchAction {
        reference: DocumentReference,
        entity?: any,
    };
}