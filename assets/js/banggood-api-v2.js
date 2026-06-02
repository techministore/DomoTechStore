/**
 * DomoTechStore - Banggood API v2
 * ⚡ Implementación completa según especificación técnica oficial de Banggood
 * 
 * AUTENTICACIÓN: OAuth via access_token (válido 2 horas)
 * FIRMA: MD5(api_key + api_secret + noncestr + timestamp ordenados alfabéticamente)
 */

// ============================================================================
// 🔧 CONFIGURACIÓN GLOBAL
// ============================================================================

const BANGGOOD_CONFIG_V2 = {
    API_KEY: 'aff6a1a99947bda',
    API_SECRET: '7dbad72d5973308abd6b9fe65b0cc4db',
    DOMAIN: 'https://affapi.banggood.com/',
    TOKEN_DURATION: 7200000, // 2 horas en ms
    DEFAULT_LANG: 'es-ES',
    DEFAULT_CURRENCY: 'EUR',
    CACHE_DURATION: 3600000, // 1 hora
};

const BANGGOOD_ENDPOINTS = {
    GET_ACCESS_TOKEN: 'getAccessToken',
    COUPON_LIST: 'coupon/list',
    COUPON_DETAIL: 'coupon/detail',
    PRODUCT_CATEGORY: 'product/category',
    PRODUCT_LIST: 'product/list',
    NEW_PRODUCT_LIST: 'newproduct/list',
    PRODUCT_DETAIL: 'product/detail',
    COUNTRIES_LIST: 'countries/list',
    ORDER_LIST: 'order/list',
    ORDER_DETAIL: 'order/detail'
};

// ============================================================================
// 🔐 UTILITIES: MD5 Hash & Signature
// ============================================================================

/**
 * Genera firma MD5 para autenticar con Banggood
 * Algoritmo: ordena parámetros alfabéticamente, construye query string, aplica MD5
 */
class SignatureGenerator {
    static generateSignature(params, apiSecret) {
        try {
            // 1. Ordenar parámetros alfabéticamente
            const sortedKeys = Object.keys(params).sort();
            
            // 2. Construir query string
            const queryString = sortedKeys
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            // 3. Agregar api_secret al final
            const fullString = queryString + `&api_secret=${apiSecret}`;
            
            Logger.debug('[SIGNATURE] String a firmar:', fullString);
            
            // 4. Calcular MD5 (usando Web Crypto API o fallback)
            const signature = this._md5(fullString);
            
            Logger.debug('[SIGNATURE] MD5 calculado:', signature);
            return signature;
        } catch (e) {
            Logger.error('[SIGNATURE] Error generando firma:', e);
            return null;
        }
    }

    /**
     * Implementación de MD5 (versión simplificada)
     * Para producción, usa: npm install crypto-js
     */
    static _md5(str) {
        // Si está disponible crypto-js (importado externamente)
        if (typeof CryptoJS !== 'undefined' && CryptoJS.MD5) {
            return CryptoJS.MD5(str).toString();
        }

        // Fallback: hash simple (NO es MD5 real, solo para desarrollo)
        Logger.warn('[SIGNATURE] crypto-js no detectado, usando hash fallback');
        return this._simpleFallbackHash(str);
    }

    static _simpleFallbackHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}

// ============================================================================
// 🌐 CLIENTE API COMPLETO
// ============================================================================

class BanggoodAPIClient {
    constructor(apiKey, apiSecret, config = {}) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.domain = config.domain || BANGGOOD_CONFIG_V2.DOMAIN;
        
        // Token management
        this.accessToken = null;
        this.tokenExpireTime = null;
        
        // Cache
        this.cache = new Map();
        this.cacheDuration = config.cacheDuration || BANGGOOD_CONFIG_V2.CACHE_DURATION;
        
        // Default parameters
        this.defaultParams = {
            lang: config.lang || BANGGOOD_CONFIG_V2.DEFAULT_LANG,
            currency: config.currency || BANGGOOD_CONFIG_V2.DEFAULT_CURRENCY,
        };

