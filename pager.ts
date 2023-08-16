export default class Pager {
    _list: {
        maps: {
            [params: string]: Array<string>;
        };
        items: { [id: string]: Object };
    };
    id: string;
    rpp: number

    constructor(options: {
        id: string;
        resultsPerPage: number;
    }, list?: {
        maps: {
            [params: string]: Array<string>;
        },
        items: { [id: string]: Object };
    }) {
        this.id = options.id;
        this.rpp = options.resultsPerPage ? options.resultsPerPage : 10;
        if (list) this._list = list;
        else this._list = {
            maps: {},
            items: {}
        };
    }

    sohash(params: Object): number {
        let str = JSON.stringify(params);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash >>> 0;
    }

    addList(params: Object, list: Array<Object>): {
        pages: number
    } {
        let hash = this.sohash(params);
        let newItems = {};
        let newMap: string[] = []

        list.forEach(item => {
            newItems[item[this.id]] = item;
            newMap.push(item[this.id]);
        });

        this._list.items = {
            ...this._list.items,
            ...newItems
        };
        if (this._list.maps[hash]) {
            this._list.maps[hash] = [
                ...this._list.maps[hash],
                ...newMap
            ];
        } else {

            this._list.maps[hash] = newMap;
        }

        return {
            pages: Math.ceil(this._list.maps[hash].length / this.rpp)
        }
    }

    insertItem(params: Object, item: Object): void {
        let hash = this.sohash(params);
        this._list.items[item[this.id]] = item;
        this._list.maps[hash].push(item[this.id]);
    }

    getPage(params: Object, page: number): {
        list: Object[],
        maxPage: number
    } {
        let hash = this.sohash(params);
        let startIndex = (page - 1) * this.rpp;
        let result = this._list.maps[hash].slice(startIndex, startIndex + this.rpp);

        return {
            list: result.map((item: string) => this._list.items[item]),
            maxPage: Math.ceil(this._list.maps[hash].length / this.rpp)
        };
    }

    async delete(ids: string[]): Promise<string> {
        const worker = new Worker('./js/worker.js');

        worker.postMessage({
            list: this._list,
            index: ids
        });

        let workerResult = new Promise((res) => {
            worker.onmessage = (event) => {
                this._list.items = event.data.items;
                this._list.maps = event.data.maps;

                res("Deleted");
            };
        });

        return await workerResult as Promise<string>;
    }
}