type FolderObject = {
    name: string; // "folder/",
    path: string; // "folder/path/"
    type: "folder";
    goto: () => Promise<FolderContents>;
}

type FileObject = {
    name: string; // "file.ext",
    path: string; // "path/to/file.ext"
    type: "file";
    size: number; // 123456, (bytes)
    lastModified: number; // 1234567890
    url: string; // "https://subdomain.skapi.com/path/to/file.ext"
    goto: () => void; // downloads the file
}

type FolderContents = {
    endOfList: boolean;
    path: string;
    breadcrumb: {
        name: string;
        path: string;
        goto: () => Promise<FolderContents>;
    }[];
    list: Array<FileObject | FolderObject>;
};

type Directory = {
    [folderPath: string]: FolderContents;
}

type FileFromServer = {
    name: string; // "subdomain/file.ext",
    type: "file";
    size: number; // 123456, (bytes)
    lastModified: number; // 1234567890
}

type FolderFromServer = {
    name: string; // "subdomain/folder/",
    type: "folder";
}

type Progress = {
    status: "upload" | "download";
    progress: number;
    loaded: number;
    total: number;
    currentFile: File;
    completed: File[];
    failed: File[];
    abort: () => void; // Aborts current data transfer. When abort is triggered during the FileList is on trasmit, it will continue to next file.
}