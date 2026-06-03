/**
 * DomoTechStore - Cafago UI Module
 * ✔ Cafago — tienda especializada en electrónica y gadgets
 * ✔ Afiliación vía enlace directo / CJ Affiliate
 * ✔ Comisión: 4–8% por venta (programa CJ Affiliate)
 * ✔ Registro: https://www.cafago.com/en/affiliate/
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN CAFAGO
// ============================================================================

const CAFAGO_CONFIG = {
    AFFILIATE_ID: window.CAFAGO_AFFILIATE_ID || '',
    BASE_SEARCH: 'https://www.cafago.com/en/catalogsearch/result/',
    BASE_PRODUCT: 'https://www.cafago.com'
};

// ============================================================================
// 🔗 GENERAR ENLACE DE AFILIADO CAFAGO
// ============================================================================

function buildCafagoLink(keyword) {
    const searchUrl = `${CAFAGO_CONFIG.BASE_SEARCH}?q=${encodeURIComponent(keyword)}`;
    if (CAFAGO_CONFIG.AFFILIATE_ID) {
        return `${searchUrl}&aff_id=${CAFAGO_CONFIG.AFFILIATE_ID}`;
    }
    return searchUrl;
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN CAFAGO
// ============================================================================

function getCafagoDemoProducts(keyword = 'smart home') {
    const link = buildCafagoLink(keyword);

    return [
        {
            id: `caf_demo_1_${Date.now()}`,
            title: `Enchufe Inteligente 16A WiFi EU Monitor Energía - ${keyword}`,
            price: 5.99,
            originalPrice: 13.99,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
            rating: 4.2,
            sales: 750,
            link,
            store: 'CAFAGO', storeName: 'Cafago', storeColor: '#e8321e', tag: null, timestamp: Date.now()
        },
        {
            id: `caf_demo_2_${Date.now() + 1}`,
            title: `Cámara WiFi Exterior Impermeable 1080P Visión Nocturna - ${keyword}`,
            price: 15.99,
            originalPrice: 34.99,
            image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 430,
            link,
            store: 'CAFAGO', storeName: 'Cafago', storeColor: '#e8321e', tag: null, timestamp: Date.now()
        },
        {
            id: `caf_demo_3_${Date.now() + 2}`,
            title: `Sensor Temperatura Humedad LCD Bluetooth - ${keyword}`,
            price: 4.49,
            originalPrice: 9.99,
            image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
            rating: 4.4,
            sales: 1100,
            link,
            store: 'CAFAGO', storeName: 'Cafago', storeColor: '#e8321e', tag: null, timestamp: Date.now()
        },
        {
            id: `caf_demo_4_${Date.now() + 3}`,
            title: `Aspirador Robot WiFi Tuya Mapa Láser App Control - ${keyword}`,
            price: 89.99,
            originalPrice: 159.99,
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
            rating: 4.1,
            sales: 280,
            link,
            store: 'CAFAGO', storeName: 'Cafago', storeColor: '#e8321e', tag: null, timestamp: Date.now()
        }
    ];
}

// ============================================================================
// 🔍 BUSCAR EN CAFAGO
// ============================================================================

async function searchCafagoProducts(keyword) {
    console.log('[Cafago] Buscando:', keyword);
    return getCafagoDemoProducts(keyword);
}

// ============================================================================
// ⚡ CARGAR OFERTAS CAFAGO
// ============================================================================

async function loadCafagoDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function'
        ? renderLoadingSkeleton : () => '<p style="text-align:center;opacity:.5;">Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    const products = getCafagoDemoProducts('smart home wifi');
    const renderFn = typeof renderFusedProductCard === 'function'
        ? renderFusedProductCard
        : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                <a href="${p.link}" target="_blank">Ver en Cafago →</a></div>`;

    container.innerHTML = products.slice(0, 4).map(renderFn).join('');
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.cafagoUI = {
    search: searchCafagoProducts,
    loadDeals: loadCafagoDeals,
    getDemoProducts: getCafagoDemoProducts,
    buildLink: buildCafagoLink
};

window.searchCafago = searchCafagoProducts;

console.log('✅ Cafago UI Module Loaded');
