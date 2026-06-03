/**
 * DomoTechStore - TomTop UI Module
 * ✔ TomTop — electrónica y gadgets con almacén en España
 * ✔ Afiliación directa: https://www.tomtop.com/m-affiliates.html
 * ✔ Comisión: 5–10% por venta
 * ✔ Programa propio sin intermediario (aprobación en 24h)
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN TOMTOP
// ============================================================================

const TOMTOP_CONFIG = {
    AFFILIATE_ID: window.TOMTOP_AFFILIATE_ID || '',
    BASE_SEARCH: 'https://www.tomtop.com/search',
    BASE_URL: 'https://www.tomtop.com'
};

// ============================================================================
// 🔗 GENERAR ENLACE DE AFILIADO TOMTOP
// ============================================================================

function buildTomtopLink(keyword) {
    const searchUrl = `${TOMTOP_CONFIG.BASE_SEARCH}?q=${encodeURIComponent(keyword)}`;
    if (TOMTOP_CONFIG.AFFILIATE_ID) {
        return `${searchUrl}&affiliateid=${TOMTOP_CONFIG.AFFILIATE_ID}`;
    }
    return searchUrl;
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN TOMTOP
// ============================================================================

function getTomtopDemoProducts(keyword = 'smart home') {
    const link = buildTomtopLink(keyword);

    return [
        {
            id: `tt_demo_1_${Date.now()}`,
            title: `Kit Inicio Domótica Smart Home 4 Enchufes WiFi + Hub - ${keyword}`,
            price: 29.99,
            originalPrice: 59.99,
            image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 520,
            link,
            store: 'TOMTOP', storeName: 'TomTop', storeColor: '#f26522', tag: null, timestamp: Date.now()
        },
        {
            id: `tt_demo_2_${Date.now() + 1}`,
            title: `Bombilla LED E27 RGB Inteligente WiFi Compatible Alexa - ${keyword}`,
            price: 5.49,
            originalPrice: 12.99,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            rating: 4.5,
            sales: 1800,
            link,
            store: 'TOMTOP', storeName: 'TomTop', storeColor: '#f26522', tag: null, timestamp: Date.now()
        },
        {
            id: `tt_demo_3_${Date.now() + 2}`,
            title: `Termostato WiFi Programable Pantalla LCD Control App - ${keyword}`,
            price: 19.99,
            originalPrice: 44.99,
            image: 'https://images.unsplash.com/photo-1516381640033-d4d8e8f1c8f0?auto=format&fit=crop&w=400&q=80',
            rating: 4.2,
            sales: 340,
            link,
            store: 'TOMTOP', storeName: 'TomTop', storeColor: '#f26522', tag: null, timestamp: Date.now()
        },
        {
            id: `tt_demo_4_${Date.now() + 3}`,
            title: `Alarma WiFi Seguridad Hogar Sensores Movimiento App - ${keyword}`,
            price: 39.99,
            originalPrice: 79.99,
            image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
            rating: 4.0,
            sales: 220,
            link,
            store: 'TOMTOP', storeName: 'TomTop', storeColor: '#f26522', tag: null, timestamp: Date.now()
        }
    ];
}

// ============================================================================
// 🔍 BUSCAR EN TOMTOP
// ============================================================================

async function searchTomtopProducts(keyword) {
    console.log('[TomTop] Buscando:', keyword);
    return getTomtopDemoProducts(keyword);
}

// ============================================================================
// ⚡ CARGAR OFERTAS TOMTOP
// ============================================================================

async function loadTomtopDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function'
        ? renderLoadingSkeleton : () => '<p style="text-align:center;opacity:.5;">Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    const products = getTomtopDemoProducts('smart home domótica');
    const renderFn = typeof renderFusedProductCard === 'function'
        ? renderFusedProductCard
        : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                <a href="${p.link}" target="_blank">Ver en TomTop →</a></div>`;

    container.innerHTML = products.slice(0, 4).map(renderFn).join('');
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.tomtopUI = {
    search: searchTomtopProducts,
    loadDeals: loadTomtopDeals,
    getDemoProducts: getTomtopDemoProducts,
    buildLink: buildTomtopLink
};

window.searchTomtop = searchTomtopProducts;

console.log('✅ TomTop UI Module Loaded');
