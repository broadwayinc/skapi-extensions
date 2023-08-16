const worker = new Worker('./js/_pager_worker.js');
export default class Pager {
    constructor(idKey, resultsPerPage) {
        this._maps = {};
        this.list = {};
        this.idKey = idKey;
        this.resultsPerPage = resultsPerPage || 10;
    }
    async addList(list, index) {
        if (!list.length) {
            return "List added to pager.";
        }
        if (!index) {
            index = this.idKey;
        }
        if (!this._maps?.[index]) {
            this._maps[index] = [];
        }
        worker.postMessage({
            idKey: this.idKey,
            items: list,
            list: this.list,
            maps: this._maps,
            exec: 'update'
        });
        await this.resolveWorker();
        for (let item of list) {
            this.list[item[this.idKey]] = item;
        }
        return "List added to pager.";
    }
    async getPage(page, index) {
        if (!index) {
            index = this.idKey;
        }
        let startIndex = (page - 1) * this.resultsPerPage;
        let result = this._maps[index].slice(startIndex, startIndex + this.resultsPerPage);
        return {
            list: result.map((item) => {
                let listKey = item.split("#");
                return this.list[listKey[1] || listKey[0]];
            }),
            maxPage: Math.ceil(this._maps[index].length / this.resultsPerPage)
        };
    }
    async deleteItem(item) {
        worker.postMessage({
            idKey: this.idKey,
            items: [item],
            list: this.list,
            maps: this._maps,
            exec: 'delete'
        });
        for (let id of await this.resolveWorker()) {
            delete this.list[id];
        }
        return 'Deleted';
    }
    async updateItem(item) {
        worker.postMessage({
            idKey: this.idKey,
            items: [item],
            list: this.list,
            maps: this._maps,
            exec: 'update'
        });
        for (let id of await this.resolveWorker()) {
            this.list[id] = item;
        }
        return "Updated";
    }
    resolveWorker() {
        return new Promise((res, rej) => {
            worker.onmessage = (event) => {
                this._maps = event.data.maps;
                res(event.data.itemIds);
            };
            worker.onerror = (event) => {
                rej(event);
            };
        });
    }
}