        Logger.info('[BANGGOOD] Cliente API inicializado');
    }

    // ========================================================================
    // 🔐 AUTENTICACIÓN
    // ========================================================================

    /**
     * Obtener Access Token (paso 1 de autenticación)
     * Válido por 2 horas (7200 segundos)
     */
    async getAccessToken(force = false) {
        // Verificar si el token actual sigue siendo válido
        if (!force && this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
            Logger.debug('[AUTH] Token en caché aún válido');
            return this.accessToken;
        }

        try {
            Logger.info('[AUTH] Obteniendo nuevo access token...');

            // Parámetros requeridos
            const params = {
                api_key: this.apiKey,
                noncestr: Math.random().toString(36).substring(2, 15), // random string
                timestamp: Math.floor(Date.now() / 1000) // unix timestamp
            };

            // Generar firma
            const signature = SignatureGenerator.generateSignature(params, this.apiSecret);
            if (!signature) throw new Error('Error generando firma');

            params.signature = signature;

            // Construir URL
            const url = this._buildUrl(BANGGOOD_ENDPOINTS.GET_ACCESS_TOKEN, params);

            Logger.debug('[AUTH] URL:', url);

            // Realizar solicitud
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'DomoTechStore/2.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Validar respuesta
            if (data.code === 200 && data.result && data.result.access_token) {
                this.accessToken = data.result.access_token;
                this.tokenExpireTime = Date.now() + (data.result.expires_in * 1000);
                
                Logger.info('[AUTH] ✅ Token obtenido correctamente');
                Logger.debug('[AUTH] Expira en:', new Date(this.tokenExpireTime).toISOString());
                
                return this.accessToken;
            } else {
                Logger.error('[AUTH] Error en respuesta:', data);
                return null;
            }
        } catch (e) {
            Logger.error('[AUTH] Error:', e);
            return null;
        }
    }

    // ========================================================================
    // 🎟️ CUPONES
    // ========================================================================

    /**
     * Obtener lista de cupones disponibles
     * GET /coupon/list
     */
    async getCouponList(options = {}) {
        try {
            const params = {
                ...this.defaultParams,
                category_id: options.category_id || 0,
                type: options.type || 2, // 2 = cupones activos
                page: options.page || 1,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.COUPON_LIST, params, 'coupon_list');
        } catch (e) {
            Logger.error('[COUPONS] getCouponList error:', e);
            return null;
        }
    }

    /**
     * Obtener detalles de un cupón específico
     * GET /coupon/detail
     */
    async getCouponDetail(couponCode, options = {}) {
        try {
            if (!couponCode) throw new Error('coupon_code es obligatorio');

            const params = {
                ...this.defaultParams,
                coupon_code: couponCode,
                ...options
            };

            const result = await this._request(BANGGOOD_ENDPOINTS.COUPON_DETAIL, params);
            return result?.data || result;
        } catch (e) {
            Logger.error('[COUPONS] getCouponDetail error:', e);
            return null;
        }
    }

    // ========================================================================
    // 📂 CATEGORÍAS
    // ========================================================================

    /**
     * Obtener lista de categorías de productos
     * GET /product/category
     */
    async getProductCategory(options = {}) {
        try {
            const params = {
                ...this.defaultParams,
                category_id: options.category_id || null,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.PRODUCT_CATEGORY, params, 'category_list');
        } catch (e) {
            Logger.error('[CATEGORIES] getProductCategory error:', e);
            return null;
        }
    }

    // ========================================================================
    // 🛍️ PRODUCTOS
    // ========================================================================

    /**
     * Obtener lista de productos por categoría
     * GET /product/list
     */
    async getProductList(options = {}) {
        try {
            const params = {
                ...this.defaultParams,
                category_id: options.category_id,
                keyword: options.keyword || null,
                page: options.page || 1,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.PRODUCT_LIST, params, 'product_list');
        } catch (e) {
            Logger.error('[PRODUCTS] getProductList error:', e);
            return null;
        }
    }

    /**
     * Obtener lista de productos nuevos
     * GET /newproduct/list
     */
    async getNewProductList(options = {}) {
        try {
            const params = {
                ...this.defaultParams,
                launch_time: options.launch_time || null,
                warehouse: options.warehouse || null,
                page: options.page || 1,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.NEW_PRODUCT_LIST, params, 'product_list');
        } catch (e) {
            Logger.error('[PRODUCTS] getNewProductList error:', e);
            return null;
        }
    }

    /**
     * Obtener detalles de un producto específico
     * GET /product/detail
     */
    async getProductDetail(productId, options = {}) {
        try {
            if (!productId) throw new Error('product_id es obligatorio');

            const params = {
                ...this.defaultParams,
                product_id: productId,
                ...options
            };

            const result = await this._request(BANGGOOD_ENDPOINTS.PRODUCT_DETAIL, params);
            return result?.data || result;
        } catch (e) {
            Logger.error('[PRODUCTS] getProductDetail error:', e);
            return null;
        }
    }

    // ========================================================================
    // 🌍 PAÍSES
    // ========================================================================

    /**
     * Obtener lista de países disponibles
     * GET /countries/list
     */
    async getCountriesList(options = {}) {
        try {
            const params = {
                lang: options.lang || this.defaultParams.lang,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.COUNTRIES_LIST, params, 'country_list');
        } catch (e) {
            Logger.error('[COUNTRIES] getCountriesList error:', e);
            return null;
        }
    }

    // ========================================================================
    // 📦 ÓRDENES (Affiliate)
    // ========================================================================

    /**
     * Obtener lista de órdenes del afiliado
     * GET /order/list
     */
    async getOrderList(options = {}) {
        try {
            const params = {
                page: options.page || 1,
                start_date: options.start_date || null,
                end_date: options.end_date || null,
                ...options
            };

            return await this._request(BANGGOOD_ENDPOINTS.ORDER_LIST, params, 'order_list');
        } catch (e) {
            Logger.error('[ORDERS] getOrderList error:', e);
            return null;
        }
    }

    /**
     * Obtener detalles de una orden específica
     * GET /order/detail
     */
    async getOrderDetail(orderId, options = {}) {
        try {
            if (!orderId) throw new Error('order_id es obligatorio');

            const params = {
                order_id: orderId,
                ...options
            };

            const result = await this._request(BANGGOOD_ENDPOINTS.ORDER_DETAIL, params);
            return result?.data || result;
        } catch (e) {
            Logger.error('[ORDERS] getOrderDetail error:', e);
            return null;
        }
    }

    // ========================================================================
    // 🔧 MÉTODOS INTERNOS
    // ========================================================================

    /**
     * Realizar solicitud autenticada a la API
     */
    async _request(endpoint, params, dataKey = null) {
        try {
            // Obtener token si es necesario
            if (!this.accessToken) {
                const token = await this.getAccessToken();
                if (!token) throw new Error('No se pudo obtener access token');
            }

            // Limpiar parámetros (eliminar null/undefined)
            const cleanParams = Object.entries(params)
                .filter(([_, v]) => v !== null && v !== undefined)
                .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});

            // Construir URL
            const url = this._buildUrl(endpoint, cleanParams);

            Logger.debug(`[API] ${endpoint}`, cleanParams);

            // Realizar solicitud
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'access-token': this.accessToken,
                    'User-Agent': 'DomoTechStore/2.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Validar respuesta
            if (data.code === 0 || data.code === 200) {
                const result = dataKey ? data.data?.[dataKey] : data.data;
                Logger.info(`[API] ✅ ${endpoint}: ${Array.isArray(result) ? result.length : 1} elementos`);
                return result;
            } else {
                Logger.warn(`[API] Respuesta no exitosa:`, data);
                return null;
            }
        } catch (e) {
            Logger.error(`[API] ${endpoint} error:`, e);
            return null;
        }
    }

    /**
     * Construir URL con parámetros
     */
    _buildUrl(endpoint, params) {
        const queryString = Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');

        return `${this.domain}${endpoint}?${queryString}`;
    }

    /**
     * Limpiar caché
     */
    clearCache() {
        this.cache.clear();
        Logger.info('[CACHE] Caché limpiado');
    }

    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            tokenValid: !!this.accessToken && Date.now() < this.tokenExpireTime,
            tokenExpireTime: this.tokenExpireTime ? new Date(this.tokenExpireTime).toISOString() : null,
            cacheSize: this.cache.size,
            apiKey: this.apiKey.substring(0, 5) + '...',
        };
    }
}

