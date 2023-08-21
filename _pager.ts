const worker = new Worker('./js/_pager_worker.js');

export default class Pager {
    resultsPerPage: number;

    idKey: string;

    _maps: {
        [index: string]: string[];
    } = {};

    list: {
        [id: string]: any;
    } = {};

    constructor(
        idKey: string, // key name of the id ex) 'record_id' , 'user_id'
        resultsPerPage: number
    ) {
        this.idKey = idKey;
        this.resultsPerPage = resultsPerPage || 10;
    }

    async addList(
        list: { [key: string]: any }[], // list of items fetched from the server
        index?: string, // index to map the list to: (ex) 'index.value' , 'name'
        ascending?: boolean // list order
    ): Promise<"List added to pager."> {
        if (!list.length) {
            return "List added to pager.";
        }

        if (!index) {
            index = this.idKey;
        }

        ascending = typeof ascending === 'boolean' ? ascending : true;
        index = (ascending ? '+' : '-') + index;

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

    async getPage(page: number, index?: string, ascending?: boolean): Promise<{
        list: { [id: string]: any }[],
        maxPage: number
    }> {
        // this actually does not have to be a promise (just for ease of use in example)
        if (!index) {
            index = this.idKey;
        }

        ascending = typeof ascending === 'boolean' ? ascending : true;
        index = (ascending ? '+' : '-') + index;

        let startIndex = (page - 1) * this.resultsPerPage;
        let result = this._maps[index].slice(startIndex, startIndex + this.resultsPerPage);

        return {
            list: result.map((item: string) => {
                let listKey = item.split("#");
                return this.list[listKey[1] || listKey[0]]
            }),
            maxPage: Math.ceil(this._maps[index].length / this.resultsPerPage)
        };
    }

    async deleteItem(item: { [key: string]: any }): Promise<"Deleted"> {
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

        return 'Deleted'
    }

    async updateItem(item: { [key: string]: any }): Promise<"Updated"> {
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

    resolveWorker(): Promise<string[]> {
        return new Promise((res, rej) => {
            worker.onmessage = (event) => {
                this._maps = event.data.maps;
                res(event.data.itemIds);
            };

            worker.onerror = (event) => {
                rej(event);
            }
        });
    }
}