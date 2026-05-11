/**
 * DomoTechStore - Main JavaScript
 * Maneja la carga de componentes, navegación y productos destacados.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Determinar la ruta base para archivos en subcarpetas
    const isSubfolder = window.location.pathname.includes('/categorias/') || window.location.pathname.includes('/comparativas/');
    const basePath = isSubfolder ? '../' : '';

    // 1. Cargar Header
    loadComponent('header-placeholder', `${basePath}includes/header.html`, () => {
        // Una vez cargado el header, cargar el menú dentro del header
        loadComponent('menu-placeholder', `${basePath}includes/menu.html`, () => {
            setupMobileMenu();
            if (isSubfolder) fixLinks(basePath);
        });
    });

    // 2. Cargar Footer
    loadComponent('footer-placeholder', `${basePath}includes/footer.html`, () => {
        if (isSubfolder) fixLinks(basePath);
    });

    // 3. Cargar Productos Destacados (solo en index)
    if (document.getElementById('productos-destacados')) {
        loadFeatured(basePath);
    }

    // 4. Cargar Ofertas del Día
    if (document.getElementById('ofertas-dia')) {
        loadDailyOffers(basePath);
    }

    // 5. Cargar Top Ventas por Categoría
    if (document.getElementById('top-ventas-categorias')) {
        loadTopSales(basePath);
    }

    // 6. Cargar Comparativas Automáticas
    if (document.getElementById('comparativa-dinamica')) {
        loadDynamicComparison(basePath);
    }

    // 7. Generar SEO: Breadcrumbs y JSON-LD
    generateSEO(basePath);
});

/**
 * Genera elementos SEO dinámicos como Breadcrumbs y JSON-LD
 */
function generateSEO(basePath) {
    // Generar Breadcrumbs si hay un contenedor
    const breadcrumbContainer = document.getElementById('breadcrumbs');
    if (breadcrumbContainer) {
        const path = window.location.pathname;
        let breadcrumbs = `<a href="${basePath}index.html">Inicio</a>`;
        
        if (path.includes('/categorias/')) {
            const catName = document.querySelector('h1')?.textContent || 'Categoría';
            breadcrumbs += ` <span>›</span> ${catName}`;
        } else if (path.includes('/comparativas/')) {
            const compName = document.querySelector('h1')?.textContent || 'Comparativa';
            breadcrumbs += ` <span>›</span> ${compName}`;
        }
        breadcrumbContainer.innerHTML = breadcrumbs;
    }

    // Generar JSON-LD de Organización (solo en index si no existe)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // El index ya suele tenerlo en el HTML, pero podemos añadir Search Action dinámico
    }
}

/**
 * Carga un componente HTML en un contenedor específico
 */
