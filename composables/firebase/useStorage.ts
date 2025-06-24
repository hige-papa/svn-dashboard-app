import {
    type FirebaseStorage,
    getDownloadURL,
    ref,
    uploadBytes,
    deleteObject,
    type StorageReference,
} from "firebase/storage";
import { fileTypeFromBlob } from "file-type";

export const useStorage = () => {
    const storage = useState<FirebaseStorage>('storage');

    const getStorageReference = (key: string) => {
        return ref(storage.value, '/' + key);
    }

    const uploadFile = async (key: string, file: File, contentType?: string) => {
        const fileType = await fileTypeFromBlob(file);
        contentType = contentType ? contentType : (fileType ? fileType.mime : "multipart/form-data");
        const metadata={
            contentType: contentType,
        };
        const storageRef = ref(storage.value, '/' + key);
        return uploadBytes(storageRef, file, metadata)
            .then(response => {
                console.log('success upload file to firebase storage');
                return response;
            }).catch(error => {
                console.error('failed upload file to firebase storage', error);
                return null;
            });
    };

    const uploadFileWithUrlResponseAsync = async (key: string, file: any, contentType?: string) => {
        const fileType = await fileTypeFromBlob(file);
        contentType = contentType ? contentType : (fileType ? fileType.mime : "multipart/form-data");
        const metadata={
            contentType: contentType,
        };
        const storageRef = ref(storage.value, '/' + key);
        let response = await uploadBytes(storageRef, file, metadata)
            .then(async (response) => {
                console.log('success upload file to firebase storage');
                return response;
            }).catch(error => {
                console.error('failed upload file to firebase storage', error);
                return null;
            });
        if (response) {
            return await getDownloadURL(response.ref)
                .then(url => {
                    console.log('success get url from firebase storage');
                    return url;
                }).catch(error => {
                    console.error('failed get url from firebase storage', error);
                    return null;
                });
        }
        return null;
    };

    const getUrl = async (path: string) => {
        const storageRef = ref(storage.value, path);
        return getDownloadURL(storageRef)
            .then(url => {
                console.log('success get url from firebase storage');
                return url;
            }).catch(error => {
                console.error('failed get url from firebase storage', error);
                return null;
            });
    };

    const getUrlWithRef = async (storageRef: StorageReference) =>{
        return getDownloadURL(storageRef)
            .then(url => {
                console.log('success get url from firebase storage');
                return url;
            }).catch(error => {
                console.error('failed get url from firebase storage', error);
                return null;
            });
    };

    const deleteFile = async (path: string) => {
        const storageRef = ref(storage.value, path);
        return deleteObject(storageRef)
            .then(async snapshot => {
                console.log('success delete file from firebase storage');
                return snapshot;
            }).catch(error => {
                console.error('failed delete file from firebase storage', error);
            });
    };

    const deleteFileWithRef = async (storageRef: StorageReference) => {
        return deleteObject(storageRef)
            .then(async snapshot => {
                console.log('success delete file from firebase storage');
                return snapshot;
            }).catch(error => {
                console.error('failed delete file from firebase storage', error);
            });
    };
    
    return {
        getStorageReference,
        uploadFile,
        uploadFileWithUrlResponseAsync,
        getUrl,
        getUrlWithRef,
        deleteFile,
        deleteFileWithRef,
    }
}