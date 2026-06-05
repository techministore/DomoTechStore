/**
 * DomoTechStore - Geekbuying UI Module
 * ⚡ Módulo seguro: SOLO UI + llamadas al Worker /geekbuy
 * ✔ Búsqueda de productos
 * ✔ Ofertas destacadas
 * ✔ Fallback con productos de demostración
 */

// ============================================================================
// 🔗 NORMALIZAR PRODUCTO GEEKBUYING
// ============================================================================

function normalizeGeekbuyingProduct(p) {
    const productId = p.product_id || p.id || String(Date.now() + Math.random());
    const affiliateId = window.GEEKBUYING_CONFIG?.AFFILIATE_ID || '';
    let link = p.url || p.product_url || p.link || `https://www.geekbuying.com/search/?s=${encodeURIComponent(p.title || 'smart home')}`;

    if (affiliateId && link.includes('geekbuying.com')) {
        link = link.includes('?')
            ? `${link}&affid=${affiliateId}`
            : `${link}?affid=${affiliateId}`;
    }

    return {
        id: `gb_${productId}`,
        originalId: productId,
        title: p.title || p.name || p.product_name || 'Producto Geekbuying',
        price: parseFloat(p.price || p.sale_price || p.salePrice || 0),
        originalPrice: parseFloat(p.original_price || p.originalPrice || p.price || 0),
        image: p.image || p.image_url || p.thumbnail || 'https://placehold.co/400x400/1e293b/white?text=Geekbuying',
        rating: parseFloat(p.rating || p.star_rating || 4.2),
        sales: parseInt(p.sales || p.sold_count || 0),
        link,
        store: 'GEEKBUYING',
        storeName: 'Geekbuying',
        storeColor: '#ff6b2b',
        tag: null,
        timestamp: Date.now()
    };
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN
// ============================================================================

function getGeekbuyingDemoProducts(keyword = 'smart home') {
    const demos = [
        {
            id: 'gb_demo_1',
            title: `Robot Aspirador WiFi Tuya - ${keyword}`,
            price: 89.99,
            originalPrice: 149.99,
            image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=400&q=80',
            rating: 4.5,
            sales: 320,
            link: `https://www.geekbuying.com/search/?s=${encodeURIComponent(keyword)}`,
            store: 'GEEKBUYING',
            storeName: 'Geekbuying',
            storeColor: '#ff6b2b',
            tag: null,
            timestamp: Date.now()
        },
        {
            id: 'gb_demo_2',
            title: `Cámara de Seguridad IP 4K - ${keyword}`,
            price: 34.99,
            originalPrice: 59.99,
            image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 580,
            link: `https://www.geekbuying.com/search/?s=${encodeURIComponent(keyword)}`,
            store: 'GEEKBUYING',
            storeName: 'Geekbuying',
            storeColor: '#ff6b2b',
            tag: null,
            timestamp: Date.now()
        },
        {
            id: 'gb_demo_3',
            title: `Hub Zigbee 3.0 Compatible Alexa - ${keyword}`,
            price: 19.99,
            originalPrice: 34.99,
            image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
            rating: 4.6,
            sales: 210,
            link: `https://www.geekbuying.com/search/?s=${encodeURIComponent(keyword)}`,
            store: 'GEEKBUYING',
            storeName: 'Geekbuying',
            storeColor: '#ff6b2b',
            tag: null,
            timestamp: Date.now()
        },
        {
            id: 'gb_demo_4',
            title: `Tira LED WiFi RGB 10m - ${keyword}`,
            price: 12.99,
            originalPrice: 24.99,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            rating: 4.4,
            sales: 890,
            link: `https://www.geekbuying.com/search/?s=${encodeURIComponent(keyword)}`,
            store: 'GEEKBUYING',
            storeName: 'Geekbuying',
            storeColor: '#ff6b2b',
            tag: null,
            timestamp: Date.now()
        }
    ];
    return demos;
}

// ============================================================================
// 🔍 BUSCAR EN GEEKBUYING
// ============================================================================

async function searchGeekbuyingProducts(keyword) {
    console.log('[GEEKBUYING] Buscando:', keyword);

    try {
        // 🔥 CORREGIDO: antes era /geekbuying
        const url = `/geekbuy?q=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.fallback || data.code !== 0) {
            console.warn('[GEEKBUYING] Usando fallback de demostración');
            return getGeekbuyingDemoProducts(keyword);
        }

        const items = data.data?.products || data.products || data.items || [];
        if (items.length > 0) {
            console.log(`[GEEKBUYING] ${items.length} productos recibidos`);
            return items.map(normalizeGeekbuyingProduct);
        }

        return getGeekbuyingDemoProducts(keyword);
    } catch (err) {
        console.warn('[GEEKBUYING] Error en búsqueda:', err.message);
        return getGeekbuyingDemoProducts(keyword);
    }
}

// ============================================================================
// ⚡ CARGAR OFERTAS DESTACADAS GEEKBUYING
// ============================================================================

async function loadGeekbuyingDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function' ? renderLoadingSkeleton : (n) => '<p>Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    try {
        // 🔥 CORREGIDO: antes era /geekbuying
        const res = await fetch('/geekbuy?action=deals');
        const data = await res.json();

        let products = [];
        if (!data.fallback && data.code === 0) {
            const items = data.data?.products || data.products || [];
            products = items.map(normalizeGeekbuyingProduct);
        }

        if (products.length === 0) {
            products = getGeekbuyingDemoProducts('smart home deals');
        }

        const renderFn = typeof renderFusedProductCard === 'function'
            ? renderFusedProductCard
            : (p) => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p><a href="${p.link}" target="_blank">Ver en Geekbuying →</a></div>`;

        container.innerHTML = products.slice(0, 4).map(renderFn).join('');
    } catch (err) {
        console.warn('[GEEKBUYING] Error al cargar ofertas:', err.message);
        const products = getGeekbuyingDemoProducts('smart home');
        const renderFn = typeof renderFusedProductCard === 'function'
            ? renderFusedProductCard
            : (p) => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p><a href="${p.link}" target="_blank">Ver en Geekbuying →</a></div>`;
        container.innerHTML = products.slice(0, 4).map(renderFn).join('');
    }
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.geekbuyingUI = {
    search: searchGeekbuyingProducts,
    loadDeals: loadGeekbuyingDeals,
    getDemoProducts: getGeekbuyingDemoProducts,
    normalizeProduct: normalizeGeekbuyingProduct
};

window.searchGeekbuying = searchGeekbuyingProducts;

console.log('✅ Geekbuying UI Module Loaded');
