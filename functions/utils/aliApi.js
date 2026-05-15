export async function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let basestring = "";

    for (const key of sortedKeys) {
        basestring += key + params[key];
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(basestring);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    const API_URL = "https://api-sg.aliexpress.com/sync/portal/affiliate";

    const commonParams = {
        app_key: APP_KEY,
        timestamp: Date.now().toString(),
        format: "json",
        v: "2.0",
        sign_method: "sha256",
        method
    };

    // Firmar SOLO commonParams
    const sign = await signRequest(commonParams, APP_SECRET);

    // Construir querystring con commonParams + sign + businessParams
    const allParams = { ...commonParams, ...businessParams, sign };
    const queryString = new URLSearchParams(allParams).toString();

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: queryString
    });

    return await response.json();
}
