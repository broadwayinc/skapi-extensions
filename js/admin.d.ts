import { Skapi } from 'skapi-js';
export default class Admin extends Skapi {
    services: {
        [serviceId: string]: Service;
    };
    serviceMap: any[];
    payment_api: string;
    regions: {
        US: string;
        KR: string;
        SG: string;
        IN: string;
    };
    constructor(host: string, etc: any, regions: any);
    request_checkout_session(prod_id: any): Promise<any>;
    getAdminEndpoint: (dest: string, auth?: boolean) => Promise<string>;
    setServiceOption(params: {
        serviceId: string;
        option: {
            'prevent_signup': boolean;
            'client_secret': Record<string, any>;
        };
    }): Promise<Service>;
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
    registerTicket(serviceId: string, params: {
        ticket_id: string;
        condition?: {
            user?: {
                [key: string]: {
                    value: string;
                    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | '>' | '>=' | '<' | '<=' | '=' | '!=';
                };
            };
            record_access?: string;
            request?: {
                url: string;
                method: 'GET' | 'POST';
                headers?: {
                    [key: string]: string;
                };
                data?: Record<string, any>;
                params?: Record<string, any>;
                match: {
                    target_key: string;
                    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | '>' | '>=' | '<' | '<=' | '=' | '!=';
                    value: string;
                };
            };
        };
        action?: {
            access_group: number;
            record_access?: string;
            request?: {
                url: string;
                method: 'GET' | 'POST';
                headers?: {
                    [key: string]: string;
                };
                data?: Record<string, any>;
                params?: Record<string, any>;
            };
            upgrade_service?: {
                service: string;
                group: number;
            };
        };
        desc: string;
        count?: number;
        time_to_live?: number;
    }): Promise<string>;
    unregisterTicket(serviceId: string, params: {
        ticket_id: string;
    }): Promise<string>;
    private insertService;
    getServices(serviceId?: string, refresh?: boolean): Promise<{
        [serviceId: string]: Service;
    } | Service[]>;
    createService(params: {
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service>;
    enableService(serviceId: string): Promise<string>;
    disableService(serviceId: string): Promise<string>;
    getSubdomainInfo(serviceId: string, params: {
        subdomain: string;
    }): Promise<{
        srvc: string;
        subd: string;
        ownr: string;
        stat: string;
        ["404"]?: string;
    }>;
    updateService(serviceId: string, params: {
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service>;
    deleteService(serviceId: string): Promise<"the service has been successfully deleted.">;
    updateSubdomain: (serviceId: string, cb: (service: Service) => void, time?: number) => void;
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
        nestKey: string;
        serviceId: string;
        progress: (p: any) => void;
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
    resendInvitation(params: {
        service: string;
        email: string;
        redirect: string;
    }): Promise<'SUCCESS: Invitation E-Mail has been sent.'>;
    storageInformation(serviceId: string): Promise<{
        cloud: number;
        database: number;
        email: number;
        service: string;
    }>;
    listHostDirectory(params: {
        dir: string;
    }, fetchOptions: FetchOptions): Promise<DatabaseResponse<{
        name: string;
        path: string;
        size: number;
        upl: number;
        cnt: number;
    }>>;
    private require;
}
