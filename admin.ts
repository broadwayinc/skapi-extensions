import { Skapi, SkapiError } from 'skapi-js';
import Countries from './countries.js';

enum Required { ADMIN, EMAIL_VERIFICATION, ALL }

export default class Admin extends Skapi {
    services: {
        [serviceId: string]: Service;
    } = {};
    serviceMap = [];

    constructor(host: string) {
        if (!host) {
            throw 'ask Baksa for host id';
        }

        super(host, 'skapi', { autoLogin: window.localStorage.getItem('remember') === 'true' });
    }

    async adminLogin(
        form: {
            email: string;
            password: string;
        },
        option?: { remember?: boolean } & FormSubmitCallback
    ): Promise<UserProfile> {
        let { remember = false } = option || {};
        window.localStorage.setItem('remember', remember.toString());
        delete option.remember;
        return this.login(form);
    }

    async blockAccount(
        serviceId: string,
        params: {
            userId: string
        }
    ): Promise<'SUCCESS'> {
        await this.require(Required.ADMIN);
        await this.request('block-account', { service: serviceId, block: params.userId }, { auth: true });
        return 'SUCCESS';
    }

    async unblockAccount(
        serviceId: string,
        params: {
            userId: string
        }
    ): Promise<'SUCCESS'> {
        await this.require(Required.ADMIN);
        await this.request('block-account', { service: serviceId, unblock: params.userId }, { auth: true });
        return 'SUCCESS';
    }

    async deleteAccount(
        serviceId: string,
        params: {
            userId: string
        }
    ): Promise<'SUCCESS'> {
        await this.require(Required.ADMIN);
        await this.request('remove-account', { service: serviceId, delete: params.userId }, { auth: true });
        return 'SUCCESS';
    }

    private insertService(service: Service) {
        if (!this.services[service.service]) {
            let keyValue = service.timestamp;
            let indexToInsert = this.serviceMap.findIndex(sid => {
                let item = this.services[sid].timestamp;
                return keyValue < item
            });

            if (indexToInsert !== -1) {
                this.serviceMap.splice(indexToInsert, 0, service.service);
            }
            else {
                this.serviceMap.push(service.service);
            }
        }
        this.services[service.service] = service;
    }

    async getServices(serviceId?: string): Promise<Service[]> {
        await this.require(Required.ADMIN);

        if (this.serviceMap.length === 0 || serviceId) {
            let services = await this.request('get-services', serviceId ? { service_id: serviceId } : null, { auth: true });
            for (let region in services) {
                for (let service of services[region]) {
                    this.insertService(service);
                }
            }

            if (serviceId) {
                return [this.services[serviceId]];
            }
        }

        return this.serviceMap.map(sid => this.services[sid]);
    }

    async createService(
        params: {
            name: string;
            cors: string[];
            api_key: string;
        }
    ): Promise<Service> {
        await this.require(Required.ALL);

        const regions = {
            US: 'us-east-2',
            JP: 'ap-northeast-1',
            SG: 'ap-southeast-1',
        }

        let currentLocale = this.connection.locale;
        let serviceRegion = '';

        if (regions?.[currentLocale]) {
            serviceRegion = regions[currentLocale];
        }
        else {
            const calculateDistance = (locale, region) => {
                const R = 6371e3; // metres
                const φ1 = (locale.latitude * Math.PI) / 180; // φ, λ in radians
                const φ2 = (region.latitude * Math.PI) / 180;
                const Δφ = ((region.latitude - locale.latitude) * Math.PI) / 180;
                const Δλ = ((region.longitude - locale.longitude) * Math.PI) / 180;

                const a =
                    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                const d = R * c; // in metres

                return d;
            }

            let difference = null;
            for (let region in regions) {
                let distance = calculateDistance(Countries[currentLocale], Countries[region]);
                if (difference == null || distance < difference) {
                    difference = distance;
                    serviceRegion = regions[region];
                }
            }
        }

        let service = await this.request('register-service', Object.assign(params, { execute: 'create', region: serviceRegion }), { auth: true });
        this.insertService(service);

        return service;
    }

    async enableService(serviceId: string): Promise<Service> {
        let service = this.services[serviceId];
        if (service.active === 0) {
            await this.require(Required.ALL);
            await this.request('register-service', {
                service: serviceId,
                execute: 'enable'
            }, { auth: true });

            service.active = 1;
        }

        return service;
    }

    async disableService(serviceId: string): Promise<Service> {
        let service = this.services[serviceId];
        if (service.active > 0) {
            await this.require(Required.ALL);
            await this.request('register-service', {
                service: serviceId,
                execute: 'disable'
            }, { auth: true });

            service.active = 0;
        }

        return service;
    }

