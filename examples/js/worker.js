self.addEventListener('message', (event) => {
    const list = event.data.list;
    const index = event.data.index;
    const maps = Object.keys(list.maps);
    const newList = {
        items: list.items,
        maps: {}
    }
    maps.forEach(map => {
        let set = new Set(list.maps[map]);
        index.forEach((item) => {
            if(set.has(item)) {
                set.delete(item);
            }
        })

        if(set.size) {
            newList.maps[map] = [...set];
        } else {
            delete list.maps[map];
        }
    })
    
    index.forEach(item => {
        delete newList.items[item];
    });

    postMessage(newList);
});
