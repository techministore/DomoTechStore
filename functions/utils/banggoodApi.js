/**
 * Cliente para la API de Banggood
 * Banggood NO requiere firma HMAC - mucho más simple que AliExpress
 */

export async function callBanggoodApi(keyword, env) {
    const APP_KEY = env.BANGGOOD_APP_KEY;
    const APP_SECRET = env.BANGGOOD_APP_SECRET;

    if (!APP_KEY || !APP_SECRET) {
        console.warn('[BANGGOOD] Credenciales no configuradas. Usando fallback.');
        return { data: [], error: 'No credentials' };
    }

    const API_URL = "https://api.banggood.com/api/search";

    try {
        const params = new URLSearchParams({
            app_key: APP_KEY,
            keywords: keyword.trim(),
            page: 1,
            page_size: 20,
            language: 'en'
        });

        const endpoint = `${API_URL}?${params.toString()}`;
        
        console.log('[BANGGOOD API] Llamando a:', endpoint);

        // Timeout con AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DomoTechStore/1.0'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Banggood API returned ${response.status}`);
        }

        const data = await response.json();
        
        console.log('[BANGGOOD API] Respuesta recibida:', data.data ? data.data.length : data.items ? data.items.length : 0, 'items');
        
        return data || { data: [] };

    } catch (error) {
        console.error('[BANGGOOD API] Error:', error.message);
        
        // Fallback: búsqueda alternativa
        try {
            return await fallbackBanggoodSearch(keyword);
        } catch (fallbackErr) {
            console.error('[BANGGOOD FALLBACK] Error:', fallbackErr.message);
            return { data: [], error: error.message };
        }
    }
}

/**
 * Búsqueda alternativa si la API principal falla
 * Puede ser reemplazada por un scraper o API diferente
 */
async function fallbackBanggoodSearch(keyword) {
    console.log('[BANGGOOD] Intentando búsqueda alternativa para:', keyword);
    
    // Por ahora retorna array vacío
    // En producción, podrías implementar:
    // - Scraping ligero
    // - API alternativa
    // - BD local de productos Banggood
    
    return {
        data: [],
        source: 'fallback',
        note: 'Banggood API no disponible, configure BANGGOOD_APP_KEY y BANGGOOD_APP_SECRET'
    };
}

/**
 * Genera enlace de afiliado para Banggood
 * @param {string} productId - ID del producto
 * @param {object} env - Variables de entorno
 * @returns {string} URL de afiliado
 */
export function generateBanggoodAffiliateLink(productId, env) {
    const AFFILIATE_ID = env.BANGGOOD_AFFILIATE_ID || '';
    const baseUrl = `https://www.banggood.com/`;
    
    if (AFFILIATE_ID) {
        return `${baseUrl}${productId}?rmmds=search&cur_warehouse=CN&affid=${AFFILIATE_ID}`;
    }
    
    return `${baseUrl}${productId}?rmmds=search&cur_warehouse=CN`;
}