    async updateService(
        serviceId: string,
        params: {
            name: string;
            cors: string[];
            api_key: string;
        }
    ): Promise<Service> {
        let service = this.services[serviceId];
        if (!params) {
            return service;
        }

        let to_update: { [key: string]: any } = {};

        for (let p in params) {
            // only update the difference
            if (p === 'cors') {
                if(params[p].join(', ') !== service?.cors) {
                    to_update.cors = params[p];
                }
            }
            else if (params[p] !== service[p]) {
                to_update[p] = params[p];
            }
        }

        if (Object.keys(to_update).length) {
            await this.require(Required.ALL);
            await this.request('register-service', Object.assign({ execute: 'update', service: service.service }, to_update), { auth: true });
            Object.assign(service, to_update);
        }

        return service;
    }

    async deleteService(serviceId: string): Promise<"the service has been successfully deleted."> {
        await this.require(Required.ALL);

        if (this.services[serviceId].active > 0) {
            throw new SkapiError('the service should be disabled before delete.', { code: 'INVALID_REQUEST' });
        }

        let result = await this.request('register-service', {
            service: serviceId,
            execute: 'delete'
        }, { auth: true });

        delete this.services[serviceId];
        this.serviceMap.indexOf(serviceId) > -1 && this.serviceMap.splice(this.serviceMap.indexOf(serviceId), 1);

        return result;
    }

    async registerSubdomain(
        serviceId: string,
        params: {
            subdomain: string,
            cb: (service: Service) => void // callback runs when the subdomain process is complete
        }
    ): Promise<Service> {
        await this.require(Required.ADMIN);

        let invalid = [
            'baksa',
            'desktop',
            'mobile',
            'skapi',
            'broadwayinc',
            'broadway',
            'documentation'
        ];

        let { subdomain = '' } = params;
        let service = this.services[serviceId];
        if (!service) {
            throw 'Service does not exists.';
        }

        if (subdomain && (subdomain.length < 4 || invalid.includes(subdomain))) {
            throw 'The subdomain has been taken.'
        }

        if (service?.subdomain === subdomain) {
            return service;
        }

        if (service?.subdomain) {
            if (subdomain && service?.subdomain[0] === '*') {
                throw 'Previous subdomain is in removal process.'
            }
            else if (subdomain && service?.subdomain[0] === '+') {
                throw `Previous subdomain is in transit to "${service.subdomain.slice(1)}".`
            }
        }

        let resp = await this.request('register-subdomain', { service: serviceId, subdomain }, {
            auth: true,
            method: 'post'
        });

        service.subdomain = subdomain;

        if (typeof resp !== 'string') {
            Object.assign(service, resp);
        }

        if (typeof params.cb === 'function') {
            let callbackInterval = (serviceId: string, cb: (service: Service) => void, time = 1000): void => {
                if (this.services[serviceId]?.subdomain && this.services[serviceId].subdomain?.[0] === '+' && this.services[serviceId].subdomain?.[0] === '*') {
                    this.getServices(serviceId).then(res => {
                        if (!res[0]?.subdomain || res[0]?.subdomain && res[0].subdomain[0] !== '+' && res[0].subdomain[0] !== '*') {
                            return cb(this.services[serviceId]);
                        }
                        else {
                            time *= 1.2;
                            setTimeout(() => callbackInterval(serviceId, cb, time), time);
                        }
                    });
                }
                else {
                    return cb(this.services[serviceId]);
                }
            }
            callbackInterval(serviceId, params.cb);
        }

        return service;
    }

    async refreshCDN(
        serviceId: string,
        params?: {
            // when true, returns the status of the cdn refresh without running the cdn refresh
            // if callback are given, calls for cdn refresh, then callbacks the cdn refresh status in 3 seconds interval
            checkStatus: boolean | ((status: 'IN_QUEUE' | 'COMPLETE' | 'IN_PROCESS') => void);
        }
    ): Promise<
        'IS_QUEUED' | // new cdn refresh is queued
        'IN_QUEUE' | // the previous cdn refresh is still in queue
        'COMPLETE' | // only when checkStatus is true and the previous cdn refresh is complete
        'IN_PROCESS' // the cdn refresh is in process
    > {
        await this.require(Required.ADMIN);
        let { checkStatus = false } = params || {};

        if (!serviceId) throw 'Service ID is required';

        let service = this.services[serviceId];
        if (!service.subdomain || service.subdomain[0] === '*') {
            throw 'subdomain does not exists.';
        }

        try {
            let res = await this.request('refresh-cdn', {
                service: serviceId,
                subdomain: service.subdomain,
                exec: typeof checkStatus === 'boolean' && checkStatus ? 'status' : 'refresh'
            }, {
                auth: true,
                method: 'post'
            });

            if (checkStatus === true) {
                return res;
            }

            return 'IS_QUEUED'

        }
        catch (err) {
            if ((err as SkapiError).message === 'previous cdn refresh is still in queue.') {
                return 'IN_QUEUE';
            }
            if ((err as SkapiError).message === 'previous cdn refresh is in process.') {
                return 'IN_PROCESS';
            }

            throw err;
        }
        finally {
            if (typeof checkStatus === 'function') {
                let callbackInterval = (serviceId, cb, time = 3000) => {
                    setTimeout(() => {
                        this.refreshCDN(serviceId, { checkStatus: true }).then(res => {
                            if (res === 'COMPLETE') {
                                return cb(res);
                            }
                            callbackInterval(serviceId, cb, time);
                        });
                    }, time);
                }
                callbackInterval(serviceId, checkStatus);
            }
        }
    }

