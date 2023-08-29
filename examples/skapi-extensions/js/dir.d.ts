export default class Dir {
    _directory: Directory;
    _skapi: any;
    _service: {
        [key: string]: any;
    };
    _service_id: string;
    constructor(skapi: any, service: {
        [key: string]: any;
    }, directory?: Directory);
    getParentDirectory(path: string): Promise<FolderContents>;
    _fileNormalizer(item: FileFromServer | FolderFromServer): {
        path: string;
        name: string;
        goto: () => Promise<FolderContents>;
        type: "folder";
        size?: undefined;
        lastModified?: undefined;
        url?: undefined;
    } | {
        size: number;
        type: "file";
        lastModified: number;
        path: string;
        name: string;
        url: string;
        goto: () => Promise<void>;
    };
    addFiles(params: {
        path: string;
        target: HTMLInputElement;
        cb: (p: Progress) => void;
    }): Promise<FolderContents>;
    getDirectory(params?: {
        path?: string;
        fetchMore?: boolean;
    }): Promise<FolderContents>;
    deleteFiles(filePaths: string | string[]): Promise<void>;
}
