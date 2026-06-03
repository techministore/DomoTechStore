/**
 * DomoTechStore - Temu UI Module
 * ⚡ Módulo seguro: SOLO UI + llamadas al Worker /temu
 * ✔ Búsqueda y productos populares
 * ✔ Normalización al formato estándar
 * ✔ Fallback con productos de demostración
 */

// ============================================================================
// 🔗 NORMALIZAR PRODUCTO TEMU
// ============================================================================

function normalizeTemuProduct(p) {
    const productId = p.goods_id || p.id || String(Date.now() + Math.random());
    const affiliateId = window.TEMU_CONFIG?.AFFILIATE_ID || '';

    let link = p.goods_detail_url || p.url || p.link ||
        `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(p.goods_name || 'smart home')}`;

    if (affiliateId && link.includes('temu.com')) {
        link = link.includes('?') ? `${link}&refer_page_name=affiliate_${affiliateId}`
                                  : `${link}?refer_page_name=affiliate_${affiliateId}`;
    }

    const price = parseFloat(
        p.min_group_price || p.min_normal_price || p.price || p.sale_price || 0
    ) / 100; // PDD API devuelve precios en céntimos

    const originalPrice = parseFloat(
        p.market_fee || p.original_price || p.min_normal_price || 0
    ) / 100;

    return {
        id: `tm_${productId}`,
        originalId: productId,
        title: p.goods_name || p.title || p.name || 'Producto Temu',
        price,
        originalPrice: originalPrice > price ? originalPrice : price,
        image: p.goods_thumbnail_url || p.goods_image_url || p.image ||
               'https://placehold.co/400x400/1e293b/white?text=Temu',
        rating: parseFloat(p.goods_rate || p.rating || 4.1),
        sales: parseInt(p.sales_tip?.replace(/[^0-9]/g, '') || p.sold_quantity || p.sales || 0),
        link,
        store: 'TEMU',
        storeName: 'Temu',
        storeColor: '#ff6900',
        tag: null,
        timestamp: Date.now()
    };
}

// ============================================================================
// 📦 PRODUCTOS DE DEMOSTRACIÓN TEMU
// ============================================================================

function getTemuDemoProducts(keyword = 'smart home') {
    return [
        {
            id: 'tm_demo_1',
            title: `Enchufe Inteligente WiFi Monitor Energía - ${keyword}`,
            price: 3.99,
            originalPrice: 12.99,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
            rating: 4.2,
            sales: 15000,
            link: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
            store: 'TEMU', storeName: 'Temu', storeColor: '#ff6900', tag: null, timestamp: Date.now()
        },
        {
            id: 'tm_demo_2',
            title: `Tira LED RGB WiFi 5m Control App - ${keyword}`,
            price: 4.49,
            originalPrice: 14.99,
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            rating: 4.0,
            sales: 28000,
            link: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
            store: 'TEMU', storeName: 'Temu', storeColor: '#ff6900', tag: null, timestamp: Date.now()
        },
        {
            id: 'tm_demo_3',
            title: `Sensor de Movimiento Infrarrojo WiFi Tuya - ${keyword}`,
            price: 2.99,
            originalPrice: 8.99,
            image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
            rating: 4.1,
            sales: 9500,
            link: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
            store: 'TEMU', storeName: 'Temu', storeColor: '#ff6900', tag: null, timestamp: Date.now()
        },
        {
            id: 'tm_demo_4',
            title: `Bombilla LED E27 9W RGB WiFi Smart - ${keyword}`,
            price: 3.29,
            originalPrice: 9.99,
            image: 'https://images.unsplash.com/photo-1516381640033-d4d8e8f1c8f0?auto=format&fit=crop&w=400&q=80',
            rating: 4.3,
            sales: 42000,
            link: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
            store: 'TEMU', storeName: 'Temu', storeColor: '#ff6900', tag: null, timestamp: Date.now()
        }
    ];
}

// ============================================================================
// 🔍 BUSCAR EN TEMU
// ============================================================================

async function searchTemuProducts(keyword) {
    console.log('[TEMU] Buscando:', keyword);

    try {
        const res = await fetch(`/temu?action=search&q=${encodeURIComponent(keyword)}`);
        const data = await res.json();

        if (data.fallback || data.code !== 0) {
            console.warn('[TEMU] Usando fallback de demostración');
            return getTemuDemoProducts(keyword);
        }

        // PDD API: goods_search_response.goods_list
        const items = data.data?.goods_search_response?.goods_list ||
                      data.data?.goods_recommend_response?.list ||
                      data.data?.items || [];

        if (items.length > 0) {
            console.log(`[TEMU] ${items.length} productos recibidos`);
            return items.map(normalizeTemuProduct);
        }

        return getTemuDemoProducts(keyword);
    } catch (err) {
        console.warn('[TEMU] Error:', err.message);
        return getTemuDemoProducts(keyword);
    }
}

// ============================================================================
// ⚡ CARGAR OFERTAS POPULARES TEMU
// ============================================================================

async function loadTemuDeals(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonFn = typeof renderLoadingSkeleton === 'function'
        ? renderLoadingSkeleton : () => '<p style="text-align:center;opacity:.5;">Cargando...</p>';
    container.innerHTML = skeletonFn(4);

    try {
        const res = await fetch('/temu?action=popular');
        const data = await res.json();

        let products = [];
        if (!data.fallback && data.code === 0) {
            const items = data.data?.goods_recommend_response?.list ||
                          data.data?.goods_search_response?.goods_list || [];
            products = items.map(normalizeTemuProduct);
        }

        if (products.length === 0) products = getTemuDemoProducts('smart home deals');

        const renderFn = typeof renderFusedProductCard === 'function'
            ? renderFusedProductCard
            : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                    <a href="${p.link}" target="_blank">Ver en Temu →</a></div>`;

        container.innerHTML = products.slice(0, 4).map(renderFn).join('');
    } catch (err) {
        const products = getTemuDemoProducts('smart home');
        const renderFn = typeof renderFusedProductCard === 'function'
            ? renderFusedProductCard
            : p => `<div class="card"><h3>${p.title}</h3><p>${p.price}€</p>
                    <a href="${p.link}" target="_blank">Ver en Temu →</a></div>`;
        container.innerHTML = products.slice(0, 4).map(renderFn).join('');
    }
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.temuUI = {
    search: searchTemuProducts,
    loadDeals: loadTemuDeals,
    getDemoProducts: getTemuDemoProducts,
    normalizeProduct: normalizeTemuProduct
};

window.searchTemu = searchTemuProducts;

console.log('✅ Temu UI Module Loaded');
