export { CloudStorageFile };

declare global {
    interface CloudStorageFile {
        index?: number,
        url?: string,
        path?: string,
        contentType?: string,
    };

    interface CloudStorageFileUploader extends CloudStorageFile {
        file: File,
        fileReaderResult?: string | ArrayBuffer | null,
    };
}