//libraries
import * as API from "./api";
const { readFileSync } = require("fs");
const { sign, verify } = require("crypto");
const dotenv = require('dotenv');
dotenv.config();

//global variables
const sondboxApiKey: string = process.env.API_KEY!;
const BASE_PATH = "https://api.qredo.network/api/v1/p";

//-----------------------------------Basic API Request------------------------------------
async function test() {
  let assets = await getAssets();
  console.log(assets);
}
test()

function createSignature(_timestamp: string, _uri: string, _body: string): string {
  // signing the request using the private key and request content
  const privateKey = readFileSync("supporting-files/private.pem");
  const content = Buffer.from(_timestamp + _uri + _body);
  const signature = sign("RSA-SHA256", content, privateKey).toString("base64url");
  return signature;
}

async function getAssets(): Promise<API.Assets> {
  let assets: API.Assets = {};
  try {
    // 1. Sign your request
    const tempRequest = await API.CommonApiAxiosParamCreator().assetsGet();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );

    // 2. Make the request using your API key
    const response = await API.CommonApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey,
      })
    ).assetsGet("", timestamp, signature);
    assets = response.data;
  } catch (error: any) {
    console.error(error.response);
  }
  return assets;
}

//----------------------------------Creating wallets using the API----------------------------------

//In the first part we will create a company and we will register ourselves as a trusted party of this company.
async function test_createFund_Part1() {
  // 1. Create a new company "Bla Company" to hold your funds
  const the_company = await addCompany("Bla Company", "bla", "Cologne", "Germany")
  const the_company_id = the_company?.company_id!

  // 2. Give your email address to register as a trusted party for your company
  await addTrustedParty(the_company_id, {address: "achelia200@gmail.com"})

  // 3. Approve the request in your mobile app.
}

test_createFund_Part1() //####################### comment this after executing part 1 #######################

async function addCompany(_name: string, _domain: string, _city: string, _country: string): Promise<API.CreateCompanyResponse | undefined> {
  var createCompanyResponse: API.CreateCompanyResponse | undefined =
    undefined;
  try {
    const company: API.Company = {
      name: _name,
      city: _city,
      country: _country,
      domain: _domain
    };
    const tempRequest = await API.CompanyApiAxiosParamCreator().companyPost(
      company
    );
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );

    const response = await API.CompanyApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey,
      })
    ).companyPost(company, "", timestamp, signature);

    createCompanyResponse = response.data;
    console.log(createCompanyResponse)
  } catch (error: any) {
    console.error(error.response);
  }
  return createCompanyResponse;
}

async function addTrustedParty(_companyId: string, _trustedPartyNew: API.TrustedPartyNew): Promise<API.OkResponse> {
  var okResponse: API.OkResponse = {};
  try {
    const tempRequest =
      await API.TrustedNetworkApiAxiosParamCreator().companyCompanyIdTrustedpartyPost(
        _companyId,
        _trustedPartyNew
      );
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );

    const response = await API.TrustedNetworkApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey
      })
    ).companyCompanyIdTrustedpartyPost(
      _companyId,
      _trustedPartyNew,
      "",
      timestamp,
      signature
    );
    okResponse = response.data;
    console.log("okResponse", okResponse)
  } catch (error: any) {
    console.error(error.response);
  }
  return okResponse;
}

//In the second part we will create a fund with 2 wallets.
async function test_createFund_Part2() {
  // 5. Get the company_id
  const companies = await getAllCompanies();
  const the_company_id = companies?.matches?.find(c=>c.domain=='bla')?.company_id!
  
  // 4. Check if you were successfully saved as trusted party for your company and save your trusted_party_id
  const parties = await getTrustedParty(the_company_id!)
  const trusted_party_id = parties.list[0].trusted_entity_id
  console.log("Your trusted party id:", trusted_party_id);

  // 5. Create a new fund with 2 Wallets 
  const newFund: API.Fund = {
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
  }
  const the_fund = await addFund(the_company_id, newFund);

  // 6. Check if the funds are created
  const funds = await getAllFunds(the_company_id)
  console.log("Your new fund:", funds.list)
}

// test_createFund_Part2() // ####################### uncomment after you're done with part 1 #######################

async function getAllCompanies(): Promise<API.CompanySearchResponse | undefined> {
  var companySearchResponse: API.CompanySearchResponse | undefined;
  try {
    const tempRequest =
      await API.CompanyApiAxiosParamCreator().companySearchGet();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );

    const response = await API.CompanyApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey,
      })
    ).companySearchGet("", timestamp, signature);

    companySearchResponse = response.data;
  } catch (error: any) {
    console.error(error.response);
  }
  return companySearchResponse;
}

async function getTrustedParty(_companyId: string): Promise<API.TrustedPartyList> {
  var trustedParties: API.TrustedPartyList = {};
  try {
    const tempRequest =
      await API.TrustedNetworkApiAxiosParamCreator().companyCompanyIdTrustedpartyGet(
        _companyId
      );
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );
    const response = await API.TrustedNetworkApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey
      })
    ).companyCompanyIdTrustedpartyGet(_companyId, "", timestamp, signature);

    trustedParties = response.data;
  } catch (error: any) {
    console.error(error.response);
  }
  return trustedParties;
}

async function addFund(_companyId: string, _fund: API.Fund): Promise<API.CreateFundResponse> {
  var createFundResponse: API.CreateFundResponse = {};
  try {
    const tempRequest =
      await API.FundApiAxiosParamCreator().companyCompanyIdFundPost(
        _companyId,
        _fund
      );
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createSignature(
      timestamp,
      BASE_PATH + tempRequest.url,
      tempRequest.options.data ? tempRequest.options.data : ""
    );

    const response = await API.FundApiFactory(
      new API.Configuration({
        apiKey: sondboxApiKey
      })
    ).companyCompanyIdFundPost(_companyId, _fund, "", timestamp, signature);
    createFundResponse = response.data;
  } catch (error: any) {
    console.error(error.response);
  }
  return createFundResponse;
}

async function getAllFunds(companyId: string) : Promise<API.FundSearchResult> {
    var allFunds: API.FundSearchResult = {};
    try {
      const tempRequest =
        await API.FundApiAxiosParamCreator().companyCompanyIdFundSearchGet(
          companyId
        );
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = createSignature(
        timestamp,
        BASE_PATH + tempRequest.url,
        tempRequest.options.data ? tempRequest.options.data : ""
      );

      const response = await API.FundApiFactory(
        new API.Configuration({
          apiKey: sondboxApiKey,
        })
      ).companyCompanyIdFundSearchGet(
        companyId,
        "",
        timestamp,
        signature
      );
      allFunds = response.data;
    } catch (error: any) {
      console.error(error.response);
    }
    return allFunds;
}