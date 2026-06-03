/**
 * DomoTechStore - Miravia UI Module
 * ✔ Miravia vía Awin (programa de afiliados activo)
 * ✔ No requiere aprobación adicional si ya tienes cuenta Awin
 * ✔ Comisión: 3–8% por venta
 * ✔ Registro: https://www.awin.com/ → buscar "Miravia" (awinmid: 30521)
 */

// ============================================================================
// ⚙️ CONFIGURACIÓN AWIN / MIRAVIA
// ============================================================================

const MIRAVIA_CONFIG = {
    AWIN_MID: window.MIRAVIA_AWIN_MID || '30521',     // Miravia merchant ID en Awin
    AWIN_AFFID: window.MIRAVIA_AWIN_AFFID || '1636287', // Tu Awin Publisher ID
    BASE_SEARCH: 'https://www.miravia.es/search',
    AWIN_BASE: 'https://www.awin1.com/cread.php'
};

// ============================================================================
// 🔗 GENERAR ENLACE DE AFILIADO MIRAVIA (Awin)
// ============================================================================

function buildMiraviaLink(keyword) {
    const searchUrl = `${MIRAVIA_CONFIG.BASE_SEARCH}?q=${encodeURIComponent(keyword)}`;
    return `${MIRAVIA_CONFIG.AWIN_BASE}?awinmid=${MIRAVIA_CONFIG.AWIN_MID}&awinaffid=${MIRAVIA_CONFIG.AWIN_AFFID}&ued=${encodeURIComponent(searchUrl)}`;
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN MIRAVIA
// ============================================================================

function getMiraviaDemoProducts(keyword = 'smart home') {
    const link = buildMiraviaLink(keyword);

    return [
        {
            id: `mir_demo_1_${Date.now()}`,
            title: `Enchufe WiFi Inteligente 16A Tuya Smart Life - ${keyword}`,
            price: 8.99,
            originalPrice: 19.99,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 1200,
            link,
            store: 'MIRAVIA', storeName: 'Miravia', storeColor: '#0c2340', tag: null, timestamp: Date.now()
        },
        {
            id: `mir_demo_2_${Date.now() + 1}`,
            title: `Bombilla Inteligente LED RGB WiFi E27 9W - ${keyword}`,
            price: 6.49,
            originalPrice: 14.99,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            rating: 4.5,
            sales: 3400,
            link,
            store: 'MIRAVIA', storeName: 'Miravia', storeColor: '#0c2340', tag: null, timestamp: Date.now()
        },
        {
            id: `mir_demo_3_${Date.now() + 2}`,
            title: `Cámara Vigilancia WiFi 2K Interior con Visión Nocturna - ${keyword}`,
            price: 18.99,
            originalPrice: 39.99,
            image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
            rating: 4.4,
            sales: 890,
            link,
            store: 'MIRAVIA', storeName: 'Miravia', storeColor: '#0c2340', tag: null, timestamp: Date.now()
        },
        {
            id: `mir_demo_4_${Date.now() + 3}`,
            title: `Tira LED 5m RGB WiFi Compatible Alexa Google - ${keyword}`,
            price: 9.99,
            originalPrice: 22.99,
            image: 'https://images.unsplash.com/photo-1516381640033-d4d8e8f1c8f0?auto=format&fit=crop&w=400&q=80',
            rating: 4.2,
            sales: 2200,
            link,
            store: 'MIRAVIA', storeName: 'Miravia', storeColor: '#0c2340', tag: null, timestamp: Date.now()
        }
    ];
}

// ============================================================================
// 🔍 BUSCAR EN MIRAVIA
// ============================================================================

async function searchMiraviaProducts(keyword) {
    console.log('[Miravia] Buscando:', keyword);
    return getMiraviaDemoProducts(keyword);
}

// ============================================================================
// ⚡ CARGAR OFERTAS MIRAVIA
// ============================================================================

async function loadMiraviaDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function'
        ? renderLoadingSkeleton : () => '<p style="text-align:center;opacity:.5;">Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    const products = getMiraviaDemoProducts('domótica hogar inteligente');
    const renderFn = typeof renderFusedProductCard === 'function'
        ? renderFusedProductCard
        : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                <a href="${p.link}" target="_blank">Ver en Miravia →</a></div>`;

    container.innerHTML = products.slice(0, 4).map(renderFn).join('');
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.miraviaUI = {
    search: searchMiraviaProducts,
    loadDeals: loadMiraviaDeals,
    getDemoProducts: getMiraviaDemoProducts,
    buildLink: buildMiraviaLink
};

window.searchMiravia = searchMiraviaProducts;

console.log('✅ Miravia (Awin) UI Module Loaded');
