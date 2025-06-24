import type { Timestamp, DocumentReference } from "firebase/firestore"

export { DocReference };

declare global {
    interface DocReference {
        reference: DocumentReference,
        createdAt: Timestamp,
    }
}