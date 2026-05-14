document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.getElementById('product-list');
    const currentCategory = document.body.dataset.category;
    const isSub = window.location.pathname.includes('/categorias/') || window.location.pathname.includes('/comparativas/');
    const jsonPath = isSub ? '../data/productos.json' : 'data/productos.json';

    // 2. Cargar productos desde el JSON local
    fetch(jsonPath)
        .then(response => response.json())
        .then(products => {
            if (productContainer && currentCategory) {
                const filtered = products.filter(p => p.categoria === currentCategory);
                renderAutosuficiente(filtered, productContainer);
                
                // 3. AUTOMATIZACIÓN: Si hay pocos productos locales, traer de la API
                if (filtered.length < 8 && typeof buscarProductos === 'function') {
                    const apiKeywords = {
                        'iluminacion-inteligente': 'rgb led strip alexa zigbee',
                        'seguridad-vigilancia': 'security camera wifi outdoor tuya',
                        'enchufes-energia-smart': 'smart plug wifi 20a monitor',
                        'sensores-automatizacion': 'zigbee sensor temperature motion',
                        'limpieza-inteligente': 'robot vacuum mop xiaomi roborock',
                        'controladores-asistentes': 'zigbee gateway hub home assistant'
                    };
                    
                    const keyword = apiKeywords[currentCategory] || currentCategory.replace('-', ' ');
                    buscarProductos(keyword).then(apiProducts => {
                        if (apiProducts && apiProducts.length > 0) {
                            appendApiProducts(apiProducts);
                        }
                    });
                }
            }
        });
});

/**
 * Añade productos de la API al final de la categoría
 */
function appendApiProducts(products) {
    const container = document.getElementById('product-list');
    if (!container) return;

    const apiHtml = `
        <div style="grid-column: 1/-1; margin-top: 40px; border-top: 1px solid var(--border); padding-top: 20px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 20px; opacity: 0.8;">Más ofertas recomendadas</h3>
        </div>
    ` + products.map(p => {
        const pUrl = p.promotion_link || p.link || p.product_url;
        return `
            <article class="card product-card" itemscope itemtype="https://schema.org/Product">
                <div class="product-image-container" style="height: 180px; overflow: hidden; border-radius: 12px; margin-bottom: 15px; background: #fff;">
                    <img src="${p.image || p.image_url}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: contain;" itemprop="image">
                </div>
                <h3 itemprop="name" style="font-size: 1rem; height: 2.5em; overflow: hidden;">${p.title}</h3>
                <div class="price-container" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <span class="current-price" itemprop="price">${p.price}€</span>
                    <meta itemprop="priceCurrency" content="EUR">
                </div>
                <a href="${pUrl}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id || 'api'}', 'aliexpress')">COMPRAR AHORA</a>
            </article>
        `;
    }).join('');

    container.insertAdjacentHTML('beforeend', apiHtml);
}

function renderAutosuficiente(products, container) {
    if (products.length === 0) {
        container.innerHTML = `<p class="product-card__no-results">Buscando ofertas...</p>`;
        return;
    }
    container.innerHTML = products.map(p => {
        const randomHour = Math.floor(Math.random() * 5) + 1;
        const oldPrice = (p.precio_aproximado * 1.25).toFixed(2);
        return `
            <article class="card product-card">
                <div class="product-card__badge">OFERTA FINALIZA EN ${randomHour}H</div>
                <div class="product-card__icon">📦</div>
                <h3 class="product-card__title">${p.nombre}</h3>
                <p class="product-card__description">${p.descripcion}</p>
                <div class="product-card__price-row">
                    <div class="product-card__prices">
                        <span class="product-card__price-old">${oldPrice}€</span>
                        <span class="product-card__price-current">${p.precio_aproximado}€</span>
                    </div>
                    <span class="product-card__shipping">ENVÍO GRATIS</span>
                </div>
                <a href="${p.enlace}${p.enlace.includes('?') ? '&' : '?'}aff_id=domotech2026" class="btn-aliexpress product-card__button" target="_blank" rel="nofollow sponsored">COMPRAR AHORA</a>
            </article>`;
    }).join('');
}