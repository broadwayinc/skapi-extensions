import { Skapi, SkapiError } from 'skapi-js';

export default class Admin extends Skapi {
    state: {
        user: UserAttributes & UserProfile,
        connection: Connection,
        services: {
            [serviceId: string]: Service;
        }
    };

    serviceMap: string[];

    // default email templates
    default_templates = {
        template_verification: {
            sms: '[${service_name}] Verification code: ${code}',
            html: '<p>Verification code: <span style="font-weight: bold">${code}</span></p>',
            subject: '[${service_name}] Verification code'
        },

        template_welcome: {
            html: '<p style="font-weight: bold">Hello ${name}</p><p>Thank you for joining ${service_name}</p><p>Your registered E-Mail is: <span style="font-weight: bold">${email}</span></p><br/><p style="font-weight: bold">${service_name}</p>',
            subject: 'Thank you for joining ${service_name}',
        },

        template_activation: {
            html: '<p>Please activate your account by clicking this <a href="${link}" style="font-weight: bold">LINK</a></p><p>Your activation link is valid for 24 hours</p>',
            subject: '[${service_name}] Account activation'
        }
    };

    constructor(state) {
        super('us31zettahertzesskpi', 'skapi', { autoLogin: window.localStorage.getItem('remember') === 'false' });
        this.state = state;

        if (!this.state.connection) this.state.connection = null;
        if (!this.state.services) this.state.services = null;
        if (!this.state.user) this.state.user = null;

        this.__connection.then((c) => {
            this.state.connection = c;
            this.getProfile({ refreshToken: true }).then(u => {
                this.state.user = u;
            }).catch((err: Error) => err);
        })
    }

    async adminLogin(
        form: {
            email: string;
            password: string;
        },
        option?: FormSubmitCallback & { remember?: boolean }
    ): Promise<UserAttributes & UserProfile> {

        if (option?.remember) {
            window.localStorage.setItem('remember', 'true');
        } else {
            window.localStorage.setItem('remember', 'false');
        }

        let login = await this.login(form, option);
        this.state.user = login;
        console.log(this.state.user)

        return login;
    }

    async adminLogout() {
        let r = await this.logout();
        this.state = null;
        return r;
    }

    async blockAccount(serviceId: string, params: {
        userId: string
    }): Promise<'SUCCESS: the user has been blocked.'> {
        await this.require(['admin', 'verification']);
        return await this.request('block-account', { service: serviceId, block: params.userId }, { auth: true });
    }

    async unblockAccount(serviceId: string, params: {
        userId: string
    }): Promise<'SUCCESS: the user has been unblocked.'> {
        await this.require(['admin', 'verification']);
        return await this.request('block-account', { service: serviceId, unblock: params.userId }, { auth: true });
    }

    async deleteAccount(serviceId: string, params: {
        userId: string
    }): Promise<'SUCCESS: account has been deleted.'> {
        await this.require(['admin', 'verification']);
        return await this.request('remove-account', { service: serviceId, delete: params.userId }, { auth: true });
    }

    async getServices(serviceId?: string): Promise<Service[]> {
        await this.require(['admin']);
        
        if (serviceId) {
            let services: { [region: string]: Service[] } = await this.request('get-services', { service_id: serviceId }, { auth: true });

            for (let list in services) {
                for (let service of services[list]) {
                    for (let t in this.default_templates) {
                        if (!service[t]) {
                            service[t] = this.default_templates[t];
                        }
                    }
                    this.state.services[service.service] = service;
                    return [service];
                }
            }
        }

        this.serviceMap = [];

        if (!this.state.services) {
            let services: { [region: string]: Service[] } = await this.request('get-services', null, { auth: true });
            let serviceList = {}

            for (let list in services) {
                for (let service of services[list]) {
                    for (let t in this.default_templates) {
                        if (!service[t]) {
                            service[t] = this.default_templates[t];
                        }
                    }
                    serviceList[service.service] = service;
                    this.serviceMap.push(service.service);
                }
            }

            this.serviceMap.sort((a, b) => serviceList[b].timestamp - serviceList[a].timestamp);

            this.state.services = serviceList;
        }
        let serviceArray = this.serviceMap.map(item => this.state.services[item]);
        return serviceArray;
    }

