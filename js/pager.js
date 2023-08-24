const worker = new Worker('./pager_worker.js');
export default class Pager {
    constructor(options) {
        this.order = 'asc';
        this.map = [];
        this.list = {};
        this.resultsPerPage = 10;
        let { id, sortBy, order = 'asc', resultsPerPage = 10 } = options;
        if (!id || typeof id !== 'string') {
            throw 'id is required';
        }
        this.id = id;
        this.sortBy = sortBy || id;
        this.order = order;
        this.resultsPerPage = resultsPerPage;
    }
    getPage(page) {
        let startIndex = (page - 1) * this.resultsPerPage;
        let result = this.map.slice(startIndex, startIndex + this.resultsPerPage);
        return {
            list: result.map((target) => this.list[target.split('􏿿')[1]]),
            maxPage: Math.ceil(this.map.length / this.resultsPerPage)
        };
    }
    insertItems(items, options) {
        let { withinRange = false } = options || {};
        worker.postMessage({
            method: 'insert',
            list: this.list,
            map: this.map,
            id: this.id,
            sortBy: this.sortBy,
            order: this.order,
            items: items,
            withinRange: withinRange
        });
        for (let item of items) {
            this.list[item[this.id]] = item;
        }
        return new Promise((res) => {
            worker.onmessage = (event) => {
                this.map = event.data;
                res("Insert Successful");
            };
        });
    }
    editItem(item, options) {
        let { withinRange = false } = options || {};
        worker.postMessage({
            method: 'edit',
            list: this.list,
            map: this.map,
            id: this.id,
            sortBy: this.sortBy,
            order: this.order,
            items: [item],
            withinRange: withinRange
        });
        return new Promise((res) => {
            worker.onmessage = (event) => {
                if (event.data) {
                    this.map = event.data;
                }
                Object.assign(this.list[item[this.id]], item);
                res("Edit Saved");
            };
        });
    }
    deleteItem(id) {
        worker.postMessage({
            method: 'delete',
            list: this.list,
            map: this.map,
            id: this.id,
            sortBy: this.sortBy,
            order: this.order,
            items: [this.list[id]]
        });
        return new Promise((res) => {
            worker.onmessage = (event) => {
                this.map = event.data;
                delete this.list[id];
                res("Item Deleted");
            };
        });
    }
}
