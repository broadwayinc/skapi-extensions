const worker = new Worker('./js/worker.js');

export default class Pager {
    _sortBy: string = null;
    _order: 'asc' | 'desc';
    _map: Array<string> = [];
    _list: {
        items: { [id: string]: Object };
        endOfList: boolean
    } = {
            items: {},
            endOfList: false
        };
    id: string;
    rpp: number;

    constructor(options: {
        id: string;
        resultsPerPage: number;
        sortBy?: string;
        order?: 'asc' | 'desc'
    }, list?: {
        map: Array<string>;
        list: { [id: string]: Object };
        endOfList: boolean;
    }) {
        this.id = options.id;
        this._sortBy = options.sortBy;
        this._order = options.order ? options.order : 'asc';
        this.rpp = options.resultsPerPage ? options.resultsPerPage : 10;

        if (list) {
            this._list = {
                items: list.list,
                endOfList: list.endOfList
            };

            this._map = list.map;
        }
    }

    addList(params: {
        list: Array<Object>;
        endOfList: boolean
    }): {
        pages: number
    } {
        this._list.endOfList = params.endOfList;

        let newItems = {};

        params.list.forEach(item => {
            newItems[item[this.id]] = item;
            this._map.push(item[this.id])
        });

        Object.assign(this._list.items, newItems);

        return {
            pages: Math.ceil(this._map.length / this.rpp)
        }
    }

    getSortByValue(obj: { [key: string]: any }): any {
        const properties = this._sortBy.split('.');
        let currentObj = obj;

        for (let prop of properties) {
            if (currentObj.hasOwnProperty(prop) && currentObj[prop] !== '') {
                currentObj = currentObj[prop];
            } else {
                currentObj = null;
                break;
            }
        }

        return currentObj;
    }

    async editItems(items: { [key: string]: any }[]): Promise<"Edit Saved"> {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const currentItem = this._list.items[item[this.id]];
            let sortByValue = this.getSortByValue(item);
            if (sortByValue !== null) {
                if (this.getSortByValue(currentItem) !== sortByValue) {
                    await this.delete([item[this.id]]);
                    await this.insertItems([item]);
                }

                this._list.items[item[this.id]] = item;
            } else {
                await this.delete([item[this.id]]);
            }
        }

        return "Edit Saved";
    }

    async insertItems(items: { [key: string]: any }[]): Promise<"Insert Successful"> {
        for (let i = 0; i < items.length; i++) {
            if (this.getSortByValue(items[i]) === null) {
                return;
            }
        }

        worker.postMessage({
            method: 'insert',
            list: this._list,
            map: this._map,
            id: this.id,
            sortBy: this._sortBy,
            order: this._order,
            items: items
        });

        return new Promise((res) => {
            worker.onmessage = (event) => {
                this._list = event.data.list;
                this._map = event.data.map;

                res("Insert Successful");
            };
        });


    }

    getPage(page: number): {
        list: Object[],
        currentPage: number,
        maxPage: number
    } {
        let startIndex = (page - 1) * this.rpp;
        let result = this._map.slice(startIndex, startIndex + this.rpp);

        return {
            list: result.map((item: string) => this._list.items[item]),
            currentPage: page,
            maxPage: Math.ceil(this._map.length / this.rpp)
        };
    }

    async delete(ids: string[]): Promise<"Deleted"> {
        worker.postMessage({
            method: 'delete',
            list: this._list,
            map: this._map,
            index: ids
        });

        return new Promise((res) => {
            worker.onmessage = (event) => {
                this._list = event.data.list;
                this._map = event.data.map;

                res("Deleted");
            };
        });
    }
}