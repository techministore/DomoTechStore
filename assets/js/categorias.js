document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.getElementById('product-list');
    const currentCategory = document.body.dataset.category;
    const isSub = window.location.pathname.includes('/categorias/') || window.location.pathname.includes('/comparativas/');
    const jsonPath = isSub ? '../data/productos.json' : 'data/productos.json';

    fetch(jsonPath)
        .then(response => response.json())
        .then(products => {
            if (productContainer && currentCategory) {
                const filtered = products.filter(p => p.categoria === currentCategory);
                renderAutosuficiente(filtered, productContainer);
            }
        });
});

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
                <a href="${p.enlace}" class="btn-aliexpress product-card__button" target="_blank" rel="nofollow sponsored">VER CHOLLO EN ALIEXPRESS</a>
            </article>`;
    }).join('');
}