// ============================================================================
// 🌐 INSTANCIA GLOBAL
// ============================================================================

const banggoodAPI = new BanggoodAPIClient(
    BANGGOOD_CONFIG_V2.API_KEY,
    BANGGOOD_CONFIG_V2.API_SECRET,
    {
        lang: 'es-ES',
        currency: 'EUR'
    }
);

// ============================================================================
// 🎯 FUNCIONES HELPER
// ============================================================================

/**
 * Buscar productos por palabra clave
 */
async function searchBanggoodProducts(keyword, options = {}) {
    try {
        Logger.info(`[SEARCH] Buscando: "${keyword}"`);
        
        const results = await banggoodAPI.getProductList({
            keyword: keyword,
            category_id: options.category_id || 0,
            page: options.page || 1,
            ...options
        });

        return results || [];
    } catch (e) {
        Logger.error('[SEARCH] Error:', e);
        return [];
    }
}

/**
 * Obtener ofertas especiales (cupones + productos con descuento)
 */
async function getBanggoodSpecialOffers(options = {}) {
    try {
        const coupons = await banggoodAPI.getCouponList(options);
        const products = await banggoodAPI.getProductList({
            ...options,
            keyword: 'discount'
        });

        return {
            coupons: coupons || [],
            products: products || []
        };
    } catch (e) {
        Logger.error('[OFFERS] Error:', e);
        return { coupons: [], products: [] };
    }
}

/**
 * Normalizar producto para renderizado
 */
function normalizeBanggoodProduct(product) {
    return {
        id: product.product_id || product.id,
        title: product.product_name || product.name,
        price: parseFloat(product.product_price || product.price || 0),
        couponPrice: parseFloat(product.product_coupon_price || product.price || 0),
        image: product.product_image || product.image_url || product.thumbnail,
        url: product.product_url || product.url,
        promoLink: product.promo_link_short,
        brandName: product.brand_name,
        categoryName: product.catergory_name || product.category_name,
        rating: product.rating || 0,
        sales: product.sales || 0,
        commission: product.commission || 0,
        warehouse: product.warehouse,
        timestamp: Date.now()
    };
}

// ============================================================================
// 🌐 EXPORTAR A VENTANA GLOBAL
// ============================================================================

window.banggoodAPI = banggoodAPI;
window.searchBanggoodProducts = searchBanggoodProducts;
window.getBanggoodSpecialOffers = getBanggoodSpecialOffers;
window.normalizeBanggoodProduct = normalizeBanggoodProduct;
window.SignatureGenerator = SignatureGenerator;

Logger.info('✅ Banggood API v2 Module Loaded - Ready for production');
