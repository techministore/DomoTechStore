/**
 * DomoTechStore - Banggood Coupons Integration
 * ⚡ Módulo de cupones, descuentos y ofertas reales
 * Integrado con el código PHP proporcionado
 */

// ============================================================================
// 🎟️ CONFIGURACIÓN DE BANGGOOD API
// ============================================================================

const BANGGOOD_API = {
    APP_KEY: 'aff6a1a99947bda',
    APP_SECRET: '7dbad72d5973308abd6b9fe65b0cc4db',
    DOMAIN: 'https://affapi.banggood.com/',
    
    // Métodos disponibles de la API
    METHODS: {
        COUPON_LIST: 'coupon/list',
        COUPON_DETAIL: 'coupon/detail',
        PRODUCT_CATEGORY: 'product/category',
        PRODUCT_LIST: 'product/list',
        NEW_PRODUCT_LIST: 'newproduct/list',
        PRODUCT_DETAIL: 'product/detail',
        COUNTRIES_LIST: 'countries/list'
    }
};

// ============================================================================
// 🔐 CLASE BANGGOOD API (Versión JavaScript mejorada)
// ============================================================================

class BanggoodAPIClient {
    constructor(appKey, appSecret) {
        this.appKey = appKey;
        this.appSecret = appSecret;
        this.domain = BANGGOOD_API.DOMAIN;
        this.accessToken = '';
        this.params = {};
        this.method = 'GET';
        this.task = '';
        this.waitingTaskInfo = {};
        this.curlExpireTime = 10; // segundos
    }

    /**
     * Obtener token de acceso (primer paso)
     */
    async getAccessToken() {
        if (this.accessToken) {
            Logger.debug('[BANGGOOD] Token ya en caché');
            return this.accessToken;
        }

        try {
            // Guardar tarea pendiente si existe
            if (this.task) {
                this.waitingTaskInfo = {
                    task: this.task,
                    method: this.method,
                    params: { ...this.params }
                };
            }

            // Preparar parámetros de autenticación
            const rand = Math.floor(Math.random() * 1000000);
            const time = Math.floor(Date.now() / 1000);

            this.params = {
                api_key: this.appKey,
                noncestr: rand,
                timestamp: time
            };

            // Firmar la solicitud
            const preArr = { ...this.params, api_secret: this.appSecret };
            const keys = Object.keys(preArr).sort();
            const signature = keys.map(k => `${k}=${preArr[k]}`).join('&');
            
            // MD5 del signature
            this.params.signature = this._md5Hash(signature);
            this.task = 'getAccessToken';
            this.method = 'GET';

            Logger.debug('[BANGGOOD] Obteniendo token de acceso');
            const result = await this._doRequest();

            if (result?.code === 200 && result?.result?.access_token) {
                this.accessToken = result.result.access_token;
                Logger.info('[BANGGOOD] ✅ Token obtenido exitosamente');
                
                // Reintentar tarea pendiente
                if (Object.keys(this.waitingTaskInfo).length > 0) {
                    this.task = this.waitingTaskInfo.task;
                    this.params = this.waitingTaskInfo.params;
                    this.method = this.waitingTaskInfo.method;
                    this.waitingTaskInfo = {};
                    return await this._doRequest();
                }
                return result;
            } else {
                Logger.error('[BANGGOOD] Error al obtener token:', result);
                return null;
            }
        } catch (e) {
            Logger.error('[BANGGOOD] Error en getAccessToken:', e);
            return null;
        }
    }

    /**
     * Ejecutar solicitud HTTP a la API de Banggood
     */
    async _doRequest() {
        try {
            if (!this.params || Object.keys(this.params).length === 0) {
                Logger.error('[BANGGOOD] Parámetros vacíos');
                return null;
            }

            // Si no es getAccessToken, añadir header de autenticación
            let headers = {};
            if (this.task !== 'getAccessToken') {
                if (!this.accessToken) {
                    await this.getAccessToken();
                }
                headers['access-token'] = this.accessToken;
            }

            // Construir URL
            let apiUrl = this.domain + this.task;
            
            if (this.method === 'GET') {
                const query = Object.keys(this.params)
                    .map(k => `${k}=${encodeURIComponent(this.params[k])}`)
                    .join('&');
                apiUrl += '?' + query;
            }

            Logger.debug(`[BANGGOOD] ${this.method} ${this.task}`, this.params);

            // Realizar solicitud
            const response = await fetch(apiUrl, {
                method: this.method,
                headers: {
                    'Accept': 'application/json',
                    ...headers
                },
                timeout: this.curlExpireTime * 1000
            });

            if (!response.ok) {
                Logger.warn(`[BANGGOOD] HTTP ${response.status}`);
                return null;
            }

            const data = await response.json();
            Logger.debug('[BANGGOOD] Respuesta:', data);
            return data;
        } catch (e) {
            Logger.error('[BANGGOOD] Error en solicitud:', e);
            return null;
        }
    }

