type UserProfile = {
    service: string;
    owner: 'skapi';

    /**
     * User's E-Mail for signin.
     * 64 character max.
     * When E-Mail is changed, E-Mail verified state will be changed to false.
     * */
    email?: string;
    /** Additional string value that can be used freely. */
    misc?: string;
    /** Access level of the user's account. Will be used for distinguish paid accounts in the future.*/
    access_group?: number;
    /** User's ID. */
    user_id: string;
    /** Country code of where user first signed up from. */
    locale: string;
    /** Shows true when user has verified their E-Mail. */
    email_verified?: boolean;
};

type Service = {
    /** Service id. */
    service: string;
    /** Shows active state. 1 = active, 0 = disabled */
    active: number;
    /** Service group. 1 = free try out. 1 > paid users. */
    group: number;
    /** Service region */
    region: string;
    /** Service name. */
    name: string;
    /** Service owners E-Mail. */
    email: string;
    /** Custom api key to use for service owners custom api. */
    api_key: string;
    /** Subdomain name */
    subdomain?: string;
    /** Service cors for connection. */
    cors: string;
    /** Locale in which service was created in 2 letter ISO country code ISO 3166-1 alpha-2 standard*/
    created_locale: string;
    /** Number of users subscribed to service E-Mail. */
    email_subscribers: number;
    /** Number of newsletter subscribers. */
    newsletter_subscribers: number;
    /** Service owner can send email to the triggers to send newsletters, or change automated E-Mail templates. */
    email_triggers: {
        template_setters: {
            newsletter_subscription: string;
            signup_confirmation: string;
            verification: string;
            welcome: string;
        }
    };
    /** Number of users in the service. */
    users: number;
    /** 13 digit timestamp of when service was created */
    timestamp: number;
    /** Host is always Skapi's service ID */
    host: string;
};

type FormSubmitCallback = {
    response?(response: any): void;
    onerror?(error: Error): void;
    progress?: (e: {
        status: 'upload' | 'download';
        progress: number;
        loaded: number;
        total: number;
        abort: () => void; // Aborts current data transfer. When abort is triggered during the FileList is on trasmit, it will continue to next file.
    }) => void;
}

type FetchOptions = {
    /** Maximum number of records to fetch per call */
    limit?: number;
    /** Fetch next batch of data. Will return empty list if there is nothing more to fetch. */
    fetchMore?: boolean;
    /** Result in ascending order if true, decending when false. */
    ascending?: boolean;
};

type DatabaseResponse<T> = {
    list: T[];
    startKey: string;
    endOfList: boolean;
    startKeyHistory: string[];
};