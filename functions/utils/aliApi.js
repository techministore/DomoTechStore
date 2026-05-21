/**
 * Firma SOLO los parámetros comunes usando HMAC-SHA256
 * Regla de oro de AliExpress Portals IOP
 */
export async function signRequest(params, secret) {
    if (!params || typeof params !== 'object') throw new Error('signRequest: params debe ser un objeto');
    if (!secret) throw new Error('signRequest: secret es obligatorio');

    // 1. Ordenar todas las claves alfabéticamente
    const sortedKeys = Object.keys(params).sort();
    let basestring = '';

    // 2. Concatenar key + value (SIN codificar)
    for (const key of sortedKeys) {
        basestring += key + params[key];
    }

    // 3. Crear HMAC-SHA256
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
 * Llama a la API de AliExpress IOP adaptado a Cloudflare Pages Functions
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error('Faltan credenciales ALI_APP_KEY o ALI_APP_SECRET.');
    }

    const API_URL = 'https://api-sg.aliexpress.com/sync/portal/affiliate';
    const timestamp = Date.now().toString();

    // 1) Parámetros comunes obligatorios para la firma
    const commonParams = {
        app_key: APP_KEY,
        format: 'json',
        method: method,
        sign_method: 'sha256',
        timestamp: timestamp,
        v: '2.0'
    };

    // 2) Firmar SOLO los parámetros comunes
    const sign = await signRequest(commonParams, APP_SECRET);

    // 3) Construir el body en el orden correcto (x-www-form-urlencoded)
    //    1. commonParams (ordenados)
    //    2. businessParams (SIN reordenar)
    //    3. sign (al final)
    const bodyParts = [];

    // 1. commonParams ordenados
    const sortedCommonKeys = Object.keys(commonParams).sort();
    for (const key of sortedCommonKeys) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(commonParams[key])}`);
    }

    // 2. businessParams SIN ordenar (en su orden original)
    // Según la "Regla de Oro" de Portals: se añaden al body después de los comunes
    for (const key of Object.keys(businessParams)) {
        const value = typeof businessParams[key] === 'object' 
            ? JSON.stringify(businessParams[key]) 
            : businessParams[key];
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }

    // 3. sign al final
    bodyParts.push(`sign=${encodeURIComponent(sign)}`);

    const body = bodyParts.join('&');

    // 4) Petición POST
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error('[ALIEXPRESS] Error parseando JSON:', text.substring(0, 500));
            return { 
                error_response: { 
                    msg: 'Respuesta de la API no válida', 
                    code: response.status,
                    raw: text.substring(0, 200) 
                } 
            };
        }
    } catch (fetchError) {
        console.error('[ALIEXPRESS] Error de red:', fetchError);
        return { 
            error_response: { 
                msg: 'Error de red al conectar con AliExpress', 
                details: fetchError.message 
            } 
        };
    }
}