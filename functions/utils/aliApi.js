// AliExpress Portals API – Firma correcta 2026

export async function signRequest(params, secret) {
    // Ordenar TODOS los parámetros excepto "sign"
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

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("Faltan ALI_APP_KEY o ALI_APP_SECRET.");
    }

    const API_URL = "https://api-sg.aliexpress.com/sync/portal/affiliate";

    const timestamp = Date.now().toString();

    // 1) Parámetros comunes
    const commonParams = {
        app_key: APP_KEY,
        format: "json",
        method,
        sign_method: "sha256",
        timestamp,
        v: "2.0"
    };

    // 2) Unir TODOS los parámetros (comunes + business)
    const allParams = { ...commonParams, ...businessParams };

    // 3) Firmar TODOS los parámetros
    const sign = await signRequest(allParams, APP_SECRET);

    // 4) Construir body x-www-form-urlencoded
    const bodyParts = [];

    for (const key of Object.keys(allParams)) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`);
    }

    bodyParts.push(`sign=${sign}`);

    const body = bodyParts.join("&");

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    return await response.json();
}

