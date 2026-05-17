// redeploy 18/05/2026
/**
 * Firma los parámetros (Regla de Portals: Solo se firman los parámetros comunes ordenados)
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
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("Faltan las credenciales ALI_APP_KEY o ALI_APP_SECRET.");
    }

    const API_URL = "https://api-sg.aliexpress.com/sync/portal/affiliate";
    
    // AliExpress Portals (IOP) exige el timestamp en milisegundos (UNIX string)
    const timestamp = Date.now().toString();

    // 1) Parámetros comunes obligatorios
    const commonParams = {
        app_key: APP_KEY,
        format: "json",
        method: method,
        sign_method: "sha256",
        timestamp: timestamp,
        v: "2.0"
    };

    // 2) Firmar SOLO los parámetros comunes (Regla de oro de Portals)
    const sign = await signRequest(commonParams, APP_SECRET);

    // 3) Construir el body en el orden correcto:
    //    1. commonParams (ordenados)
    //    2. businessParams (SIN ordenar)
    //    3. sign (al final)
    const bodyParts = [];

    // 1. commonParams ordenados
    const sortedCommonKeys = Object.keys(commonParams).sort();
    for (const key of sortedCommonKeys) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(commonParams[key])}`);
    }

    // 2. businessParams SIN ordenar (en su orden original)
    for (const key of Object.keys(businessParams)) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(businessParams[key])}`);
    }

    // 3. sign al final
    bodyParts.push(`sign=${encodeURIComponent(sign)}`);

    const body = bodyParts.join("&");

    // 5) Petición POST con x-www-form-urlencoded
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded" 
        },
        body
    });

    return await response.json();
}