function loadComponent(id, url, callback) {
    const container = document.getElementById(id);
    if (!container) return;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error cargando ${url}`);
            return response.text();
        })
        .then(data => {
            container.innerHTML = data;
            if (callback) callback();
        })
        .catch(err => console.error(err));
}

/**
 * Configura el menú móvil
 */
function setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-list');
    
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            toggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });
    }
}

/**
 * Corrige los enlaces cuando estamos en una subcarpeta
 */
function fixLinks(basePath) {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
            // Si el enlace no empieza por la ruta base, se la añadimos
            if (!href.startsWith(basePath)) {
                link.href = basePath + href;
            }
        }
    });
}

/**
 * Carga productos destacados desde el JSON
 */
function loadFeatured(basePath) {
    renderProductGrid('productos-destacados', `${basePath}data/productos.json`, p => p.destacado, 4);
}

/**
 * Carga Ofertas del Día
 */
function loadDailyOffers(basePath) {
    renderProductGrid('ofertas-dia', `${basePath}data/productos.json`, p => p.oferta, 4, true);
}

/**
 * Carga Top Ventas por Categoría
 */
function loadTopSales(basePath) {
    const container = document.getElementById('top-ventas-categorias');
    if (!container) return;

    Promise.all([
        fetch(`${basePath}data/productos.json`).then(r => r.json()),
        fetch(`${basePath}data/categorias.json`).then(r => r.json())
    ]).then(([productos, categorias]) => {
        const topSalesMarkup = categorias.map(cat => {
            const topProduct = productos
                .filter(p => p.categoria === cat.slug)
                .sort((a, b) => b.ventas - a.ventas)[0];
            
            if (!topProduct) return '';

            return `
                <div class="top-sales-item">
                    <div class="cat-tag">${cat.nombre}</div>
                    <h4>${topProduct.nombre}</h4>
                    <div class="sales-badge">🔥 +${topProduct.ventas} vendidos</div>
                    <a href="${topProduct.enlace}" class="btn-link" target="_blank">Ver oferta →</a>
                </div>
            `;
        }).join('');
        container.innerHTML = topSalesMarkup;
    });
}

/**
 * Carga una comparativa dinámica basada en datos
 */
function loadDynamicComparison(basePath) {
    const container = document.getElementById('comparativa-dinamica');
    if (!container) return;

    const category = container.dataset.category || 'enchufes-energia-smart';

    fetch(`${basePath}data/productos.json`)
        .then(r => r.json())
        .then(productos => {
            const filtered = productos
                .filter(p => p.categoria === category)
                .sort((a, b) => b.valoracion - a.valoracion)
                .slice(0, 3);

            let tableHtml = `
                <div class="table-responsive">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Valoración</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(p => `
                                <tr>
                                    <td><strong>${p.nombre}</strong></td>
                                    <td>~${p.precio_aproximado}€</td>
                                    <td>⭐ ${p.valoracion}/5</td>
                                    <td><a href="${p.enlace}" class="btn-aliexpress btn-sm" target="_blank">Ver más</a></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = tableHtml;
        });
}

/**
 * Función genérica para renderizar grids de productos
 */
function renderProductGrid(containerId, url, filterFn, limit, showDiscount = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            let products = data.filter(filterFn);
            if (limit) products = products.slice(0, limit);

            if (products.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No hay productos disponibles en este momento.</p>';
                return;
            }

            // Generar Structured Data para estos productos
            injectProductSchema(products);

            container.innerHTML = products.map(p => {
                const discount = p.precio_original ? Math.round(((p.precio_original - p.precio_aproximado) / p.precio_original) * 100) : 0;
                return `
                    <article class="card product-card" itemscope itemtype="https://schema.org/Product">
                        ${showDiscount && discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
                        <div class="cat-icon" style="font-size:2rem">📦</div>
                        <h3 itemprop="name">${p.nombre}</h3>
                        <p class="product-desc" itemprop="description">${p.descripcion}</p>
                        <div class="price-container" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                            <meta itemprop="priceCurrency" content="EUR">
                            <meta itemprop="price" content="${p.precio_aproximado}">
                            <link itemprop="availability" href="https://schema.org/InStock">
                            ${p.precio_original > p.precio_aproximado ? `<span class="old-price">${p.precio_original}€</span>` : ''}
                            <span class="current-price">~${p.precio_aproximado}€</span>
                        </div>
                        <a href="${p.enlace}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored" itemprop="url">Ver en AliExpress →</a>
                    </article>
                `;
            }).join('');
        })
        .catch(err => console.error(`Error cargando productos para ${containerId}:`, err));
}

/**
 * Inyecta Schema.org JSON-LD para los productos cargados
 */
function injectProductSchema(products) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    const schema = {
        "@context": "https://schema.org",
        "@graph": products.map(p => ({
            "@type": "Product",
            "name": p.nombre,
            "description": p.descripcion,
            "offers": {
                "@type": "Offer",
                "price": p.precio_aproximado,
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "url": p.enlace
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": p.valoracion || 4.5,
                "reviewCount": p.ventas || 100
            }
        }))
    };

    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}