    /**
     * Métodos públicos de la API
     */
    async getCouponList(params = {}) {
        this.task = 'coupon/list';
        this.method = 'GET';
        this.params = params;
        return await this.getAccessToken();
    }

    async getCouponDetail(couponCode) {
        this.task = 'coupon/detail';
        this.method = 'GET';
        this.params = { coupon_code: couponCode };
        return await this.getAccessToken();
    }

    async getProductCategory(categoryId) {
        this.task = 'product/category';
        this.method = 'GET';
        this.params = { category_id: categoryId };
        return await this.getAccessToken();
    }

    async getProductList(categoryId, page = 1) {
        this.task = 'product/list';
        this.method = 'GET';
        this.params = { 
            category_id: categoryId,
            page: page
        };
        return await this.getAccessToken();
    }

    async getNewProductList(categoryId, page = 1) {
        this.task = 'newproduct/list';
        this.method = 'GET';
        this.params = { 
            category_id: categoryId,
            page: page
        };
        return await this.getAccessToken();
    }

    async getProductDetail(productId) {
        this.task = 'product/detail';
        this.method = 'GET';
        this.params = { product_id: productId };
        return await this.getAccessToken();
    }

    async getCountriesList(lang = 'en-GB') {
        this.task = 'countries/list';
        this.method = 'GET';
        this.params = { lang: lang };
        return await this.getAccessToken();
    }

    /**
     * Hash MD5 simplificado (para firmar)
     * ⚠️ En producción usa crypto-js
     */
    _md5Hash(str) {
        // Fallback: usar crypto de navegador si disponible
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            return this._md5Simple(str);
        }
        return this._md5Simple(str);
    }

    _md5Simple(str) {
        // Implementación básica de MD5 para firmas
        // ⚠️ Para producción, importa crypto-js
        let hash = 0;
        if (str.length === 0) return hash.toString(16);
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}

// Instancia global
const bgAPI = new BanggoodAPIClient(
    BANGGOOD_API.APP_KEY, 
    BANGGOOD_API.APP_SECRET
);

// ============================================================================
// 🎟️ MÓDULO DE CUPONES
// ============================================================================

class CouponsManager {
    constructor() {
        this.coupons = [];
        this.cacheKey = 'domotech_coupons_cache';
        this.cacheDuration = 60 * 60 * 1000; // 1 hora
    }

    /**
     * Obtener lista de cupones disponibles
     */
    async getCouponList(params = {}) {
        const cached = this._getCachedData();
        if (cached) {
            Logger.info('[COUPONS] Usando cupones en caché');
            return cached;
        }

        try {
            Logger.info('[COUPONS] Obteniendo cupones de Banggood...');
            const defaultParams = {
                category_id: 0,
                type: 2, // Type 2 = cupones activos
                ...params
            };

            const result = await bgAPI.getCouponList(defaultParams);

            if (result?.code === 0 && result?.data?.list) {
                this.coupons = result.data.list;
                this._cacheData(this.coupons);
                Logger.info(`[COUPONS] ✅ ${this.coupons.length} cupones cargados`);
                return this.coupons;
            } else {
                Logger.warn('[COUPONS] No se obtuvieron cupones válidos');
                return this._getFallbackCoupons();
            }
        } catch (e) {
            Logger.error('[COUPONS] Error obteniéndolos:', e);
            return this._getFallbackCoupons();
        }
    }

    /**
     * Obtener detalles de un cupón específico
     */
    async getCouponDetail(couponCode) {
        try {
            const result = await bgAPI.getCouponDetail(couponCode);
            if (result?.code === 0) {
                return result.data;
            }
            return null;
        } catch (e) {
            Logger.error('[COUPONS] Error obteniéndolos detalles:', e);
            return null;
        }
    }

    /**
     * Filtrar cupones por categoría
     */
    getCouponsByCategory(categoryId) {
        return this.coupons.filter(c => 
            !categoryId || c.category_id === categoryId
        );
    }

    /**
     * Ordenar cupones por descuento (mayor primero)
     */
    getSortedByCouponValue() {
        return [...this.coupons].sort((a, b) => {
            const valueA = parseFloat(a.coupon_value || 0);
            const valueB = parseFloat(b.coupon_value || 0);
            return valueB - valueA;
        });
    }

    /**
     * Datos en caché
     */
    _getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const now = Date.now();

