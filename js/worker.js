self.addEventListener('message', (event) => {
    const method = event.data.method;
    const list = event.data.list;
    const map = event.data.map;

    if(method === 'delete') {
        const index = event.data.index;

        let set = new Set(map);
        index.forEach(item => {
            if(set.has(item)) {
                delete list.items[item];
                set.delete(item);
            }
        });
    
        postMessage({
            map: set.size ? [...set] : [],
            list: list
        })
    } else if(method === 'insert') {
        const items = event.data.items;
        const sortBy = event.data.sortBy;
        const order = event.data.order;
        const id = event.data.id;

        items.forEach(item => {
            list.items[item[id]] = item;

            if(sortBy) {
                let low = 0;
                let high = map.length;
        
                while (low < high) {
                    const mid = Math.floor((low + high) / 2);
                    if(order === 'desc') {
                        if (getSortByValue(item, sortBy) > getSortByValue(list.items[map[mid]], sortBy)) {
                            high = mid;
                        } else {
                            low = mid + 1;
                        }
                    } else {
                        if (getSortByValue(item, sortBy) < getSortByValue(list.items[map[mid]], sortBy)) {
                            high = mid;
                        } else {
                            low = mid + 1;
                        }
                    }
                }
                
                if((low >= map.length && list.endOfList) || low < map.length) {
                    map.splice(low, 0, item[id]);
                }
            } else {
                map.push(item[id])
            }
        });    

        function getSortByValue(obj, path) {
            const properties = path.split('.');
            let currentObj = obj;

            for (let prop of properties) {
                if (currentObj.hasOwnProperty(prop)) {
                    currentObj = currentObj[prop];
                } else {
                    return undefined; // or throw an error if you prefer
                }
            }

            return currentObj;
        }

        postMessage({
            map,
            list: list
        })    
    }
});
