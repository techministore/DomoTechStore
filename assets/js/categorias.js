document.addEventListener('DOMContentLoaded', async () => {
    const productContainer = document.getElementById('product-list');
    const currentCategory = document.body.dataset.category;
    const isSub = window.location.pathname.includes('/categorias/') || window.location.pathname.includes('/comparativas/');
    const basePath = isSub ? '../' : '';
    const jsonPath = `${basePath}data/productos.json`;
    const categoriesPath = `${basePath}data/categorias.json`;

    if (!productContainer || !currentCategory) return;

    try {
        // 1. Cargar productos locales y datos de categorías en paralelo
        const [productsRes, categoriesRes] = await Promise.all([
            fetch(jsonPath),
            fetch(categoriesPath)
        ]);

        const products = await productsRes.json();
        const categories = await categoriesRes.json();

        // 2. Filtrar y renderizar productos locales
        const filtered = products.filter(p => p.categoria === currentCategory);
        renderAutosuficiente(filtered, productContainer);

        // 3. AUTOMATIZACIÓN: Si hay pocos productos locales, traer de la API usando el keyword del JSON
        if (filtered.length < 8 && typeof buscarProductos === 'function') {
            const categoryData = categories.find(c => c.slug === currentCategory);
            const keyword = categoryData?.keyword || currentCategory.replace('-', ' ');
            
            buscarProductos(keyword).then(apiProducts => {
                if (apiProducts && apiProducts.length > 0) {
                    appendApiProducts(apiProducts);
                }
            });
        }
    } catch (error) {
        console.error("Error cargando productos o categorías:", error);
    }
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
        return `
            <article class="card product-card">
                <div class="urgency-badge">🔥 ¡OFERTA LIMITADA!</div>
                <div class="product-image-container">
                    <img src="${p.image}" alt="${p.title}">
                </div>
                <h3>${p.title}</h3>
                <div class="price-container">
                    <span class="old-price">${(parseFloat(p.price) * 1.4).toFixed(2)}€</span>
                    <span class="current-price">${p.price}€</span>
                </div>
                <a href="${p.link}" class="btn-aliexpress" target="_blank">COMPRAR AHORA</a>
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