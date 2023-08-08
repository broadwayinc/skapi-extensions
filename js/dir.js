export class Dir {
    constructor(skapi, service) {
        this._directory = {};
        this._skapi = skapi;
        this._service = service;
    }
    getParentDirectory(path) {
        if (!path) {
            throw 'No parent directory found';
        }
        if (path[path.length - 1] !== '/') {
            throw 'Invaild folder path';
        }
        let pathArray = path.split('/');
        return this.getDirectory({ path: pathArray.slice(0, -2).join('/') + '/' });
    }
    _fileNormalizer(item) {
        if (item.type === 'folder') {
            let pathSlice = item.name.split('/').slice(1, -2);
            return {
                ...item,
                path: pathSlice.join('/') + '/',
                name: pathSlice[pathSlice.length - 1],
                goto: () => this.getDirectory({ path: item.name, fetchMore: false })
            };
        }
        else {
            let pathSlice = item.name.split('/').slice(1, -1);
            let pathWithoutSubdomain = pathSlice.join('/');
            let subdomain = pathSlice[0];
            let { size, type, lastModified } = item;
            return {
                size, type, lastModified,
                path: pathSlice.join('/'),
                name: pathSlice[pathSlice.length - 1],
                url: `https://${subdomain}.skapi.com/${pathWithoutSubdomain}`,
                goto: () => {
                    this._skapi.getFile(`https://${subdomain}.skapi.com/${pathWithoutSubdomain}`, {
                        dataType: 'download',
                        noCdn: true,
                        service: this._service
                    });
                }
            };
        }
    }
    async addFiles(params) {
        let { path, target, cb } = params || {};
        const files = target.files;
        const formData = new FormData();
        let list = [];
        if (path && path[path.length - 1] !== '/') {
            throw 'Invaild folder path';
        }
        if (files) {
            for (const file of files) {
                formData.append(params.path + file.name, file, params.path + file.name);
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
                                this._directory[params.path].list.splice(index, 0, normalizedFile);
                            }
                            else if (this._directory[params.path].endOfList) {
                                this._directory[params.path].list.push(normalizedFile);
                            }
                        }
                    }
                    cb(p);
                }
            });
        }
        return list;
    }
    async getDirectory(params) {
        let { path = '/', fetchMore = false } = params || {};
        if (!path) {
            path = '/';
        }
        if (path[path.length - 1] !== '/') {
            throw 'Invaild folder path';
        }
        if (this._directory?.[path]) {
            if (this._directory[path].endOfList) {
                if (fetchMore) {
                    let res = await this._skapi.listHostDirectory({ service: this._service, dir: path }, { fetchMore });
                    this._directory[path].list.push(...res.list.map((item) => this._fileNormalizer(item)));
                    this._directory[path].endOfList = res.endOfList;
                }
                return this._directory[path];
            }
        }
        let fullPath = '';
        let pathArray = path.split('/').slice(0, -1);
        let breadcrumb = pathArray.map(folderName => {
            fullPath += '/' + folderName;
            let p = fullPath + '/';
            return {
                name: folderName,
                path: p,
                goto: () => this.getDirectory({ path: p })
            };
        });
        let res = await this._skapi.listHostDirectory({ service: this._service, dir: path }, { fetchMore });
        this._directory[path] = {
            list: res.list.map((item) => this._fileNormalizer(item)),
            endOfList: res.endOfList,
            path,
            breadcrumb
        };
        return this._directory[path];
    }
    async deleteFiles(filePaths) {
        if (typeof filePaths === 'string') {
            filePaths = [filePaths];
        }
        await this._skapi.deleteFiles({
            endpoints: filePaths,
            service: this._service,
            storage: 'host'
        });
        for (let path of filePaths) {
            if (path[path.length - 1] === '/') {
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