    async createService(params: {
        region: string;
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service> {
        await this.require(['admin', 'verification']);

        const countries = {
            "AD": {
                "lat": 42.546245,
                "long": 1.601554,
                "name": "Andorra",
                "phone": "+376"
            },
            "AE": {
                "lat": 23.424076,
                "long": 53.847818,
                "name": "United Arab Emirates",
                "phone": "+971"
            },
            "AF": {
                "lat": 33.93911,
                "long": 67.709953,
                "name": "Afghanistan",
                "phone": "+93"
            },
            "AG": {
                "lat": 17.060816,
                "long": -61.796428,
                "name": "Antigua and Barbuda",
                "phone": "+1-268"
            },
            "AI": {
                "lat": 18.220554,
                "long": -63.068615,
                "name": "Anguilla",
                "phone": "+1-264"
            },
            "AL": {
                "lat": 41.153332,
                "long": 20.168331,
                "name": "Albania",
                "phone": "+355"
            },
            "AM": {
                "lat": 40.069099,
                "long": 45.038189,
                "name": "Armenia",
                "phone": "+374"
            },
            "AN": {
                "lat": 12.226079,
                "long": -69.060087,
                "name": "Netherlands Antilles"
            },
            "AO": {
                "lat": -11.202692,
                "long": 17.873887,
                "name": "Angola",
                "phone": "+244"
            },
            "AQ": {
                "lat": -75.250973,
                "long": -0.071389,
                "name": "Antarctica",
                "phone": "+"
            },
            "AR": {
                "lat": -38.416097,
                "long": -63.616672,
                "name": "Argentina",
                "phone": "+54"
            },
            "AS": {
                "lat": -14.270972,
                "long": -170.132217,
                "name": "American Samoa",
                "phone": "+1-684"
            },
            "AT": {
                "lat": 47.516231,
                "long": 14.550072,
                "name": "Austria",
                "phone": "+43"
            },
            "AU": {
                "lat": -25.274398,
                "long": 133.775136,
                "name": "Australia",
                "phone": "+61"
            },
            "AW": {
                "lat": 12.52111,
                "long": -69.968338,
                "name": "Aruba",
                "phone": "+297"
            },
            "AZ": {
                "lat": 40.143105,
                "long": 47.576927,
                "name": "Azerbaijan",
                "phone": "+994"
            },
            "BA": {
                "lat": 43.915886,
                "long": 17.679076,
                "name": "Bosnia and Herzegovina",
                "phone": "+387"
            },
            "BB": {
                "lat": 13.193887,
                "long": -59.543198,
                "name": "Barbados",
                "phone": "+1-246"
            },
            "BD": {
                "lat": 23.684994,
                "long": 90.356331,
                "name": "Bangladesh",
                "phone": "+880"
            },
            "BE": {
                "lat": 50.503887,
                "long": 4.469936,
                "name": "Belgium",
                "phone": "+32"
            },
            "BF": {
                "lat": 12.238333,
                "long": -1.561593,
                "name": "Burkina Faso",
                "phone": "+226"
            },
            "BG": {
                "lat": 42.733883,
                "long": 25.48583,
                "name": "Bulgaria",
                "phone": "+359"
            },
            "BH": {
                "lat": 25.930414,
                "long": 50.637772,
                "name": "Bahrain",
                "phone": "+973"
            },
            "BI": {
                "lat": -3.373056,
                "long": 29.918886,
                "name": "Burundi",
                "phone": "+257"
            },
            "BJ": {
                "lat": 9.30769,
                "long": 2.315834,
                "name": "Benin",
                "phone": "+229"
            },
            "BM": {
                "lat": 32.321384,
                "long": -64.75737,
                "name": "Bermuda",
                "phone": "+1-441"
            },
            "BN": {
                "lat": 4.535277,
                "long": 114.727669,
                "name": "Brunei",
                "phone": "+673"
            },
            "BO": {
                "lat": -16.290154,
                "long": -63.588653,
                "name": "Bolivia",
                "phone": "+591"
            },
            "BR": {
                "lat": -14.235004,
                "long": -51.92528,
                "name": "Brazil",
                "phone": "+55"
            },
            "BS": {
                "lat": 25.03428,
                "long": -77.39628,
                "name": "Bahamas",
                "phone": "+1-242"
            },
            "BT": {
                "lat": 27.514162,
                "long": 90.433601,
                "name": "Bhutan",
                "phone": "+975"
            },
            "BV": {
                "lat": -54.423199,
                "long": 3.413194,
                "name": "Bouvet Island",
                "phone": "+"
            },
            "BW": {
                "lat": -22.328474,
                "long": 24.684866,
                "name": "Botswana",
                "phone": "+267"
            },
            "BY": {
                "lat": 53.709807,
                "long": 27.953389,
                "name": "Belarus",
                "phone": "+375"
            },
            "BZ": {
                "lat": 17.189877,
                "long": -88.49765,
                "name": "Belize",
                "phone": "+501"
            },
            "CA": {
                "lat": 56.130366,
                "long": -106.346771,
                "name": "Canada",
                "phone": "+1"
            },
            "CC": {
                "lat": -12.164165,
                "long": 96.870956,
                "name": "Cocos [Keeling] Islands",
                "phone": "+61"
            },
            "CD": {
                "lat": -4.038333,
                "long": 21.758664,
                "name": "Congo [DRC]",
                "phone": "+243"
            },
            "CF": {
                "lat": 6.611111,
                "long": 20.939444,
                "name": "Central African Republic",
                "phone": "+236"
            },
            "CG": {
                "lat": -0.228021,
                "long": 15.827659,
                "name": "Congo [Republic]",
                "phone": "+242"
            },
            "CH": {
                "lat": 46.818188,
                "long": 8.227512,
                "name": "Switzerland",
                "phone": "+41"
            },
            "CI": {
                "lat": 7.539989,
                "long": -5.54708,
                "name": "Côte d'Ivoire",
                "phone": "+225"
            },
            "CK": {
                "lat": -21.236736,
                "long": -159.777671,
                "name": "Cook Islands",
                "phone": "+682"
            },
            "CL": {
                "lat": -35.675147,
                "long": -71.542969,
                "name": "Chile",
                "phone": "+56"
            },
            "CM": {
                "lat": 7.369722,
                "long": 12.354722,
                "name": "Cameroon",
                "phone": "+237"
            },
            "CN": {
                "lat": 35.86166,
                "long": 104.195397,
                "name": "China",
                "phone": "+86"
            },
            "CO": {
                "lat": 4.570868,
                "long": -74.297333,
                "name": "Colombia",
                "phone": "+57"
            },
            "CR": {
                "lat": 9.748917,
                "long": -83.753428,
                "name": "Costa Rica",
                "phone": "+506"
            },
            "CU": {
                "lat": 21.521757,
                "long": -77.781167,
                "name": "Cuba",
                "phone": "+53"
            },
            "CV": {
                "lat": 16.002082,
                "long": -24.013197,
                "name": "Cape Verde",
                "phone": "+238"
            },
            "CX": {
                "lat": -10.447525,
                "long": 105.690449,
                "name": "Christmas Island",
                "phone": "+61"
            },
            "CY": {
                "lat": 35.126413,
                "long": 33.429859,
                "name": "Cyprus",
                "phone": "+357"
            },
            "CZ": {
                "lat": 49.817492,
                "long": 15.472962,
                "name": "Czech Republic",
                "phone": "+420"
            },
            "DE": {
                "lat": 51.165691,
                "long": 10.451526,
                "name": "Germany",
                "phone": "+49"
            },
            "DJ": {
                "lat": 11.825138,
                "long": 42.590275,
                "name": "Djibouti",
                "phone": "+253"
            },
            "DK": {
                "lat": 56.26392,
                "long": 9.501785,
                "name": "Denmark",
                "phone": "+45"
            },
            "DM": {
                "lat": 15.414999,
                "long": -61.370976,
                "name": "Dominica",
                "phone": "+1-767"
            },
            "DO": {
                "lat": 18.735693,
                "long": -70.162651,
                "name": "Dominican Republic",
                "phone": "+1-809 and 1-829"
            },
            "DZ": {
                "lat": 28.033886,
                "long": 1.659626,
                "name": "Algeria",
                "phone": "+213"
            },
            "EC": {
                "lat": -1.831239,
                "long": -78.183406,
                "name": "Ecuador",
                "phone": "+593"
            },
            "EE": {
                "lat": 58.595272,
                "long": 25.013607,
                "name": "Estonia",
                "phone": "+372"
            },
            "EG": {
                "lat": 26.820553,
                "long": 30.802498,
                "name": "Egypt",
                "phone": "+20"
            },
            "EH": {
                "lat": 24.215527,
                "long": -12.885834,
                "name": "Western Sahara"
            },
            "ER": {
                "lat": 15.179384,
                "long": 39.782334,
                "name": "Eritrea",
                "phone": "+291"
            },
            "ES": {
                "lat": 40.463667,
                "long": -3.74922,
                "name": "Spain",
                "phone": "+34"
            },
            "ET": {
                "lat": 9.145,
                "long": 40.489673,
                "name": "Ethiopia",
                "phone": "+251"
            },
            "FI": {
                "lat": 61.92411,
                "long": 25.748151,
                "name": "Finland",
                "phone": "+358"
            },
            "FJ": {
                "lat": -16.578193,
                "long": 179.414413,
                "name": "Fiji",
                "phone": "+679"
            },
            "FK": {
                "lat": -51.796253,
                "long": -59.523613,
                "name": "Falkland Islands [Islas Malvinas]",
                "phone": "+500"
            },
            "FM": {
                "lat": 7.425554,
                "long": 150.550812,
                "name": "Micronesia",
                "phone": "+691"
            },
            "FO": {
                "lat": 61.892635,
                "long": -6.911806,
                "name": "Faroe Islands",
                "phone": "+298"
            },
            "FR": {
                "lat": 46.227638,
                "long": 2.213749,
                "name": "France",
                "phone": "+33"
            },
            "GA": {
                "lat": -0.803689,
                "long": 11.609444,
                "name": "Gabon",
                "phone": "+241"
            },
            "GB": {
                "lat": 55.378051,
                "long": -3.435973,
                "name": "United Kingdom",
                "phone": "+44"
            },
            "GD": {
                "lat": 12.262776,
                "long": -61.604171,
                "name": "Grenada",
                "phone": "+1-473"
            },
            "GE": {
                "lat": 42.315407,
                "long": 43.356892,
                "name": "Georgia",
                "phone": "+995"
            },
            "GF": {
                "lat": 3.933889,
                "long": -53.125782,
                "name": "French Guiana",
                "phone": "+594"
            },
            "GG": {
                "lat": 49.465691,
                "long": -2.585278,
                "name": "Guernsey",
                "phone": "+44-1481"
            },
            "GH": {
                "lat": 7.946527,
                "long": -1.023194,
                "name": "Ghana",
                "phone": "+233"
            },
            "GI": {
                "lat": 36.137741,
                "long": -5.345374,
                "name": "Gibraltar",
                "phone": "+350"
            },
            "GL": {
                "lat": 71.706936,
                "long": -42.604303,
                "name": "Greenland",
                "phone": "+299"
            },
            "GM": {
                "lat": 13.443182,
                "long": -15.310139,
                "name": "Gambia",
                "phone": "+220"
            },
            "GN": {
                "lat": 9.945587,
                "long": -9.696645,
                "name": "Guinea",
                "phone": "+224"
            },
            "GP": {
                "lat": 16.995971,
                "long": -62.067641,
                "name": "Guadeloupe",
                "phone": "+590"
            },
            "GQ": {
                "lat": 1.650801,
                "long": 10.267895,
                "name": "Equatorial Guinea",
                "phone": "+240"
            },
            "GR": {
                "lat": 39.074208,
                "long": 21.824312,
                "name": "Greece",
                "phone": "+30"
            },
            "GS": {
                "lat": -54.429579,
                "long": -36.587909,
                "name": "South Georgia and the South Sandwich Islands",
                "phone": "+"
            },
            "GT": {
                "lat": 15.783471,
                "long": -90.230759,
                "name": "Guatemala",
                "phone": "+502"
            },
            "GU": {
                "lat": 13.444304,
                "long": 144.793731,
                "name": "Guam",
                "phone": "+1-671"
            },
            "GW": {
                "lat": 11.803749,
                "long": -15.180413,
                "name": "Guinea-Bissau",
                "phone": "+245"
            },
            "GY": {
                "lat": 4.860416,
                "long": -58.93018,
                "name": "Guyana",
                "phone": "+592"
            },
            "GZ": {
                "lat": 31.354676,
                "long": 34.308825,
                "name": "Gaza Strip"
            },
            "HK": {
                "lat": 22.396428,
                "long": 114.109497,
                "name": "Hong Kong",
                "phone": "+852"
            },
            "HM": {
                "lat": -53.08181,
                "long": 73.504158,
                "name": "Heard Island and McDonald Islands",
                "phone": "+ "
            },
            "HN": {
                "lat": 15.199999,
                "long": -86.241905,
                "name": "Honduras",
                "phone": "+504"
            },
            "HR": {
                "lat": 45.1,
                "long": 15.2,
                "name": "Croatia",
                "phone": "+385"
            },
            "HT": {
                "lat": 18.971187,
                "long": -72.285215,
                "name": "Haiti",
                "phone": "+509"
            },
            "HU": {
                "lat": 47.162494,
                "long": 19.503304,
                "name": "Hungary",
                "phone": "+36"
            },
            "ID": {
                "lat": -0.789275,
                "long": 113.921327,
                "name": "Indonesia",
                "phone": "+62"
            },
            "IE": {
                "lat": 53.41291,
                "long": -8.24389,
                "name": "Ireland",
                "phone": "+353"
            },
            "IL": {
                "lat": 31.046051,
                "long": 34.851612,
                "name": "Israel",
                "phone": "+972"
            },
            "IM": {
                "lat": 54.236107,
                "long": -4.548056,
                "name": "Isle of Man",
                "phone": "+44-1624"
            },
            "IN": {
                "lat": 20.593684,
                "long": 78.96288,
                "name": "India",
                "phone": "+91"
            },
            "IO": {
                "lat": -6.343194,
                "long": 71.876519,
                "name": "British Indian Ocean Territory",
                "phone": "+246"
            },
            "IQ": {
                "lat": 33.223191,
                "long": 43.679291,
                "name": "Iraq",
                "phone": "+964"
            },
            "IR": {
                "lat": 32.427908,
                "long": 53.688046,
                "name": "Iran",
                "phone": "+98"
            },
            "IS": {
                "lat": 64.963051,
                "long": -19.020835,
                "name": "Iceland",
                "phone": "+354"
            },
            "IT": {
                "lat": 41.87194,
                "long": 12.56738,
                "name": "Italy",
                "phone": "+39"
            },
            "JE": {
                "lat": 49.214439,
                "long": -2.13125,
                "name": "Jersey",
                "phone": "+44-1534"
            },
            "JM": {
                "lat": 18.109581,
                "long": -77.297508,
                "name": "Jamaica",
                "phone": "+1-876"
            },
            "JO": {
                "lat": 30.585164,
                "long": 36.238414,
                "name": "Jordan",
                "phone": "+962"
            },
            "JP": {
                "lat": 36.204824,
                "long": 138.252924,
                "name": "Japan",
                "phone": "+81"
            },
            "KE": {
                "lat": -0.023559,
                "long": 37.906193,
                "name": "Kenya",
                "phone": "+254"
            },
            "KG": {
                "lat": 41.20438,
                "long": 74.766098,
                "name": "Kyrgyzstan",
                "phone": "+996"
            },
            "KH": {
                "lat": 12.565679,
                "long": 104.990963,
                "name": "Cambodia",
                "phone": "+855"
            },
            "KI": {
                "lat": -3.370417,
                "long": -168.734039,
                "name": "Kiribati",
                "phone": "+686"
            },
            "KM": {
                "lat": -11.875001,
                "long": 43.872219,
                "name": "Comoros",
                "phone": "+269"
            },
            "KN": {
                "lat": 17.357822,
                "long": -62.782998,
                "name": "Saint Kitts and Nevis",
                "phone": "+1-869"
            },
            "KP": {
                "lat": 40.339852,
                "long": 127.510093,
                "name": "North Korea",
                "phone": "+850"
            },
            "KR": {
                "lat": 35.907757,
                "long": 127.766922,
                "name": "South Korea",
                "phone": "+82"
            },
            "KW": {
                "lat": 29.31166,
                "long": 47.481766,
                "name": "Kuwait",
                "phone": "+965"
            },
            "KY": {
                "lat": 19.513469,
                "long": -80.566956,
                "name": "Cayman Islands",
                "phone": "+1-345"
            },
            "KZ": {
                "lat": 48.019573,
                "long": 66.923684,
                "name": "Kazakhstan",
                "phone": "+7"
            },
            "LA": {
                "lat": 19.85627,
                "long": 102.495496,
                "name": "Laos",
                "phone": "+856"
            },
            "LB": {
                "lat": 33.854721,
                "long": 35.862285,
                "name": "Lebanon",
                "phone": "+961"
            },
            "LC": {
                "lat": 13.909444,
                "long": -60.978893,
                "name": "Saint Lucia",
                "phone": "+1-758"
            },
            "LI": {
                "lat": 47.166,
                "long": 9.555373,
                "name": "Liechtenstein",
                "phone": "+423"
            },
            "LK": {
                "lat": 7.873054,
                "long": 80.771797,
                "name": "Sri Lanka",
                "phone": "+94"
            },
            "LR": {
                "lat": 6.428055,
                "long": -9.429499,
                "name": "Liberia",
                "phone": "+231"
            },
            "LS": {
                "lat": -29.609988,
                "long": 28.233608,
                "name": "Lesotho",
                "phone": "+266"
            },
            "LT": {
                "lat": 55.169438,
                "long": 23.881275,
                "name": "Lithuania",
                "phone": "+370"
            },
            "LU": {
                "lat": 49.815273,
                "long": 6.129583,
                "name": "Luxembourg",
                "phone": "+352"
            },
            "LV": {
                "lat": 56.879635,
                "long": 24.603189,
                "name": "Latvia",
                "phone": "+371"
            },
            "LY": {
                "lat": 26.3351,
                "long": 17.228331,
                "name": "Libya",
                "phone": "+218"
            },
            "MA": {
                "lat": 31.791702,
                "long": -7.09262,
                "name": "Morocco",
                "phone": "+212"
            },
            "MC": {
                "lat": 43.750298,
                "long": 7.412841,
                "name": "Monaco",
                "phone": "+377"
            },
            "MD": {
                "lat": 47.411631,
                "long": 28.369885,
                "name": "Moldova",
                "phone": "+373"
            },
            "ME": {
                "lat": 42.708678,
                "long": 19.37439,
                "name": "Montenegro",
                "phone": "+382"
            },
            "MG": {
                "lat": -18.766947,
                "long": 46.869107,
                "name": "Madagascar",
                "phone": "+261"
            },
            "MH": {
                "lat": 7.131474,
                "long": 171.184478,
                "name": "Marshall Islands",
                "phone": "+692"
            },
            "MK": {
                "lat": 41.608635,
                "long": 21.745275,
                "name": "Macedonia [FYROM]",
                "phone": "+389"
            },
            "ML": {
                "lat": 17.570692,
                "long": -3.996166,
                "name": "Mali",
                "phone": "+223"
            },
            "MM": {
                "lat": 21.913965,
                "long": 95.956223,
                "name": "Myanmar [Burma]",
                "phone": "+95"
            },
            "MN": {
                "lat": 46.862496,
                "long": 103.846656,
                "name": "Mongolia",
                "phone": "+976"
            },
            "MO": {
                "lat": 22.198745,
                "long": 113.543873,
                "name": "Macau",
                "phone": "+853"
            },
            "MP": {
                "lat": 17.33083,
                "long": 145.38469,
                "name": "Northern Mariana Islands",
                "phone": "+1-670"
            },
            "MQ": {
                "lat": 14.641528,
                "long": -61.024174,
                "name": "Martinique",
                "phone": "+596"
            },
            "MR": {
                "lat": 21.00789,
                "long": -10.940835,
                "name": "Mauritania",
                "phone": "+222"
            },
            "MS": {
                "lat": 16.742498,
                "long": -62.187366,
                "name": "Montserrat",
                "phone": "+1-664"
            },
            "MT": {
                "lat": 35.937496,
                "long": 14.375416,
                "name": "Malta",
                "phone": "+356"
            },
            "MU": {
                "lat": -20.348404,
                "long": 57.552152,
                "name": "Mauritius",
                "phone": "+230"
            },
            "MV": {
                "lat": 3.202778,
                "long": 73.22068,
                "name": "Maldives",
                "phone": "+960"
            },
            "MW": {
                "lat": -13.254308,
                "long": 34.301525,
                "name": "Malawi",
                "phone": "+265"
            },
            "MX": {
                "lat": 23.634501,
                "long": -102.552784,
                "name": "Mexico",
                "phone": "+52"
            },
            "MY": {
                "lat": 4.210484,
                "long": 101.975766,
                "name": "Malaysia",
                "phone": "+60"
            },
            "MZ": {
                "lat": -18.665695,
                "long": 35.529562,
                "name": "Mozambique",
                "phone": "+258"
            },
            "NA": {
                "lat": -22.95764,
                "long": 18.49041,
                "name": "Namibia",
                "phone": "+264"
            },
            "NC": {
                "lat": -20.904305,
                "long": 165.618042,
                "name": "New Caledonia",
                "phone": "+687"
            },
            "NE": {
                "lat": 17.607789,
                "long": 8.081666,
                "name": "Niger",
                "phone": "+227"
            },
            "NF": {
                "lat": -29.040835,
                "long": 167.954712,
                "name": "Norfolk Island",
                "phone": "+672"
            },
            "NG": {
                "lat": 9.081999,
                "long": 8.675277,
                "name": "Nigeria",
                "phone": "+234"
            },
            "NI": {
                "lat": 12.865416,
                "long": -85.207229,
                "name": "Nicaragua",
                "phone": "+505"
            },
            "NL": {
                "lat": 52.132633,
                "long": 5.291266,
                "name": "Netherlands",
                "phone": "+31"
            },
            "NO": {
                "lat": 60.472024,
                "long": 8.468946,
                "name": "Norway",
                "phone": "+47"
            },
            "NP": {
                "lat": 28.394857,
                "long": 84.124008,
                "name": "Nepal",
                "phone": "+977"
            },
            "NR": {
                "lat": -0.522778,
                "long": 166.931503,
                "name": "Nauru",
                "phone": "+674"
            },
            "NU": {
                "lat": -19.054445,
                "long": -169.867233,
                "name": "Niue",
                "phone": "+683"
            },
            "NZ": {
                "lat": -40.900557,
                "long": 174.885971,
                "name": "New Zealand",
                "phone": "+64"
            },
            "OM": {
                "lat": 21.512583,
                "long": 55.923255,
                "name": "Oman",
                "phone": "+968"
            },
            "PA": {
                "lat": 8.537981,
                "long": -80.782127,
                "name": "Panama",
                "phone": "+507"
            },
            "PE": {
                "lat": -9.189967,
                "long": -75.015152,
                "name": "Peru",
                "phone": "+51"
            },
            "PF": {
                "lat": -17.679742,
                "long": -149.406843,
                "name": "French Polynesia",
                "phone": "+689"
            },
            "PG": {
                "lat": -6.314993,
                "long": 143.95555,
                "name": "Papua New Guinea",
                "phone": "+675"
            },
            "PH": {
                "lat": 12.879721,
                "long": 121.774017,
                "name": "Philippines",
                "phone": "+63"
            },
            "PK": {
                "lat": 30.375321,
                "long": 69.345116,
                "name": "Pakistan",
                "phone": "+92"
            },
            "PL": {
                "lat": 51.919438,
                "long": 19.145136,
                "name": "Poland",
                "phone": "+48"
            },
            "PM": {
                "lat": 46.941936,
                "long": -56.27111,
                "name": "Saint Pierre and Miquelon",
                "phone": "+508"
            },
            "PN": {
                "lat": -24.703615,
                "long": -127.439308,
                "name": "Pitcairn Islands",
                "phone": "+870"
            },
            "PR": {
                "lat": 18.220833,
                "long": -66.590149,
                "name": "Puerto Rico",
                "phone": "+1-787 and 1-939"
            },
            "PS": {
                "lat": 31.952162,
                "long": 35.233154,
                "name": "Palestinian Territories",
                "phone": "+970"
            },
            "PT": {
                "lat": 39.399872,
                "long": -8.224454,
                "name": "Portugal",
                "phone": "+351"
            },
            "PW": {
                "lat": 7.51498,
                "long": 134.58252,
                "name": "Palau",
                "phone": "+680"
            },
            "PY": {
                "lat": -23.442503,
                "long": -58.443832,
                "name": "Paraguay",
                "phone": "+595"
            },
            "QA": {
                "lat": 25.354826,
                "long": 51.183884,
                "name": "Qatar",
                "phone": "+974"
            },
            "RE": {
                "lat": -21.115141,
                "long": 55.536384,
                "name": "Réunion",
                "phone": "+262"
            },
            "RO": {
                "lat": 45.943161,
                "long": 24.96676,
                "name": "Romania",
                "phone": "+40"
            },
            "RS": {
                "lat": 44.016521,
                "long": 21.005859,
                "name": "Serbia",
                "phone": "+381"
            },
            "RU": {
                "lat": 61.52401,
                "long": 105.318756,
                "name": "Russia",
                "phone": "+7"
            },
            "RW": {
                "lat": -1.940278,
                "long": 29.873888,
                "name": "Rwanda",
                "phone": "+250"
            },
            "SA": {
                "lat": 23.885942,
                "long": 45.079162,
                "name": "Saudi Arabia",
                "phone": "+966"
            },
            "SB": {
                "lat": -9.64571,
                "long": 160.156194,
                "name": "Solomon Islands",
                "phone": "+677"
            },
            "SC": {
                "lat": -4.679574,
                "long": 55.491977,
                "name": "Seychelles",
                "phone": "+248"
            },
            "SD": {
                "lat": 12.862807,
                "long": 30.217636,
                "name": "Sudan",
                "phone": "+249"
            },
            "SE": {
                "lat": 60.128161,
                "long": 18.643501,
                "name": "Sweden",
                "phone": "+46"
            },
            "SG": {
                "lat": 1.352083,
                "long": 103.819836,
                "name": "Singapore",
                "phone": "+65"
            },
            "SH": {
                "lat": -24.143474,
                "long": -10.030696,
                "name": "Saint Helena",
                "phone": "+290"
            },
            "SI": {
                "lat": 46.151241,
                "long": 14.995463,
                "name": "Slovenia",
                "phone": "+386"
            },
            "SJ": {
                "lat": 77.553604,
                "long": 23.670272,
                "name": "Svalbard and Jan Mayen",
                "phone": "+47"
            },
            "SK": {
                "lat": 48.669026,
                "long": 19.699024,
                "name": "Slovakia",
                "phone": "+421"
            },
            "SL": {
                "lat": 8.460555,
                "long": -11.779889,
                "name": "Sierra Leone",
                "phone": "+232"
            },
            "SM": {
                "lat": 43.94236,
                "long": 12.457777,
                "name": "San Marino",
                "phone": "+378"
            },
            "SN": {
                "lat": 14.497401,
                "long": -14.452362,
                "name": "Senegal",
                "phone": "+221"
            },
            "SO": {
                "lat": 5.152149,
                "long": 46.199616,
                "name": "Somalia",
                "phone": "+252"
            },
            "SR": {
                "lat": 3.919305,
                "long": -56.027783,
                "name": "Suriname",
                "phone": "+597"
            },
            "ST": {
                "lat": 0.18636,
                "long": 6.613081,
                "name": "São Tomé and Príncipe",
                "phone": "+239"
            },
            "SV": {
                "lat": 13.794185,
                "long": -88.89653,
                "name": "El Salvador",
                "phone": "+503"
            },
            "SY": {
                "lat": 34.802075,
                "long": 38.996815,
                "name": "Syria",
                "phone": "+963"
            },
            "SZ": {
                "lat": -26.522503,
                "long": 31.465866,
                "name": "Swaziland",
                "phone": "+268"
            },
            "TC": {
                "lat": 21.694025,
                "long": -71.797928,
                "name": "Turks and Caicos Islands",
                "phone": "+1-649"
            },
            "TD": {
                "lat": 15.454166,
                "long": 18.732207,
                "name": "Chad",
                "phone": "+235"
            },
            "TF": {
                "lat": -49.280366,
                "long": 69.348557,
                "name": "French Southern Territories",
                "phone": "+"
            },
            "TG": {
                "lat": 8.619543,
                "long": 0.824782,
                "name": "Togo",
                "phone": "+228"
            },
            "TH": {
                "lat": 15.870032,
                "long": 100.992541,
                "name": "Thailand",
                "phone": "+66"
            },
            "TJ": {
                "lat": 38.861034,
                "long": 71.276093,
                "name": "Tajikistan",
                "phone": "+992"
            },
            "TK": {
                "lat": -8.967363,
                "long": -171.855881,
                "name": "Tokelau",
                "phone": "+690"
            },
            "TL": {
                "lat": -8.874217,
                "long": 125.727539,
                "name": "Timor-Leste",
                "phone": "+670"
            },
            "TM": {
                "lat": 38.969719,
                "long": 59.556278,
                "name": "Turkmenistan",
                "phone": "+993"
            },
            "TN": {
                "lat": 33.886917,
                "long": 9.537499,
                "name": "Tunisia",
                "phone": "+216"
            },
            "TO": {
                "lat": -21.178986,
                "long": -175.198242,
                "name": "Tonga",
                "phone": "+676"
            },
            "TR": {
                "lat": 38.963745,
                "long": 35.243322,
                "name": "Turkey",
                "phone": "+90"
            },
            "TT": {
                "lat": 10.691803,
                "long": -61.222503,
                "name": "Trinidad and Tobago",
                "phone": "+1-868"
            },
            "TV": {
                "lat": -7.109535,
                "long": 177.64933,
                "name": "Tuvalu",
                "phone": "+688"
            },
            "TW": {
                "lat": 23.69781,
                "long": 120.960515,
                "name": "Taiwan",
                "phone": "+886"
            },
            "TZ": {
                "lat": -6.369028,
                "long": 34.888822,
                "name": "Tanzania",
                "phone": "+255"
            },
            "UA": {
                "lat": 48.379433,
                "long": 31.16558,
                "name": "Ukraine",
                "phone": "+380"
            },
            "UG": {
                "lat": 1.373333,
                "long": 32.290275,
                "name": "Uganda",
                "phone": "+256"
            },
            "UM": {
                "lat": null,
                "long": null,
                "name": "U.S. Minor Outlying Islands",
                "phone": "+1"
            },
            "US": {
                "lat": 37.09024,
                "long": -95.712891,
                "name": "United States",
                "phone": "+1"
            },
            "UY": {
                "lat": -32.522779,
                "long": -55.765835,
                "name": "Uruguay",
                "phone": "+598"
            },
            "UZ": {
                "lat": 41.377491,
                "long": 64.585262,
                "name": "Uzbekistan",
                "phone": "+998"
            },
            "VA": {
                "lat": 41.902916,
                "long": 12.453389,
                "name": "Vatican City",
                "phone": "+379"
            },
            "VC": {
                "lat": 12.984305,
                "long": -61.287228,
                "name": "Saint Vincent and the Grenadines",
                "phone": "+1-784"
            },
            "VE": {
                "lat": 6.42375,
                "long": -66.58973,
                "name": "Venezuela",
                "phone": "+58"
            },
            "VG": {
                "lat": 18.420695,
                "long": -64.639968,
                "name": "British Virgin Islands",
                "phone": "+1-284"
            },
            "VI": {
                "lat": 18.335765,
                "long": -64.896335,
                "name": "U.S. Virgin Islands",
                "phone": "+1-340"
            },
            "VN": {
                "lat": 14.058324,
                "long": 108.277199,
                "name": "Vietnam",
                "phone": "+84"
            },
            "VU": {
                "lat": -15.376706,
                "long": 166.959158,
                "name": "Vanuatu",
                "phone": "+678"
            },
            "WF": {
                "lat": -13.768752,
                "long": -177.156097,
                "name": "Wallis and Futuna",
                "phone": "+681"
            },
            "WS": {
                "lat": -13.759029,
                "long": -172.104629,
                "name": "Samoa",
                "phone": "+685"
            },
            "XK": {
                "lat": 42.602636,
                "long": 20.902977,
                "name": "Kosovo",
                "phone": "+"
            },
            "YE": {
                "lat": 15.552727,
                "long": 48.516388,
                "name": "Yemen",
                "phone": "+967"
            },
            "YT": {
                "lat": -12.8275,
                "long": 45.166244,
                "name": "Mayotte",
                "phone": "+262"
            },
            "ZA": {
                "lat": -30.559482,
                "long": 22.937506,
                "name": "South Africa",
                "phone": "+27"
            },
            "ZM": {
                "lat": -13.133897,
                "long": 27.849332,
                "name": "Zambia",
                "phone": "+260"
            },
            "ZW": {
                "lat": -19.015438,
                "long": 29.154857,
                "name": "Zimbabwe",
                "phone": "+263"
            }
        }

        const regions = {
            US: {
                VA: 'us-east-1',
                OH: 'us-east-2',
            },
            KR: 'ap-northeast-2',
            SG: 'ap-southeast-1',
        }

        const states = {
            US: {
                OH: {
                    lat: 40.367474,
                    long: -82.996216
                },
                VA: {
                    lat: 37.926868,
                    long: -78.024902
                }
            }
        }

        const calculateDistance = (locale, region) => {
            const R = 6371e3; // metres
            const φ1 = (locale.lat * Math.PI) / 180; // φ, λ in radians
            const φ2 = (region.lat * Math.PI) / 180;
            const Δφ = ((region.lat - locale.lat) * Math.PI) / 180;
            const Δλ = ((region.long - locale.long) * Math.PI) / 180;

            const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const d = R * c; // in metres

            return d;
        }

        let currentLocale = this.state.connection.locale;
        let res = '';

        if (regions[currentLocale]) {
            res = currentLocale;
        }
        else {
            let difference = null;
            for (let region in regions) {
                let distance = calculateDistance(countries[currentLocale], countries[region]);
                if (difference == null || distance < difference) {
                    difference = distance;
                    res = region;
                }
            }
        }

        if (res === 'US') {
            let country = res;
            let difference = null;
            for (let state in states[country]) {
                let distance = calculateDistance(states[country][state], countries[currentLocale]);
                if (difference == null || distance < difference) {
                    difference = distance;
                    res = state;
                }
            }

            return regions[country][res];
        }

        let serviceRegion = regions[res];
        let service = await this.request('register-service', Object.assign({ execute: 'create' }, { ...params, region: serviceRegion }), { auth: true });

        for (let t in this.default_templates) {
            if (!service[t]) {
                service[t] = this.default_templates[t];
            }
        }

        return service;
    }

    fetchService(serviceId: string): {
        index: number;
        service: Service
    } {
        let idx = this.serviceMap.findIndex((srv) => srv === serviceId);
        if (idx < 0) throw new SkapiError('Service does not exist.', { code: 'NOT_EXISTS' })

        return {
            index: idx,
            service: this.state.services[serviceId]
        }
    }

    async enableService(serviceId: string): Promise<Service> {
        await this.require(['admin', 'verification']);

        let { service } = this.fetchService(serviceId);

        if (service.active === 0) {
            await this.request('register-service', {
                service: serviceId,
                execute: 'enable'
            }, { auth: true });

            service.active = service.group;
        }
        return service;
    }

    async disableService(serviceId: string): Promise<Service> {
        await this.require(['admin', 'verification']);

        let { service } = this.fetchService(serviceId);

        if (service?.active > 0) {
            await this.request('register-service', {
                service: serviceId,
                execute: 'disable'
            }, { auth: true });

            service.active = 0;
        }


        return service;
    }

    async updateService(serviceId: string, params: {
        name: string;
        cors: string[];
        api_key: string;
    }): Promise<Service> {
        await this.require(['admin', 'verification']);

        if (!params || !Object.keys(params).length) {
            throw 'Nothing to update.';
        }

        let { index, service } = this.fetchService(serviceId);
        let hasDiff = false;

        Object.keys(params).forEach((p) => {
            switch (p) {
                case 'name':
                case 'api_key':
                    if (params[p] !== service[p]) {
                        hasDiff = true;
                    }
                    break;
                case 'cors':
                    if (params[p].join(', ') !== service[p]) hasDiff = true;
                    break;
            }

        });

        let result = service;

        if (hasDiff) {
            result = await this.request('register-service', Object.assign({ execute: 'update', service: service.service }, params), { auth: true });
            this.state.services[index] = result;
        }

        return result;
    }

    async deleteService(serviceId: string) {
        await this.require(['admin', 'verification']);

        let { index } = this.fetchService(serviceId);

        if (this.state.services[index].active > 0) throw new SkapiError('the service should be disabled before delete.', { code: 'INVALID_REQUEST' });

        let result = await this.request('register-service', {
            service: serviceId,
            execute: 'delete'
        }, { auth: true });

        delete this.state.services[serviceId];
        this.serviceMap.splice(index, 1);

        return result;
    }

    async registerSubdomain(serviceId: string, params: {
        subdomain: string,
    }): Promise<'SUCCESS: Subdomain is registered.'> {
        await this.require(['admin']);

        let invalid = [
            'docs',
            'baksa',
            'desktop',
            'mobile',
            'skapi',
            'broadwayinc',
            'broadway',
            'documentation'
        ];

        if (!serviceId) throw 'Serivce is required';
        if (!params?.subdomain) throw 'Subdomain is required';
        if (params.subdomain.length < 4 || invalid.includes(params.subdomain)) throw 'Subdomain has been taken.'

        let { index, service } = this.fetchService(serviceId);

        if (service.subdomain) return;

        let result = await this.request('register-subdomain', { service: serviceId, ...params, exec: 'register' }, {
            auth: true,
            method: 'post'
        });

        this.state.services[index].subdomain = params.subdomain;

        return result;
    }

    async deleteSubdomain(serviceId: string): Promise<'SUCCESS: Subdomain is registered.'> {
        await this.require(['admin']);

        if (!serviceId) throw 'Serivce is required';

        let { index, service } = this.fetchService(serviceId);

        if (!service?.subdomain || service.subdomain[0] === '*') return;

        let result = await this.request('register-subdomain', { service: serviceId, subdomain: service.subdomain, exec: 'remove' }, {
            auth: true,
            method: 'post'
        });

        this.state.services[index].subdomain = '*' + this.state.services[index].subdomain;

        return result
    }

    async refreshCDN(serviceId: string, params: {
        subdomain: string
    }): Promise<'SUCCESS: cdn refresh is queued. please give some time to finish the process.'> {
        await this.require(['admin']);

        if (!serviceId) throw 'Service ID is required';
        if (!params.subdomain) throw 'Subdomain is required';

        return this.request('refresh-cdn', {
            service: serviceId,
            subdomain: params.subdomain
        }, {
            auth: true,
            method: 'post'
        });
    }

    /**
     * Set 404 page of subdomain path to file including subdomain name. eg. <subdomain>/<folder>/<file.html>
     */
    async set404(serviceId: string, params: { path: string }): Promise<string> {
        await this.require(['admin', 'verification']);

        return this.request('set-404', { service: serviceId, page404: params.path }, { auth: true });
    }

    async trackSubdomainStatus(serviceId: string): Promise<void> {
        let time = 1000;
        let { index, service } = this.fetchService(serviceId);

        while (service?.subdomain && service.subdomain?.[0] === '*') {
            let res = await this.getServices(serviceId);
            this.state.services[index].subdomain = res[0].subdomain;

            await new Promise((resolve) => setTimeout(() => resolve("Data"), time));

            time *= 2;
        }
    }

    async uploadHostFiles(formData: FormData, params: {
        serviceId: string;
        progress: (p: Progress) => void
    }): Promise<void> {
        await this.require(['admin', 'verification']);

        await this.uploadFiles(formData, {
            service: params.serviceId,
            request: 'host',
            progress: params.progress
        })
    }

    async deleteHostFiles(params: {
        serviceId: string,
        endpoints: string[]
    }) {
        await this.require(['admin', 'verification']);

        let service = this.fetchService(params.serviceId).service;

        for (let i = 0; i < params.endpoints.length; i++) {
            params.endpoints[i] = service.subdomain + '/' + params.endpoints[i];
        }

        return this.deleteFiles({
            endpoints: params.endpoints,
            service: params.serviceId,
            storage: 'host'
        });
    }

    async requestNewsletterSender(serviceId: string, params: { groupNum: number }): Promise<string> {
        await this.require(['admin', 'verification']);
        return this.request('request-newsletter-sender', { service: serviceId, group_numb: params.groupNum }, { auth: true });
    }

    async getNewsletterSubscribers(params: {
        serviceId: string;
        email?: string;
    }, fetchOptions?: FetchOptions): Promise<DatabaseResponse<{
        email: string;
        locale: string;
        timestamp: number;
    }>> {
        await this.require(['verification', 'admin']);

        let sub = {
            subscription: params.serviceId,
            group: 0,
            emailSubscription: true,
            service: params.serviceId,
            subscriber: params.email
        };

        return await this.getSubscriptions(sub, fetchOptions, s => {
            let subSplit = s.sub.split('#');

            let subscription = {
                email: subSplit[0],
                locale: s.loc,
                timestamp: s.stmp
            };

            return subscription;
        });
    }

    async deleteNewsletter(params: {
        message_id: string;
        group: number;
    }) {
        await this.require(['admin']);
        return await this.request('delete-newsletter', params, { auth: true });
    }

    async storageInformation(serviceId: string): Promise<{
        cloud: number; // cloud storage used
        database: number; // database size
        email: number; // email storage used
        service: string;
    }> {
        await this.require(['admin']);
        return await this.request('storage-info', { service: serviceId }, { auth: true });
    }

    /**
     * Checks if requirements are met.
     * @param access // require('admin', 'verification') 
     * @throws { SkapiError } Throws an error if not met.
     * @returns { true } Returns true if conditions are all met
     */
    async require(access: AccessType[]): Promise<true> {
        if (!access.length) throw Error("Not a valid requirement");
        for (let type of access) {
            switch (type) {
                case 'admin':
                    if (!await this.checkAdmin()) {
                        this.state = null;
                        throw new SkapiError('No access', { code: 'INVALID_REQUEST' });
                    }

                    break;
                case 'verification':
                    if (!this.__user?.email_verified) {
                        throw new SkapiError('E-Mail verification is needed.', { code: 'INVALID_REQUEST' });
                    }

                    break;
                default:
                    throw Error("Not a valid requirement");
            }
        }

        return true;
    }
}