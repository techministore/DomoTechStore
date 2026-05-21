/**
 * Firma TODOS los parámetros (common + business) usando HMAC-SHA256
 * CRÍTICO: Esta es la regla de AliExpress IOP 2024-2026
 * 
 * @param {Object} params - Todos los parámetros (common + business)
 * @param {string} secret - APP_SECRET de AliExpress
 * @returns {Promise<string>} Firma en formato hexadecimal mayúscula
 */
export async function signRequest(params, secret) {
    if (!params || typeof params !== 'object') {
        throw new Error('signRequest: params debe ser un objeto');
    }
    if (!secret || typeof secret !== 'string') {
        throw new Error('signRequest: secret debe ser una cadena no vacía');
    }

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

    // 4. Firmar y convertir a hexadecimal mayúscula
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Llama a la API de AliExpress IOP adaptado a Cloudflare Pages Functions
 * 
 * @param {string} method - Método de API (ej: 'aliexpress.affiliate.product.query')
 * @param {Object} businessParams - Parámetros de negocio (keyword, page_size, etc.)
 * @param {Object} env - Variables de entorno (ALI_APP_KEY, ALI_APP_SECRET)
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function callAliExpressApi(method, businessParams, env) {
    const APP_KEY = env.ALI_APP_KEY;
    const APP_SECRET = env.ALI_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        throw new Error('Faltan las credenciales ALI_APP_KEY o ALI_APP_SECRET en el entorno.');
    }

    const API_URL = 'https://api-sg.aliexpress.com/sync/portal/affiliate';
    const timestamp = Date.now().toString();

    // 1. Parámetros comunes obligatorios
    const commonParams = {
        app_key: APP_KEY,
        format: 'json',
        method: method,
        sign_method: 'sha256',
        timestamp: timestamp,
        v: '2.0'
    };

    // 2. Combinar TODOS los parámetros (common + business)
    const allParams = { ...commonParams, ...businessParams };

    // 3. Firmar TODOS los parámetros
    const sign = await signRequest(allParams, APP_SECRET);

    // 4. Construir el body en orden:
    //    1. Parámetros comunes ordenados
    //    2. Parámetros de negocio (sin reordenar)
    //    3. Firma al final
    const bodyParts = [];

    // Parámetros comunes ordenados
    const sortedCommonKeys = Object.keys(commonParams).sort();
    for (const key of sortedCommonKeys) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(commonParams[key])}`);
    }

    // Parámetros de negocio (sin reordenar)
    for (const key of Object.keys(businessParams)) {
        bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(businessParams[key])}`);
    }

    // Firma al final
    bodyParts.push(`sign=${encodeURIComponent(sign)}`);
    const body = bodyParts.join('&');

    console.log('[ALIEXPRESS] URL:', API_URL);
    console.log('[ALIEXPRESS] Parámetros firmados:', Object.keys(allParams).sort());
    console.log('[ALIEXPRESS] Firma:', sign.substring(0, 16) + '...');

    // 5. Petición POST con timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body,
            signal: controller.signal
        });

        const text = await response.text();
        try {
            const jsonResponse = JSON.parse(text);
            console.log('[ALIEXPRESS] Respuesta recibida:', jsonResponse.error_response ? 'ERROR' : 'OK');
            return jsonResponse;
        } catch (parseError) {
            console.error('[ALIEXPRESS] Respuesta no es JSON:', text.substring(0, 200));
            return {
                error_response: {
                    msg: 'Respuesta de la API no válida',
                    code: response.status,
                    raw: text.substring(0, 200)
                }
            };
        }
    } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
            console.error('[ALIEXPRESS] Timeout (30s): Conexión lenta o API no responde');
            return {
                error_response: {
                    msg: 'Timeout al conectar con AliExpress (30s)',
                    code: 'TIMEOUT'
                }
            };
        }
        console.error('[ALIEXPRESS] Error de fetch:', fetchError.message);
        return {
            error_response: {
                msg: 'Error de red al conectar con AliExpress',
                details: fetchError.message
            }
        };
    } finally {
        clearTimeout(timeout);
    }
}
