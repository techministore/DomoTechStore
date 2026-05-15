/**
 * Utilidad para firmar peticiones a la API oficial de AliExpress (IOP)
 * Basado en la documentación oficial de AliExpress Portals
 */

export async function signRequest(params, secret) {
    // 1. Ordenar parámetros alfabéticamente
    const sortedKeys = Object.keys(params).sort();
    
    // 2. Concatenar claves y valores
    let basestring = '';
    for (const key of sortedKeys) {
        basestring += key + params[key];
    }
    
    // 3. HMAC-SHA256 (En Cloudflare Workers usamos Web Crypto API)
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
    
    // 4. Convertir a Hexadecimal y Mayúsculas
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    return hashHex;
}

/**
 * Realiza una llamada a la API oficial de AliExpress
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("Faltan las credenciales ALI_APP_KEY o ALI_APP_SECRET en las variables de entorno.");
    }

    const API_URL = "https://api-sg.aliexpress.com/sync";

    const commonParams = {
        app_key: APP_KEY,
        timestamp: Date.now().toString(),
        format: 'json',
        v: '2.0',
        sign_method: 'sha256',
        method: method
    };

    const allParams = { ...commonParams, ...businessParams };
    const sign = await signRequest(allParams, APP_SECRET);
    
    const queryParams = new URLSearchParams({ ...allParams, sign }).toString();
    
    try {
        const response = await fetch(`${API_URL}?${queryParams}`);
        return await response.json();
    } catch (error) {
        console.error(`Error llamando a AliExpress API (${method}):`, error);
        throw error;
    }
}
