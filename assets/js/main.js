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
 * Carga Ofertas del Día (Optimizado con AliExpress API y Rotación)
 */
async function loadDailyOffers(basePath) {
    const container = document.getElementById('ofertas-dia');
    if (!container) return;

    try {
        const categoriesRes = await fetch(`${basePath}data/categorias.json`);
        const allCategories = await categoriesRes.json();
        
        // Rotación de keywords para ofertas frescas: Mezcla de genéricas y categorías
        const offerKeywords = ["flash deals", "hot sale", "best price", "discount smart home"];
        const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
        offerKeywords.push(randomCategory.keyword);
        
        const keyword = offerKeywords[Math.floor(Math.random() * offerKeywords.length)];
        
        const products = await buscarProductos(keyword);
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(p => `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="badge" style="background: var(--primary); position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="urgency-badge">⚡ ¡SUPER OFERTA!</div>
                    <div class="product-image-container">
                        <img src="${p.image}" alt="${p.title}">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        <span class="old-price">${(parseFloat(p.price) * 1.4).toFixed(2)}€</span>
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales}+ vendidos</div>` : ''}
                    <a href="${p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">Comprar Ahora →</a>
                </article>
            `).join('');
        } else {
            renderProductGrid('ofertas-dia', `${basePath}data/productos.json`, p => p.oferta, 4, true);
        }
    } catch (error) {
        console.error("Error cargando ofertas API:", error);
        renderProductGrid('ofertas-dia', `${basePath}data/productos.json`, p => p.oferta, 4, true);
    }
}

/**
 * Carga productos destacados (Automatizado)
 */
async function loadFeatured(basePath) {
    const container = document.getElementById('productos-destacados');
    if (!container) return;

    try {
        const categoriesRes = await fetch(`${basePath}data/categorias.json`);
        const allCategories = await categoriesRes.json();
        const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];

        const products = await buscarProductos(`best ${randomCategory.keyword}`);
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(p => `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="badge" style="background: var(--primary); position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="product-image-container">
                        <img src="${p.image}" alt="${p.title}">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales}+ vendidos</div>` : ''}
                    <a href="${p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">Ver Detalles →</a>
                </article>
            `).join('');
        } else {
            renderProductGrid('productos-destacados', `${basePath}data/productos.json`, p => p.destacado, 4);
        }
    } catch (error) {
        renderProductGrid('productos-destacados', `${basePath}data/productos.json`, p => p.destacado, 4);
    }
}

/**
 * Carga Top Ventas (Categorías Automáticas)
 */
