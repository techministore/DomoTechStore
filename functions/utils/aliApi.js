/**
 * Firma SOLO los parámetros comunes (obligatorio en AliExpress IOP)
 */
export async function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let basestring = '';

    for (const key of sortedKeys) {
        basestring += key + params[key];
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(basestring);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Versión CORRECTA de callAliExpressApi() para AliExpress Portals
 * - POST obligatorio
 * - Content-Type: application/x-www-form-urlencoded
 * - TODO en el body (common + business + sign)
 * - NADA en la URL (querystring)
 * - NADA de JSON
 * - Firma SOLO de commonParams
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("Faltan las credenciales ALI_APP_KEY o ALI_APP_SECRET.");
    }

    const API_URL = "https://api-sg.aliexpress.com/sync/portal/affiliate";

    const commonParams = {
        app_key: APP_KEY,
        timestamp: Date.now().toString(),
        format: "json",
        v: "2.0",
        sign_method: "sha256",
        method
    };

    // 1) Firmar SOLO commonParams
    const sign = await signRequest(commonParams, APP_SECRET);

    // 2) Construir body con TODOS los parámetros (common + business + sign)
    const allParams = { ...commonParams, ...businessParams, sign };

    // 3) Convertir a formato x-www-form-urlencoded
    const body = new URLSearchParams(allParams).toString();

    // 4) Petición POST con todo en el body y sin parámetros en URL
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded" 
        },
        body
    });

    return await response.json();
}
