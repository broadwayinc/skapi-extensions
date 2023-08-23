const worker = new Worker('./js/worker.js');
export default class Pager {
    constructor(options, list) {
        this._sortBy = null;
        this._map = [];
        this._list = {
            items: {},
            endOfList: false
        };
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
    addList(params) {
        let newItems = {};
        params.list.forEach(item => {
            newItems[item[this.id]] = item;
            this._map.push(item[this.id]);
        });
        Object.assign(this._list.items, newItems);
        return {
            pages: Math.ceil(this._map.length / this.rpp)
        };
    }
    async editItems(items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const currentItem = this._list.items[item[this.id]];
            let itemSortValue;
            try {
                itemSortValue = getSortByValue(item, this._sortBy);
                if (getSortByValue(currentItem, this._sortBy) !== itemSortValue) {
                    await this.insertItems([item]);
                }
                this._list.items[item[this.id]] = item;
            }
            catch (e) {
                await this.delete([item[this.id]]);
            }
        }
        function getSortByValue(obj, path) {
            const properties = path.split('.');
            let currentObj = obj;
            for (let prop of properties) {
                if (currentObj.hasOwnProperty(prop)) {
                    currentObj = currentObj[prop];
                }
                else {
                    throw 'Sortby value is undefined';
                }
            }
            return currentObj;
        }
        return "Edit Saved";
    }
    async insertItems(items) {
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
    getPage(page) {
        let startIndex = (page - 1) * this.rpp;
        let result = this._map.slice(startIndex, startIndex + this.rpp);
        return {
            list: result.map((item) => this._list.items[item]),
            currentPage: page,
            maxPage: Math.ceil(this._map.length / this.rpp)
        };
    }
    async delete(ids) {
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