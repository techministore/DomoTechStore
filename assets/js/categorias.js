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

        // 2. Prioridad: Cargar desde API para asegurar productos frescos de AliExpress
        const categoryData = categories.find(c => c.slug === currentCategory);
        const keyword = categoryData?.keyword || currentCategory.replace('-', ' ');
        
        // Mostrar esqueletos mientras carga la API
        productContainer.innerHTML = Array(4).fill(0).map(() => `
            <article class="card product-card skeleton-card">
                <div style="height: 180px; background: #2a3441; border-radius: 12px; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 20px; background: #2a3441; border-radius: 4px; width: 80%; animation: pulse 1.5s infinite 0.2s;"></div>
            </article>
        `).join('');

        try {
            const apiProducts = await buscarProductos(keyword, true); // Intentar obtener Hot Products de la categoría
            if (apiProducts && apiProducts.length > 0) {
                // Renderizar productos de la API (AliExpress real)
                renderAutosuficiente(apiProducts, productContainer);
                
                // Si hay pocos de la API, podemos añadir los locales al final
                const filteredLocals = products.filter(p => p.categoria === currentCategory);
                if (filteredLocals.length > 0) {
                    appendLocalProducts(filteredLocals, productContainer);
                }
            } else {
                // Si la API falla, cargar locales como fallback
                const filteredLocals = products.filter(p => p.categoria === currentCategory);
                renderAutosuficiente(filteredLocals, productContainer);
            }
        } catch (apiErr) {
            console.error("API falló, usando catálogo local:", apiErr);
            const filteredLocals = products.filter(p => p.categoria === currentCategory);
            renderAutosuficiente(filteredLocals, productContainer);
        }
    } catch (error) {
        console.error("Error cargando productos o categorías:", error);
    }
});

/**
 * Añade productos locales al final si es necesario
 */
function appendLocalProducts(products, container) {
    const localHtml = `
        <div style="grid-column: 1/-1; margin-top: 40px; border-top: 1px solid var(--border); padding-top: 20px;">
            <h3 style="font-size: 1.1rem; margin-bottom: 20px; opacity: 0.6;">Selección del Editor (Catálogo Local)</h3>
        </div>
    ` + products.map(p => `
        <article class="card product-card" style="opacity: 0.8;">
            <div class="product-image-container">
                <img src="${p.imagen}" alt="${p.nombre}">
            </div>
            <h3>${p.nombre}</h3>
            <div class="price-container">
                <span class="current-price">~${p.precio_aproximado}€</span>
            </div>
            <a href="${p.enlace}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'local')">Ver Detalles</a>
        </article>
    `).join('');

    container.insertAdjacentHTML('beforeend', localHtml);
}

function renderAutosuficiente(products, container) {
    if (!products || products.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">No se han encontrado ofertas disponibles en este momento. Inténtalo de nuevo más tarde.</p>`;
        return;
    }
    container.innerHTML = products.map(p => {
        // Soporte para formato API (p.title, p.image) o local (p.nombre, p.imagen)
        const title = p.title || p.nombre;
        const image = p.image || p.imagen;
        const price = p.price || p.precio_aproximado;
        const link = p.link || p.enlace;
        const tag = p.tag || (p.oferta ? "OFERTA" : "");
        const tagClass = tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";

        return `
            <article class="card product-card" style="position: relative;">
                ${tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${tag}</div>` : ''}
                <div class="product-image-container">
                    <img src="${image}" alt="${title}" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=AliExpress'">
                </div>
                <h3>${title}</h3>
                <div class="price-container">
                    ${p.old_price ? `<span class="old-price">${p.old_price}€</span>` : ''}
                    <span class="current-price">${price}€</span>
                </div>
                ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales}+ vendidos</div>` : ''}
                <a href="${link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">COMPRAR AHORA</a>
            </article>`;
    }).join('');
}