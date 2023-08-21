self.addEventListener('message', (event) => {
    let { items, list, maps, exec, idKey } = event.data;
    let itemIds = [];

    for (let item of items) {
        let itemId = item[idKey];
        itemIds.push(itemId);

        for (let indexKey in maps) {
            let keyValue;
            let keys = indexKey.substring(1).split('.');
            let ascending = indexKey.charAt(0) === '+';
            
            for (let k of keys) {
                keyValue = keyValue?.[k] || item[k];
            }

            if (keyValue !== itemId) {
                keyValue += '#' + itemId;
            }

            let set = new Set(maps[indexKey]);

            if (exec === 'delete') {
                if (set.has(keyValue)) {
                    set.delete(keyValue);
                }

                maps[indexKey] = [...set];
            }

            else {
                let previousItem = list?.[itemId];

                for (let k of keys) {
                    keyValue = keyValue?.[k] || item[k];
                }

                if (keyValue !== itemId) {
                    keyValue += '#' + itemId;
                }

                let previousKeyValue = null;
                if (previousItem) {
                    for (let k of keys) {
                        previousKeyValue = previousKeyValue?.[k] || previousItem[k];
                    }

                    if (previousKeyValue !== itemId) {
                        previousKeyValue += '#' + itemId;
                    }
                }

                if (previousKeyValue && previousKeyValue !== keyValue) {
                    if (set.has(previousKeyValue)) {
                        set.delete(previousKeyValue);
                    }
                }

                if (set.has(keyValue)) {
                    continue;
                }

                // insert it at the right place
                maps[indexKey] = [...set];
                let indexToInsert = maps[indexKey].findIndex(item => {
                    if (ascending) {
                        return keyValue < item
                    } else {
                        return keyValue <= item
                    }
                });

                if (indexToInsert !== -1) {
                    maps[indexKey].splice(indexToInsert, 0, keyValue);
                }
                else {
                    maps[indexKey].push(keyValue);
                }
            }
        }
    }

    postMessage({ maps, itemIds });
});