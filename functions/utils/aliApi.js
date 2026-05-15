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
 * Llamada correcta a la API oficial de AliExpress (Portals)
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error("Faltan ALI_APP_KEY o ALI_APP_SECRET.");
    }

    const API_URL = "https://api-sg.aliexpress.com/sync/portal";

    // SOLO parámetros comunes
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

    // Construir query con commonParams + sign
    const queryParams = new URLSearchParams({ ...commonParams, sign }).toString();

    // Enviar businessParams en el cuerpo POST
    const response = await fetch(`${API_URL}?${queryParams}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessParams)
    });

    return await response.json();
}
