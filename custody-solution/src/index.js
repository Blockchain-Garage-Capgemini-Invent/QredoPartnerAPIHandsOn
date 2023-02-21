"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//libraries
const API = __importStar(require("./api"));
const { readFileSync } = require("fs");
const { sign, verify } = require("crypto");
const dotenv = require('dotenv');
dotenv.config();
//global variables
const productionApiKey = process.env.API_KEY;
const BASE_PATH = "https://api.qredo.network/api/v1/p";
//-----------------------------------Basic API Request------------------------------------
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        let assets = yield getAssets();
        console.log(assets);
    });
}
test();
function createSignature(_timestamp, _uri, _body) {
    // signing the request using the private key and request content
    const privateKey = readFileSync("supporting-files/private.pem");
    const content = Buffer.from(_timestamp + _uri + _body);
    const signature = sign("RSA-SHA256", content, privateKey).toString("base64url");
    return signature;
}
function getAssets() {
    return __awaiter(this, void 0, void 0, function* () {
        let assets = {};
        try {
            // 1. Sign your request
            const tempRequest = yield API.CommonApiAxiosParamCreator().assetsGet();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            // 2. Make the request using your API key
            const response = yield API.CommonApiFactory(new API.Configuration({
                apiKey: productionApiKey,
            })).assetsGet("", timestamp, signature);
            assets = response.data;
        }
        catch (error) {
            console.error(error.response);
        }
        return assets;
    });
}
//----------------------------------Creating wallets using the API----------------------------------
//In the first part we will create a company and we will register ourselves as a trusted party of this company.
function test_createFund_Part1() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Create a new company "Bla Company" to hold your funds
        const the_company = yield addCompany("Bla Company", "bla", "Cologne", "Germany");
        const the_company_id = the_company === null || the_company === void 0 ? void 0 : the_company.company_id;
        // 2. Give your email address to register as a trusted party for your company
        yield addTrustedParty(the_company_id, { address: "your_email@gmail.com" });
        // 3. Approve the request in your mobile app.
    });
}
// test_createFund_Part1() //####################### comment this after executing part 1 #######################
function addCompany(_name, _domain, _city, _country) {
    return __awaiter(this, void 0, void 0, function* () {
        var createCompanyResponse = undefined;
        try {
            const company = {
                name: _name,
                city: _city,
                country: _country,
                domain: _domain
            };
            const tempRequest = yield API.CompanyApiAxiosParamCreator().companyPost(company);
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.CompanyApiFactory(new API.Configuration({
                apiKey: productionApiKey,
            })).companyPost(company, "", timestamp, signature);
            createCompanyResponse = response.data;
            console.log(createCompanyResponse);
        }
        catch (error) {
            console.error(error.response);
        }
        return createCompanyResponse;
    });
}
function addTrustedParty(_companyId, _trustedPartyNew) {
    return __awaiter(this, void 0, void 0, function* () {
        var okResponse = {};
        try {
            const tempRequest = yield API.TrustedNetworkApiAxiosParamCreator().companyCompanyIdTrustedpartyPost(_companyId, _trustedPartyNew);
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.TrustedNetworkApiFactory(new API.Configuration({
                apiKey: productionApiKey
            })).companyCompanyIdTrustedpartyPost(_companyId, _trustedPartyNew, "", timestamp, signature);
            okResponse = response.data;
            console.log("okResponse", okResponse);
        }
        catch (error) {
            console.error(error.response);
        }
        return okResponse;
    });
}
//In the second part we will create a fund with 2 wallets.
function test_createFund_Part2() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // 5. Get the company_id
        const companies = yield getAllCompanies();
        const the_company_id = (_b = (_a = companies === null || companies === void 0 ? void 0 : companies.matches) === null || _a === void 0 ? void 0 : _a.find(c => c.domain == 'bla')) === null || _b === void 0 ? void 0 : _b.company_id;
        // 4. Check if you were successfully saved as trusted party for your company and save your trusted_party_id
        const parties = yield getTrustedParty(the_company_id);
        const trusted_party_id = parties.list[0].trusted_entity_id;
        console.log("Your trusted party id:", trusted_party_id);
        // 5. Create a new fund with 2 Wallets 
        const newFund = {
            name: "Funds-EarthquakeTurkiyeSyria",
            description: "Company and its employee's donations for victims of the Earthquake in Turkiye/Syria in 2023",
            custodygroup_withdraw: {
                threshold: 1,
                members: [trusted_party_id],
            },
            custodygroup_tx: {
                threshold: 1,
                members: [trusted_party_id],
            },
            wallets: [
                {
                    name: "Wallet-company donations",
                    asset: 'BTC',
                    custodygroup_withdraw: {
                        threshold: 1,
                        members: [trusted_party_id],
                    },
                    custodygroup_tx: {
                        threshold: 1,
                        members: [trusted_party_id],
                    },
                    type: 0,
                    connect: null,
                },
                {
                    name: "Wallet-employee donations",
                    asset: 'ETH',
                    custodygroup_withdraw: {
                        threshold: 1,
                        members: [trusted_party_id],
                    },
                    custodygroup_tx: {
                        threshold: 1,
                        members: [trusted_party_id],
                    },
                    type: 0,
                    connect: null,
                },
            ],
        };
        const the_fund = yield addFund(the_company_id, newFund);
        // 6. Check if the funds are created
        const funds = yield getAllFunds(the_company_id);
        console.log("Your new fund:", funds.list);
    });
}
// test_createFund_Part2() // ####################### uncomment after you're done with part 1 #######################
function getAllCompanies() {
    return __awaiter(this, void 0, void 0, function* () {
        var companySearchResponse;
        try {
            const tempRequest = yield API.CompanyApiAxiosParamCreator().companySearchGet();
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.CompanyApiFactory(new API.Configuration({
                apiKey: productionApiKey,
            })).companySearchGet("", timestamp, signature);
            companySearchResponse = response.data;
        }
        catch (error) {
            console.error(error.response);
        }
        return companySearchResponse;
    });
}
function getTrustedParty(_companyId) {
    return __awaiter(this, void 0, void 0, function* () {
        var trustedParties = {};
        try {
            const tempRequest = yield API.TrustedNetworkApiAxiosParamCreator().companyCompanyIdTrustedpartyGet(_companyId);
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.TrustedNetworkApiFactory(new API.Configuration({
                apiKey: productionApiKey
            })).companyCompanyIdTrustedpartyGet(_companyId, "", timestamp, signature);
            trustedParties = response.data;
        }
        catch (error) {
            console.error(error.response);
        }
        return trustedParties;
    });
}
function addFund(_companyId, _fund) {
    return __awaiter(this, void 0, void 0, function* () {
        var createFundResponse = {};
        try {
            const tempRequest = yield API.FundApiAxiosParamCreator().companyCompanyIdFundPost(_companyId, _fund);
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.FundApiFactory(new API.Configuration({
                apiKey: productionApiKey
            })).companyCompanyIdFundPost(_companyId, _fund, "", timestamp, signature);
            createFundResponse = response.data;
        }
        catch (error) {
            console.error(error.response);
        }
        return createFundResponse;
    });
}
function getAllFunds(companyId) {
    return __awaiter(this, void 0, void 0, function* () {
        var allFunds = {};
        try {
            const tempRequest = yield API.FundApiAxiosParamCreator().companyCompanyIdFundSearchGet(companyId);
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const signature = createSignature(timestamp, BASE_PATH + tempRequest.url, tempRequest.options.data ? tempRequest.options.data : "");
            const response = yield API.FundApiFactory(new API.Configuration({
                apiKey: productionApiKey,
            })).companyCompanyIdFundSearchGet(companyId, "", timestamp, signature);
            allFunds = response.data;
        }
        catch (error) {
            console.error(error.response);
        }
        return allFunds;
    });
}
