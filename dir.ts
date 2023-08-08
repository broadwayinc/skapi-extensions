export default class Dir {
    _directory: Directory; // you can also give me the reactive object
    _skapi: any;
    _service: string;

    constructor(skapi: any, service: string, directory: Directory) {
        this._skapi = skapi;
        this._service = service;
        this._directory = directory || {};
    }

    getParentDirectory(path: string): Promise<FolderContents> {
        if (!path) {
            throw 'No parent directory found'
        }
        if (path[path.length - 1] !== '/') {
            throw 'Invaild folder path'
        }

        let pathArray = path.split('/');
        return this.getDirectory({ path: pathArray.slice(0, -2).join('/') + '/' });
    }

    _fileNormalizer(item: FileFromServer | FolderFromServer) {
        let nameSplit = item.name.split('/');
        let subdomain = nameSplit[0];

        if (item.type === 'folder') {
            let pathSlice = nameSplit.slice(1, -1);
            let path = pathSlice.join('/') + '/';
            return {
                ...item,
                path,
                name: pathSlice[pathSlice.length - 1],
                goto: (): Promise<FolderContents> => this.getDirectory({ path, fetchMore: false })
            }
        }
        else {
            let pathSlice = nameSplit.slice(1);
            let pathWithoutSubdomain = encodeURIComponent(pathSlice.join('/'));
            let { size, type, lastModified } = item;

            return {
                size, type, lastModified,
                path: pathSlice.join('/'),
                name: pathSlice[pathSlice.length - 1],
                url: `https://${subdomain}.skapi.com/${pathWithoutSubdomain}`,
                goto: (): Promise<void> => this._skapi.getFile(
                    `https://${subdomain}.skapi.com/${pathWithoutSubdomain}`,
                    {
                        dataType: 'download',
                        noCdn: true,
                        service: this._service
                    }
                )
            }
        }
    }

    async addFiles(params: {
        path: string,
        target: HTMLInputElement,
        cb: (p: Progress) => void
    }): Promise<FolderContents> {
        let { path, target, cb } = params || {};
        const files = target.files;
        const formData = new FormData();
        let list = [];

        if (path && path[path.length - 1] !== '/') {
            throw 'Invaild folder path'
        }

        if (files) {
            for (const file of files) {
                formData.append(
                    params.path + file.name,
                    file,
                    params.path + file.name,
                );
            }

            await this._skapi.uploadFiles(formData, {
                service: this._service,
                request: 'host',
                progress: p => {
                    if (p.progress >= 100) {
                        let { name, type, size, lastModified } = p.currentFile;
                        name = params.path + name;
                        let normalizedFile = this._fileNormalizer({ name, type, size, lastModified });
                        list.push(normalizedFile);

                        if (this._directory?.[params.path]) {
                            let index = this._directory[params.path].list.findIndex(item => normalizedFile.name < item.name);

                            if (index !== -1) {
                                // index is found, insert the number at that index
                                this._directory[params.path].list.splice(index, 0, normalizedFile);
                            }
                            else if (this._directory[params.path].endOfList) {
                                // no index is found, and it's endoflist
                                this._directory[params.path].list.push(normalizedFile)
                            }
                        }
                    }
                    cb(p);
                }
            })
        }

        return this._directory[params.path];
    }

    async getDirectory(params?: { path?: string, fetchMore?: boolean }): Promise<FolderContents> {
        let { path = '/', fetchMore = false } = params || {};

        if (!path) {
            path = '/';
        }

        if (path[path.length - 1] !== '/') {
            throw 'Invaild folder path'
        }

        if (this._directory?.[path]) {
            if (this._directory[path].endOfList) {
                if (fetchMore) {
                    let res = await this._skapi.listHostDirectory({ service: this._service, dir: path }, { fetchMore: true });
                    this._directory[path].list.push(...res.list.map((item: FileFromServer | FolderFromServer) => this._fileNormalizer(item)));
                    this._directory[path].endOfList = res.endOfList;
                }
                return this._directory[path];
            }
        }

        // create breadcrumb
        let fullPath = '';
        let pathArray = path.split('/').slice(0, -1);
        let breadcrumb = pathArray.map(folderName => {
            fullPath += folderName;
            let p = fullPath + '/';
            return {
                name: folderName || '/',
                path: p,
                goto: () => this.getDirectory({ path: p })
            }
        });

        if (breadcrumb[0].name !== '/') {
            // if not root folder, add root folder to breadcrumb
            breadcrumb.unshift({
                name: '/',
                path: '/',
                goto: () => this.getDirectory({ path: '/' })
            })
        }

        let res = await this._skapi.listHostDirectory({ service: this._service, dir: path }, { fetchMore });
        this._directory[path] = {
            list: res.list.map((item: FileFromServer | FolderFromServer) => this._fileNormalizer(item)),
            endOfList: res.endOfList,
            path,
            breadcrumb
        };

        return this._directory[path];
    }

    async deleteFiles(filePaths: string | string[]): Promise<void> {
        if (typeof filePaths === 'string') {
            filePaths = [filePaths];
        }

        // delete from server
        await this._skapi.deleteFiles({
            endpoints: filePaths,
            service: this._service,
            storage: 'host'
        });

        // delete from library
        for (let path of filePaths) {
            if (path[path.length - 1] === '/') {
                // is a folder
                delete this._directory[path];
            }
            else {
                let folder = path.split('/').slice(0, -2).join('/') + '/';
                let folderItems = this._directory[folder].list;
                let index = folderItems.findIndex(item => item.path === path);
                folderItems.splice(index, 1);
            }
        }
    }
}