    async set404(
        params: {
            serviceId: string,
            path: string // Set path to file of 404 page. ex) folder/file.html
        }
    ): Promise<'SUCCESS'> {
        await this.require(Required.ADMIN);
        let serviceId = params.serviceId;
        if (!this.services[serviceId].subdomain) {
            throw 'subdomain does not exists.';
        }
        await this.request('set-404', { service: serviceId, page404: this.services[serviceId].subdomain + '/' + params.path }, { auth: true });
        return 'SUCCESS';
    }

    async uploadHostFiles(
        formData: FormData,
        params: {
            serviceId: string;
            progress: (p: Progress) => void
        }
    ): Promise<{ completed: File[]; failed: File[]; }> {
        await this.require(Required.ADMIN);
        if (!params?.serviceId) {
            throw new SkapiError('"params.serviceId" is required.', { code: 'INVALID_PARAMETER' });
        }
        return this.uploadFiles(formData, ({
            service: params.serviceId,
            request: 'host',
            progress: params?.progress
        } as any))
    }

    async deleteHostFiles(
        params: {
            serviceId: string,
            paths: string[] // path without subdomain ex) folder/file.html
        }
    ): Promise<string> {
        await this.require(Required.ADMIN);
        if (!params?.serviceId) {
            throw new SkapiError('"params.serviceId" is required.', { code: 'INVALID_PARAMETER' });
        }
        if (!params?.paths) {
            throw new SkapiError('"params.paths" is required.', { code: 'INVALID_PARAMETER' });
        }

        let service = this.services[params.serviceId];
        let pathsArr = [];

        for (let i = 0; i < params.paths.length; i++) {
            pathsArr.push(service.subdomain + '/' + params.paths[i]);
        }

        return this.request('del-files', {
            service: params.serviceId,
            endpoints: pathsArr,
            storage: 'host'
        }, { auth: true, method: 'post' });
    }

    async requestNewsletterSender(serviceId: string, params: { groupNum: number }): Promise<string> {
        await this.require(Required.ALL);
        return this.request('request-newsletter-sender', { service: serviceId, group_numb: params.groupNum }, { auth: true });
    }

    async deleteNewsletter(
        params: {
            message_id: string;
            group: number;
        }
    ) {
        await this.require(Required.ADMIN);
        return this.request('delete-newsletter', params, { auth: true });
    }

    async storageInformation(serviceId: string): Promise<{
        cloud: number; // cloud storage used
        database: number; // database size
        email: number; // email storage used
        service: string;
    }> {
        await this.require(Required.ADMIN);
        return this.request('storage-info', { service: serviceId }, { auth: true });
    }

    async listHostDirectory(
        serviceId: string,
        params: {
            dir: string; // unix style dir without subdomain. ex) /folder/subfolder/
        },
        fetchOptions: FetchOptions
    ): Promise<DatabaseResponse<
        {
            name: string; // file path ex) /folder/subfolder/file.txt
            type: 'file' | 'folder';
            size?: number; // only in file
            lastModified?: number; // only in file
        }
    >> {
        this.require(Required.ADMIN);

        if (!params?.dir) {
            params.dir = '/';
        }

        return this.request('list-host-directory', Object.assign(params, { service: serviceId }), {
            fetchOptions,
            auth: true,
            method: 'post'
        });
    }

    private async require(access: Required): Promise<void> {
        if (access === Required.ALL || access === Required.ADMIN) {
            let is_admin = await this.checkAdmin();
            if (!is_admin) {
                throw new SkapiError('No access. User is logged out.', { code: 'INVALID_REQUEST' });
            }
        }

        if (access === Required.ALL || access === Required.EMAIL_VERIFICATION) {
            await this.__connection;
            if (!this.__user?.email_verified) {
                throw new SkapiError('E-Mail verification is needed.', { code: 'INVALID_REQUEST' });
            }
        }
    }
}