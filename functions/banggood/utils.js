import CryptoJS from "crypto-js";

export function signBanggoodRequest(params, appSecret) {
    const sortedKeys = Object.keys(params).sort();
    let signString = "";
    sortedKeys.forEach(key => {
        signString += key + params[key];
    });
    return CryptoJS.MD5(appSecret + signString + appSecret).toString();
}

export async function fetchBanggoodAPI(params, appKey, appSecret) {
    const sign = signBanggoodRequest(params, appSecret);
    const query = new URLSearchParams({
        ...params,
        sign
    });
    const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;
    const response = await fetch(apiUrl);
    return response.json();
}
