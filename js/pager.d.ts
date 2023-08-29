export default class Pager {
    sortBy: string;
    id: string;
    order: 'asc' | 'desc';
    map: any[];
    list: {};
    resultsPerPage: number;
    constructor(options: {
        id: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        resultsPerPage?: number;
    });
    getPage(page: number): {
        list: Object[];
        maxPage: number;
    };
    insertItems(items: {
        [key: string]: any;
    }[], options?: {
        withinRange: boolean;
    }): Promise<"Insert Successful">;
    editItem(item: {
        [key: string]: any;
    }, options?: {
        withinRange: boolean;
    }): Promise<"Edit Saved">;
    deleteItem(id: string): Promise<"Item Deleted">;
}
