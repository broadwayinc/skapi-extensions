function getIndexValue(obj, path) {
    let keys = path.split('.');

    for (let key of keys) {
        if (obj.hasOwnProperty(key) && obj[key] !== '') {
            obj = obj[key];
        }
        else {
            return null;
        }
    }

    if (typeof obj === 'number') {
        // 4503599627370496
        // for precision, stringify number with 16 digits
        return obj.toString().padStart(16, '0');
    }

    return obj.toString();
}

function insertItems(event) {
    let { items, sortBy, order, id, map, withinRange } = event.data;
    for (let item of items) {
        let indexValue = getIndexValue(item, sortBy);
        if (indexValue === null) {
            continue; // pass
        }

        indexValue += '􏿿' + item[id]; // 'indexValue􏿿id'

        let index = map.indexOf(indexValue);
        if (index !== -1) {
            continue; // already has it
        }

        let low = 0;
        let high = map.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (order === 'desc') {
                if (indexValue > map[mid]) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            else {
                if (indexValue < map[mid]) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
        }

        if ((low >= map.length && !withinRange) || low < map.length) {
            map.splice(low, 0, indexValue);
        }
    }

    return map;
}

function deleteItem(event) {
    let { sortBy, items, id, map, list } = event.data;

    target = getIndexValue(list[items[0][id]], sortBy);
    if (target === null) {
        return map;
    }

    target += '􏿿' + items[0][id];
    let index = map.indexOf(target);
    if (index !== -1) {
        map.splice(index, 1);
    }

    return map;
}

self.addEventListener('message', (event) => {
    let { method } = event.data;

    if (method === 'insert') {
        postMessage(insertItems(event));
    }

    else if (method === 'edit') {
        let { items, list, id, sortBy } = event.data;
        const previousIndexValue = getIndexValue(list[items[0][id]], sortBy);
        const updatedIndexValue = getIndexValue(items[0], sortBy);

        if (previousIndexValue !== updatedIndexValue) {
            event.data.map = deleteItem(event);
            postMessage(insertItems(event));
        }
        else {
            postMessage(null); // no map updates
        }
    }

    else if (method === 'delete') {
        postMessage(deleteItem(event));
    }
});
