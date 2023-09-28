import { Skapi } from 'skapi-js';
export default class Admin extends Skapi {
    services: {
        [serviceId: string]: Service;
    };
    serviceMap: any[];
    constructor(host: string);
    adminLogin(form: {
        email: string;
        password: string;
    }, option?: {
        remember?: boolean;
    } & FormSubmitCallback): Promise<UserProfile>;
    blockAccount(serviceId: string, params: {
        userId: string;
    }): Promise<'SUCCESS'>;
    unblockAccount(serviceId: string, params: {
        userId: string;
    }): Promise<'SUCCESS'>;
    deleteAccount(serviceId: string, params: {
        userId: string;
    }): Promise<'SUCCESS'>;
    private insertService;
    getServices(serviceId?: string): Promise<Service[]>;
    createService(params: {
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service>;
    enableService(serviceId: string): Promise<Service>;
    disableService(serviceId: string): Promise<Service>;
    updateService(serviceId: string, params: {
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service>;
    deleteService(serviceId: string): Promise<"the service has been successfully deleted.">;
    registerSubdomain(serviceId: string, params: {
        subdomain: string;
        cb: (service: Service) => void;
    }): Promise<Service>;
    refreshCDN(serviceId: string, params?: {
        checkStatus: boolean | ((status: 'IN_QUEUE' | 'COMPLETE' | 'IN_PROCESS') => void);
    }): Promise<'IS_QUEUED' | 'IN_QUEUE' | 'COMPLETE' | 'IN_PROCESS'>;
    set404(params: {
        serviceId: string;
        path: string;
    }): Promise<'SUCCESS'>;
    uploadHostFiles(formData: FormData, params: {
        serviceId: string;
        progress: (p: Progress) => void;
    }): Promise<{
        completed: File[];
        failed: File[];
    }>;
    deleteRecFiles(params: {
        serviceId: string;
        endpoints: string[];
    }): Promise<{
        [k: string]: any;
    }[]>;
    deleteHostFiles(params: {
        serviceId: string;
        paths: string[];
    }): Promise<string>;
    requestNewsletterSender(serviceId: string, params: {
        groupNum: number;
    }): Promise<string>;
    deleteNewsletter(params: {
        message_id: string;
        group: number;
    }): Promise<any>;
    storageInformation(serviceId: string): Promise<{
        cloud: number;
        database: number;
        email: number;
        service: string;
    }>;
    listHostDirectory(serviceId: string, params: {
        dir: string;
    }, fetchOptions: FetchOptions): Promise<DatabaseResponse<{
        name: string;
        type: 'file' | 'folder';
        size?: number;
        lastModified?: number;
    }>>;
    private require;
}
