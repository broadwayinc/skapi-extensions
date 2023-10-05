import { Skapi, SkapiError } from 'skapi-js';
import Countries from './countries.js';
var Required;
(function (Required) {
    Required[Required["ADMIN"] = 0] = "ADMIN";
    Required[Required["EMAIL_VERIFICATION"] = 1] = "EMAIL_VERIFICATION";
    Required[Required["ALL"] = 2] = "ALL";
})(Required || (Required = {}));
export default class Admin extends Skapi {
    constructor(host) {
        if (!host) {
            throw 'ask Baksa for host id';
        }
        super(host, 'skapi', { autoLogin: window.localStorage.getItem('remember') === 'true' });
        this.services = {};
        this.serviceMap = [];
        this.updateSubdomain = (serviceId, cb, time = 1000) => {
            if (this.services[serviceId]?.subdomain && (this.services[serviceId].subdomain?.[0] === '+' || this.services[serviceId].subdomain?.[0] === '*')) {
                this.getServices(serviceId).then(res => {
                    if (!res[0]?.subdomain || res[0]?.subdomain && res[0].subdomain[0] !== '+' && res[0].subdomain[0] !== '*') {
                        return cb(this.services[serviceId]);
                    }
                    else {
                        time *= 1.2;
                        setTimeout(() => this.updateSubdomain(serviceId, cb, time), time);
                    }
                });
            }
            else {
                return cb(this.services[serviceId]);
            }
        };
    }
    async adminLogin(form, option) {
        let { remember = false } = option || {};
        window.localStorage.setItem('remember', remember.toString());
        delete option.remember;
        return this.login(form);
    }
    async blockAccount(serviceId, params) {
        await this.require(Required.ADMIN);
        await this.request('block-account', { service: serviceId, block: params.userId }, { auth: true });
        return 'SUCCESS';
    }
    async unblockAccount(serviceId, params) {
        await this.require(Required.ADMIN);
        await this.request('block-account', { service: serviceId, unblock: params.userId }, { auth: true });
        return 'SUCCESS';
    }
    async deleteAccount(serviceId, params) {
        await this.require(Required.ADMIN);
        await this.request('remove-account', { service: serviceId, delete: params.userId }, { auth: true });
        return 'SUCCESS';
    }
    insertService(service) {
        if (!this.services[service.service]) {
            let keyValue = service.timestamp;
            let indexToInsert = this.serviceMap.findIndex(sid => {
                let item = this.services[sid].timestamp;
                return keyValue < item;
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
    async getServices(serviceId) {
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
        return this.services;
    }
    async createService(params) {
        await this.require(Required.ALL);
        const regions = {
            US: 'us-east-2',
            JP: 'ap-northeast-1',
            SG: 'ap-southeast-1',
        };
        let currentLocale = this.connection.locale;
        let serviceRegion = '';
        if (regions?.[currentLocale]) {
            serviceRegion = regions[currentLocale];
        }
        else {
            const calculateDistance = (locale, region) => {
                const R = 6371e3;
                const φ1 = (locale.latitude * Math.PI) / 180;
                const φ2 = (region.latitude * Math.PI) / 180;
                const Δφ = ((region.latitude - locale.latitude) * Math.PI) / 180;
                const Δλ = ((region.longitude - locale.longitude) * Math.PI) / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;
                return d;
            };
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
    async enableService(serviceId) {
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
    async disableService(serviceId) {
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
    async getSubdomainInfo(serviceId, params) {
        return await this.request('subdomain-info', { subdomain: params.subdomain, service: serviceId }, { auth: true });
    }
    async updateService(serviceId, params) {
        let service = this.services[serviceId];
        if (!params) {
            return service;
        }
        let to_update = {};
        for (let p in params) {
            if (p === 'cors') {
                if (params[p].join(', ') !== service?.cors) {
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
    async deleteService(serviceId) {
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
    async registerSubdomain(serviceId, params) {
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
            throw 'The subdomain has been taken.';
        }
        if (service?.subdomain === subdomain) {
            return service;
        }
        if (service?.subdomain) {
            if (subdomain && service?.subdomain[0] === '*') {
                throw 'Previous subdomain is in removal process.';
            }
            else if (subdomain && service?.subdomain[0] === '+') {
                throw `Previous subdomain is in transit to "${service.subdomain.slice(1)}".`;
            }
        }
        let resp = await this.request('register-subdomain', { service: serviceId, subdomain }, {
            auth: true,
            method: 'post'
        });
        if (typeof resp !== 'string') {
            Object.assign(service, resp);
        }
        if (typeof params.cb === 'function') {
            this.updateSubdomain(serviceId, params.cb);
        }
        return service;
    }
    async refreshCDN(serviceId, params) {
        await this.require(Required.ADMIN);
        let { checkStatus = false } = params || {};
        if (!serviceId)
            throw 'Service ID is required';
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
            return 'IS_QUEUED';
        }
        catch (err) {
            if (err.message === 'previous cdn refresh is still in queue.') {
                return 'IN_QUEUE';
            }
            if (err.message === 'previous cdn refresh is in process.') {
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
                };
                callbackInterval(serviceId, checkStatus);
            }
        }
    }
    async set404(params) {
        await this.require(Required.ADMIN);
        let serviceId = params.serviceId;
        if (!this.services[serviceId].subdomain) {
            throw 'subdomain does not exists.';
        }
        await this.request('set-404', { service: serviceId, page404: params.path }, { auth: true });
        return 'SUCCESS';
    }
    async uploadHostFiles(formData, params) {
        await this.require(Required.ADMIN);
        if (!params?.serviceId) {
            throw new SkapiError('"params.serviceId" is required.', { code: 'INVALID_PARAMETER' });
        }
        return this.uploadFiles(formData, {
            service: params.serviceId,
            request: 'host',
            progress: params?.progress
        });
    }
    async deleteRecFiles(params) {
        await this.require(Required.ADMIN);
        if (!params?.serviceId) {
            throw new SkapiError('"params.serviceId" is required.', { code: 'INVALID_PARAMETER' });
        }
        if (!params?.endpoints) {
            throw new SkapiError('"params.endpoints" is required.', { code: 'INVALID_PARAMETER' });
        }
        return this.request('del-files', {
            service: params.serviceId,
            endpoints: params.endpoints,
            storage: 'records'
        }, { auth: true, method: 'post' });
    }
    async deleteHostFiles(params) {
        await this.require(Required.ADMIN);
        if (!params?.serviceId) {
            throw new SkapiError('"params.serviceId" is required.', { code: 'INVALID_PARAMETER' });
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
    async requestNewsletterSender(serviceId, params) {
        await this.require(Required.ALL);
        return this.request('request-newsletter-sender', { service: serviceId, group_numb: params.groupNum }, { auth: true });
    }
    async deleteNewsletter(params) {
        await this.require(Required.ADMIN);
        return this.request('delete-newsletter', params, { auth: true });
    }
    async storageInformation(serviceId) {
        await this.require(Required.ADMIN);
        return this.request('storage-info', { service: serviceId }, { auth: true });
    }
    async listHostDirectory(params, fetchOptions) {
        this.require(Required.ADMIN);
        return this.request('list-host-directory', Object.assign(params), {
            fetchOptions,
            method: 'post'
        });
    }
    async require(access) {
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
