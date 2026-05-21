/**
 * Firma SOLO los parámetros comunes usando HMAC-SHA256
 * CRÍTICO: Esta es la regla de AliExpress IOP 2024-2026
 * 
 * @param {Object} params - Parámetros comunes (sin business params)
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

    const API_URL = 'https://api-sg.aliexpress.com/sync/portal/affiliate/product/query';
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

    // 2. Firmar SOLO los parámetros comunes (NO incluir businessParams)
    const sign = await signRequest(commonParams, APP_SECRET);

    // 3. Construir el body como JSON
    const body = JSON.stringify({
        biz_param: businessParams,
        ...commonParams,
        sign
    });

    console.log('[ALIEXPRESS] URL:', API_URL);
    console.log('[ALIEXPRESS] Parámetros firmados:', Object.keys(commonParams).sort());
    console.log('[ALIEXPRESS] Firma:', sign.substring(0, 16) + '...');

    // 4. Petición POST con timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
