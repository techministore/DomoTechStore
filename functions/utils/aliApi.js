/**
 * Firma los parámetros (soporta objeto o string directo)
 */
export async function signRequest(paramsOrString, secret) {
    let basestring = '';
    
    if (typeof paramsOrString === 'string') {
        basestring = paramsOrString;
    } else {
        const sortedKeys = Object.keys(paramsOrString).sort();
        for (const key of sortedKeys) {
            basestring += key + paramsOrString[key];
        }
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
    
    // Formato de fecha requerido por AliExpress: yyyy-MM-dd HH:mm:ss
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // 1) Parámetros comunes obligatorios
    const commonParams = {
        app_key: APP_KEY,
        format: "json",
        method: method,
        sign_method: "sha256",
        timestamp: timestamp,
        v: "2.0"
    };

    // 2) Construir basestring (para la firma) y bodyParts (para el envío)
    // Regla de Portals: Solo se ordenan los comunes, los de negocio van después en su orden original
    let basestring = "";
    const bodyParts = [];

    // 1. commonParams ordenados
    const sortedCommonKeys = Object.keys(commonParams).sort();
    for (const key of sortedCommonKeys) {
        const value = commonParams[key];
        basestring += key + value;
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    // 2. businessParams SIN ordenar (en su orden de inserción)
    for (const key of Object.keys(businessParams)) {
        const value = businessParams[key];
        basestring += key + value;
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    // 3) Generar la firma usando la basestring completa
    const sign = await signRequest(basestring, APP_SECRET);

    // 4) Añadir la firma al final
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