async function loadTopSales(basePath) {
    const container = document.getElementById('top-ventas-categorias');
    if (!container) return;

    try {
        const categoriesRes = await fetch(`${basePath}data/categorias.json`);
        const allCategories = await categoriesRes.json();
        
        // Seleccionamos 3 categorías al azar o fijas para mostrar
        const selectedCategories = allCategories.slice(0, 3);

        const results = await Promise.all(selectedCategories.map(cat => buscarProductos(cat.keyword)));
        
        container.innerHTML = selectedCategories.map((cat, idx) => {
            const product = results[idx]?.[0];
            if (!product) return '';
            return `
                <div class="top-sales-item card" style="display: flex; gap: 15px; align-items: center; padding: 15px;">
                    <div style="width: 80px; height: 80px; flex-shrink: 0; background: #fff; border-radius: 8px; overflow: hidden;">
                        <img src="${product.image}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div style="flex-grow: 1;">
                        <div class="cat-tag" style="font-size: 0.7rem; margin-bottom: 5px;">${cat.nombre}</div>
                        <h4 style="font-size: 0.9rem; margin-bottom: 5px; height: 2.4em; overflow: hidden;">${product.title}</h4>
                        <a href="${product.link}" class="btn-link" target="_blank" onclick="trackClick('${product.id}', 'aliexpress')">Más vendido →</a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error cargando top ventas:", error);
    }
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
                                    <td><a href="${formatAffiliateLink(p.enlace, 'domotech2026')}" class="btn-aliexpress" style="padding: 8px 15px; font-size: 0.8rem; margin: 0;" target="_blank">Comprar →</a></td>
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
 * Asegura que el enlace de afiliado esté bien formateado
 */
function formatAffiliateLink(url, trackingId) {
    if (!url) return "#";
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}aff_id=${trackingId}`;
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
            let rawProducts = data.filter(filterFn);
            if (limit) rawProducts = rawProducts.slice(0, limit);

            if (rawProducts.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No hay productos disponibles en este momento.</p>';
                return;
            }

            // Normalizar productos locales al formato unificado
            const products = rawProducts.map(p => ({
                id: p.id,
                title: p.nombre,
                price: p.precio_aproximado,
                old_price: p.precio_original,
                image: p.imagen || 'assets/img/placeholder-tech.jpg',
                link: formatAffiliateLink(p.enlace, 'domotech2026'),
                descripcion: p.descripcion
            }));

            // Generar Structured Data
            injectProductSchema(rawProducts);

            container.innerHTML = products.map(p => {
                const discount = p.old_price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;
                return `
                    <article class="card product-card" itemscope itemtype="https://schema.org/Product" style="position: relative;">
                        ${showDiscount && discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
                        <div class="product-image-container">
                            <img src="${p.image}" alt="${p.title}" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=Tech+Gadget'">
                        </div>
                        <h3 itemprop="name">${p.title}</h3>
                        <p class="product-desc" itemprop="description">${p.descripcion}</p>
                        <div class="price-container" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                            <meta itemprop="priceCurrency" content="EUR">
                            <meta itemprop="price" content="${p.price}">
                            ${p.old_price > p.price ? `<span class="old-price">${p.old_price}€</span>` : ''}
                            <span class="current-price">~${p.price}€</span>
                        </div>
                        <a href="${p.link}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored" onclick="trackClick('${p.id}', 'local')">Ver en AliExpress →</a>
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

/**
 * Función global para buscar en AliExpress vía API (Con Caché y Optimización)
 */
async function buscarProductos(keyword) {
    if (!keyword) return [];
    const cacheKey = `search_${keyword.toLowerCase().trim().replace(/\s+/g, '_')}`;
    const CACHE_TIME = 1000 * 60 * 60; // 1 hora de caché

    // 1. Intentar obtener de la caché (localStorage)
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TIME) {
                return data;
            }
        }
    } catch (e) {}

    // 2. Llamada a la API
    const endpoint = "/api/aliexpress";
    
    try {
        const url = `${endpoint}?keyword=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        
        if (res.status === 401) {
            console.error("API Error 401: Unauthorized. Revisa tu RAPIDAPI_KEY en Cloudflare.");
            return [];
        }
        
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        
        const data = await res.json();
        const items = (data.result && data.result.items) || [];

        // 3. Guardar en caché
        if (items.length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: items,
                timestamp: Date.now()
            }));
        }

        return processBestProducts(items);
    } catch (error) {
        console.error("Error cargando productos de AliExpress:", error);
        return [];
    }
}

/**
 * Procesa una lista de productos para marcar los "Mejores" según criterios
 */
function processBestProducts(products) {
    if (!products || products.length === 0) return [];

    // 1. Identificar el más barato
    const cheapest = [...products].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
    
    // 2. Identificar el más vendido (si tiene ventas)
    const topSales = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];
    
    // 3. Identificar el mejor valorado (si tiene rating)
    const topRated = [...products].filter(p => p.rating).sort((a, b) => b.rating - a.rating)[0];

    return products.map(p => {
        if (p.id === cheapest.id) p.tag = "PRECIO MÁS BAJO";
        else if (topSales && p.id === topSales.id && p.sales > 0) p.tag = "MÁS VENDIDO";
        else if (topRated && p.id === topRated.id && p.rating >= 4.5) p.tag = "MEJOR VALORADO";
        return p;
    });
}

/**
 * Sistema de estadísticas de clics y conversiones (100% Autónomo)
 * Guarda los clics en localStorage para análisis posterior
 */
function trackClick(productId, provider) {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": [], "total": 0}');
        stats.clicks.push({
            id: productId,
            provider: provider,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
        });
        stats.total++;
        
        // Mantener solo los últimos 100 clics para no saturar el storage
        if (stats.clicks.length > 100) stats.clicks.shift();
        
        localStorage.setItem('domotech_stats', JSON.stringify(stats));
        console.log(`Click registrado: ${productId} (${provider})`);
    } catch (e) {
        console.error("Error registrando click:", e);
    }
}