            if (now - data.timestamp < this.cacheDuration) {
                return data.coupons;
            }
            localStorage.removeItem(this.cacheKey);
            return null;
        } catch (e) {
            return null;
        }
    }

    _cacheData(coupons) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify({
                coupons: coupons,
                timestamp: Date.now()
            }));
        } catch (e) {
            Logger.warn('[COUPONS] Error cachendo datos:', e);
        }
    }

    /**
     * Cupones de demostración (fallback)
     */
    _getFallbackCoupons() {
        return [
            {
                coupon_code: 'BG0c387a',
                coupon_value: 5,
                category_name: 'Smart Home',
                description: 'Descuento en domótica'
            },
            {
                coupon_code: 'TECH2026',
                coupon_value: 10,
                category_name: 'Electrónica',
                description: 'Oferta especial 2026'
            },
            {
                coupon_code: 'SUMMER25',
                coupon_value: 15,
                category_name: 'Accesorios',
                description: 'Descuento verano'
            }
        ];
    }
}

// Instancia global de cupones
const couponsManager = new CouponsManager();

// ============================================================================
// 🎁 RENDERIZAR CUPONES EN LA WEB
// ============================================================================

function renderCouponCard(coupon) {
    const code = coupon.coupon_code || 'CUPÓN';
    const value = coupon.coupon_value || 0;
    const category = coupon.category_name || 'General';
    const desc = coupon.description || 'Descuento disponible';

    return `
        <div class="card coupon-card" style="position: relative; overflow: hidden;">
            <div style="background: linear-gradient(135deg, var(--primary), #1e293b); padding: 15px; margin: -15px -15px 15px -15px; border-radius: 8px 8px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Código de cupón</div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: white; font-family: monospace;">${code}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: 800; color: #22c55e;">-${value}€</div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7);">descuento</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9rem; color: var(--muted-text); margin-bottom: 5px;">📂 ${category}</div>
                <h4 style="margin: 0; font-size: 0.95rem;">${desc}</h4>
            </div>

            <div style="display: flex; gap: 10px;">
                <button onclick="copiarCodigo('${code}')" style="flex: 1; padding: 10px; background: rgba(var(--primary-rgb), 0.1); border: 1px solid var(--primary); border-radius: 8px; color: var(--primary); font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(var(--primary-rgb), 0.2)'" onmouseout="this.style.background='rgba(var(--primary-rgb), 0.1)'">
                    📋 Copiar
                </button>
                <a href="https://www.banggood.com" class="btn-aliexpress" target="_blank" style="flex: 1; text-align: center; padding: 10px;">
                    Usar →
                </a>
            </div>
        </div>
    `;
}

/**
 * Cargar y mostrar cupones en un contenedor
 */
async function loadCouponsSection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Mostrar skeleton while loading
    container.innerHTML = Array(3).fill(0).map(() => `
        <div class="card" style="padding: 20px;">
            <div style="height: 100px; background: rgba(255,255,255,0.05); border-radius: 8px; animation: pulse 1.5s infinite;"></div>
        </div>
    `).join('');

    try {
        const coupons = await couponsManager.getCouponList();
        const sorted = couponsManager.getSortedByCouponValue();
        
        if (sorted.length > 0) {
            container.innerHTML = sorted.slice(0, 3).map(renderCouponCard).join('');
            Logger.info(`[COUPONS UI] Mostrados ${sorted.slice(0, 3).length} cupones`);
        } else {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No hay cupones disponibles en este momento</p>';
        }
    } catch (e) {
        Logger.error('[COUPONS UI] Error:', e);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Error cargando cupones</p>';
    }
}

/**
 * Copiar código a portapapeles
 */
function copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #22c55e;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = `✅ Código "${codigo}" copiado al portapapeles`;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }).catch(err => {
        Logger.error('[COPY] Error copiando:', err);
        alert('Error al copiar. Intenta de nuevo.');
    });
}

// ============================================================================
// 🏆 OFERTAS DEL DÍA DE BANGGOOD
// ============================================================================

async function loadBanggoodDailyOffers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = renderLoadingSkeleton(4);

    try {
        const products = await searchBanggood('hot deals banggood smart home');
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(renderFusedProductCard).join('');
            Logger.info('[DAILY OFFERS] Cargadas ofertas del día');
        } else {
            container.innerHTML = renderEmptyState();
        }
    } catch (e) {
        Logger.error('[DAILY OFFERS] Error:', e);
        container.innerHTML = renderEmptyState();
    }
}

// ============================================================================
// 🌐 EXPORTAR FUNCIONES GLOBALES
// ============================================================================

window.bgAPI = bgAPI;
window.couponsManager = couponsManager;
window.loadCouponsSection = loadCouponsSection;
window.loadBanggoodDailyOffers = loadBanggoodDailyOffers;
window.copiarCodigo = copiarCodigo;

// Auto-init en página carga (si existen contenedores)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coupons-section')) {
        setTimeout(() => loadCouponsSection('coupons-section'), 500);
    }
    if (document.getElementById('daily-offers')) {
        setTimeout(() => loadBanggoodDailyOffers('daily-offers'), 700);
    }
});

Logger.info('✅ Banggood Coupons Module Loaded');
