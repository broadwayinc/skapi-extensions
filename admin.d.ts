type FormSubmitCallback = {
    response?(response: any): void;
    onerror?(error: Error): void;
}

type UserAttributes = {
    /** User's name */
    name?: string;
    /**
     * User's E-Mail for signin.<br>
     * 64 character max.<br>
     * When E-Mail is changed, E-Mail verified state will be changed to false.<br>
     * E-Mail is only visible to others when set to public.<br>
     * E-Mail should be verified to set to public.
     * */
    email?: string;
    /** Additional string value that can be used freely. */
    misc?: string;
};

type UserProfile = {
    /** Service id of the user account. */
    service: string;
    /** User ID of the service owner. */
    owner?: 'skapi';
    /** Access level of the user's account. */
    access_group?: number;
    /** User's ID. */
    user_id: string;
    /** Country code of where user first signed up from. */
    locale: string;
    /** Shows true when user has verified their E-Mail. */
    email_verified?: boolean;
    /** Shows 'PASS' if the user's account signup was successful. 'MEMBER' if signup confirmation was successful. */
    signup_ticket?: string;
    /** Timestamp of user signup time. */
    timestamp: number;
};

type Connection = {
    /** User's locale */
    locale: string;
    /** Service owner's ID */
    owner: string;
    /** E-Mail address of the service owner */
    email: string;
    /** Service ID */
    service: string;
    /** Service region */
    region: string;
    /** 13 digits timestamp of the service creation */
    timestamp: number;
    /** Connected user's IP address */
    ip: string;
}

type Service = {
    /** Shows active state. 1 = active, 0 = disabled */
    active: number;
    /** Custom api key to use for service owners custom api. */
    api_key: string;
    /** Service cors for connection. */
    cors: string;
    /** Locale in which service was created in 2 letter ISO country code ISO 3166-1 alpha-2 standard*/
    created_locale: string;
    /** Service owners E-Mail. */
    email: string;
    /** Number of users subscribed to service E-Mail. */
    email_subscribers: number;
    /** Service group. 1 = free try out. 1 > paid users. */
    group: number;
    /** Service region */
    region: string;
    /** Service name. */
    name: string;
    /** Host is always Skapi's service ID */
    host: "us31zettahertzesskpi";
    /** Number of newsletter subscribers. */
    newsletter_subscribers: number;
    /** Service id. */
    service: string;
    /** Subdomain name */
    subdomain?: string;
    /** Service owner can send email to the triggers to send newsletters, or change automated E-Mail templates. */
    email_triggers: {
        template_setters: {
            newsletter_subscription: string;
            signup_confirmation: string;
            verification: string;
            welcome: string;
        }
    }
    /** E-Mail template for signup confirmation. This can be changed by trigger E-Mail. */
    template_activation: {
        html: string;
        subject: string;
    };
    /** E-Mail template for verification code E-Mail. This can be changed by trigger E-Mail. */
    template_verification: {
        html: string;
        subject: string;
    };
    /** E-Mail template for welcome E-Mail that user receives after signup process. This can be changed by trigger E-Mail. */
    template_welcome: {
        html: string;
        subject: string;
    };
    /** Number of users in the service. */
    users: number;
    /** 13 digit timestamp  */
    timestamp: number;
};

type AccessType = 'admin' | 'verification';

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