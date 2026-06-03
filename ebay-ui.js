/**
 * DomoTechStore - eBay UI Module
 * ✔ eBay Partner Network (EPN) — deep links de afiliado
 * ✔ No requiere aprobación de API
 * ✔ Comisión: 1–4% por venta completada
 * ✔ Regístrate: https://partnernetwork.ebay.es/
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN EPN
// ============================================================================

const EBAY_CONFIG = {
    // Tu Campaign ID de eBay Partner Network (EPN)
    CAMPAIGN_ID: window.EBAY_CAMPAIGN_ID || '',
    // eBay España: ID de sitio 1185-53479-19255-0
    SITE_ID: '1185-53479-19255-0',
    BASE_SEARCH: 'https://www.ebay.es/sch/i.html',
    EPN_BASE: 'https://rover.ebay.com/rover/1'
};

// ============================================================================
// 🔗 GENERAR ENLACE DE AFILIADO EBAY EPN
// ============================================================================

function buildEbayLink(keyword, extraParams = {}) {
    const searchUrl = `${EBAY_CONFIG.BASE_SEARCH}?_nkw=${encodeURIComponent(keyword)}&_sop=12`;
    // _sop=12 = ordenar por "Mejor valorados + precio"

    if (EBAY_CONFIG.CAMPAIGN_ID) {
        const epnUrl = `${EBAY_CONFIG.EPN_BASE}/${EBAY_CONFIG.SITE_ID}/1?` +
            `campid=${EBAY_CONFIG.CAMPAIGN_ID}&toolid=10001&customid=domotech&` +
            `mpre=${encodeURIComponent(searchUrl)}`;
        return epnUrl;
    }

    // Sin Campaign ID: enlace directo (añade tu Campaign ID para monetizar)
    return searchUrl;
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN EBAY
// ============================================================================

function getEbayDemoProducts(keyword = 'smart home') {
    const link = buildEbayLink(keyword);
    const kw = keyword.toLowerCase();

    return [
        {
            id: `ebay_demo_1_${Date.now()}`,
            title: `Enchufe Inteligente WiFi Tuya 16A Monitor Energía - ${keyword}`,
            price: 6.99,
            originalPrice: 15.99,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
            rating: 4.5,
            sales: 2100,
            link,
            store: 'EBAY', storeName: 'eBay', storeColor: '#e53238', tag: null, timestamp: Date.now()
        },
        {
            id: `ebay_demo_2_${Date.now() + 1}`,
            title: `Bombilla LED E27 RGB WiFi Alexa Google Home - ${keyword}`,
            price: 4.49,
            originalPrice: 9.99,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 4500,
            link,
            store: 'EBAY', storeName: 'eBay', storeColor: '#e53238', tag: null, timestamp: Date.now()
        },
        {
            id: `ebay_demo_3_${Date.now() + 2}`,
            title: `Cámara IP WiFi 1080P Interior Vigilancia - ${keyword}`,
            price: 12.99,
            originalPrice: 29.99,
            image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
            rating: 4.2,
            sales: 1800,
            link,
            store: 'EBAY', storeName: 'eBay', storeColor: '#e53238', tag: null, timestamp: Date.now()
        },
        {
            id: `ebay_demo_4_${Date.now() + 3}`,
            title: `Sensor Puerta Ventana Zigbee Alarma Smart Home - ${keyword}`,
            price: 3.49,
            originalPrice: 7.99,
            image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
            rating: 4.4,
            sales: 900,
            link,
            store: 'EBAY', storeName: 'eBay', storeColor: '#e53238', tag: null, timestamp: Date.now()
        }
    ];
}

// ============================================================================
// 🔍 BUSCAR EN EBAY (sin API — devuelve demo + enlace afiliado real)
// ============================================================================

async function searchEbayProducts(keyword) {
    console.log('[eBay] Buscando:', keyword);

    // eBay Finding API requiere App ID — usamos demo + link afiliado
    // El usuario llega a ebay.es con tu tracking activo desde el primer click
    return getEbayDemoProducts(keyword);
}

// ============================================================================
// ⚡ CARGAR OFERTAS EBAY
// ============================================================================

async function loadEbayDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function'
        ? renderLoadingSkeleton : () => '<p style="text-align:center;opacity:.5;">Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    const products = getEbayDemoProducts('smart home gadgets');
    const renderFn = typeof renderFusedProductCard === 'function'
        ? renderFusedProductCard
        : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                <a href="${p.link}" target="_blank">Ver en eBay →</a></div>`;

    container.innerHTML = products.slice(0, 4).map(renderFn).join('');
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.ebayUI = {
    search: searchEbayProducts,
    loadDeals: loadEbayDeals,
    getDemoProducts: getEbayDemoProducts,
    buildLink: buildEbayLink
};

window.searchEbay = searchEbayProducts;

console.log('✅ eBay EPN UI Module Loaded');
