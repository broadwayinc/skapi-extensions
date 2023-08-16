export default class Pager {
    constructor(options, list) {
        this.id = options.id;
        this.rpp = options.resultsPerPage ? options.resultsPerPage : 10;
        if (list)
            this._list = list;
        else
            this._list = {
                maps: {},
                items: {}
            };
    }
    sohash(params) {
        let str = JSON.stringify(params);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash >>> 0;
    }
    addList(params, list) {
        let hash = this.sohash(params);
        let newItems = {};
        let newMap = [];
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
        }
        else {
            this._list.maps[hash] = newMap;
        }
        return {
            pages: Math.ceil(this._list.maps[hash].length / this.rpp)
        };
    }
    insertItem(params, item) {
        let hash = this.sohash(params);
        this._list.items[item[this.id]] = item;
        this._list.maps[hash].push(item[this.id]);
    }
    getPage(params, page) {
        let hash = this.sohash(params);
        let startIndex = (page - 1) * this.rpp;
        let result = this._list.maps[hash].slice(startIndex, startIndex + this.rpp);
        return {
            list: result.map((item) => this._list.items[item]),
            maxPage: Math.ceil(this._list.maps[hash].length / this.rpp)
        };
    }
    async delete(ids) {
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
        return await workerResult;
    }
}
