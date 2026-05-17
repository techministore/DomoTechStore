/**
 * DomoTechStore - Main JavaScript
 * Maneja la carga de componentes, navegación y productos destacados.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Detectar si estamos en una subcarpeta para ajustar las rutas relativas
    // Cloudflare Pages puede tener rutas limpias (/comparativas/algo) o con .html
    const isSubfolder = window.location.pathname.includes('/categorias/') || window.location.pathname.includes('/comparativas/');
    const basePath = isSubfolder ? '../' : '';

    // Usamos rutas absolutas desde la raíz para los componentes principales
    const rootPath = '/';

    // 2. Cargar Header y Footer (Componentes reutilizables)
    loadComponent('header-placeholder', `${rootPath}includes/header.html`, () => {
        // Cargar el menú dentro del header una vez que este existe
        loadComponent('menu-placeholder', `${rootPath}includes/menu.html`, () => {
            setupMobileMenu();
            fixLinks(rootPath); // Aseguramos que los links del header y menú sean absolutos
        });
    });
    loadComponent('footer-placeholder', `${rootPath}includes/footer.html`, () => {
        fixLinks(rootPath);
    });

    // 3. SEO dinámico
    generateSEO(rootPath);

    // 4. Cargar datos dinámicos según la página
    loadFeatured(rootPath);
    loadTopSales(rootPath);

    // 5. Automatizar enlaces vacíos en guías estáticas
    automateProductLinks();

    // 6. Diagnóstico de API para el usuario
    console.log("%c[DomoTech] Sistema Inicializado v2.1", "color: #3b82f6; font-weight: bold; font-size: 1.2rem;");
    checkApiStatus();
});

/**
 * Verifica el estado de la conexión con la API de AliExpress
 */
async function checkApiStatus() {
    try {
        const res = await fetch("/aliexpress?keyword=test");
        if (res.ok) {
            console.log("%c[API] Conexión establecida con éxito. AliExpress está operativo.", "color: #4ade80; font-weight: bold;");
        } else if (res.status === 401) {
            console.warn("%c[API] Error 401: No autorizado. Verifica las claves ALI_APP_KEY y ALI_APP_SECRET en los Secretos de Cloudflare Pages.", "background: #fef08a; color: #854d0e; padding: 4px; border-radius: 4px;");
        } else {
            console.error(`%c[API] Error de conexión: Código ${res.status}`, "color: #f87171;");
        }
    } catch (e) {
        console.error("[API] No se pudo conectar con el backend de Cloudflare Functions.", e);
    }
}

/**
 * Automatiza los enlaces que están vacíos (#) convirtiéndolos en enlaces DIRECTOS al mejor producto
 */
async function automateProductLinks() {
    const emptyLinks = document.querySelectorAll('a[href="#"]');
    const trackingId = "Domotech_2026";

    for (const link of emptyLinks) {
        // 1. Obtener el nombre del producto o categoría del contexto
        const card = link.closest('.card') || link.parentElement;
        
        // Si es una "clickable-info-card", usamos el texto descriptivo para una búsqueda más precisa
        const isInfoCard = link.classList.contains('clickable-info-card');
        const productName = isInfoCard 
            ? card.querySelector('p')?.textContent 
            : card.querySelector('h2, h3')?.textContent;
            
        const cleanName = (productName || "smart home").replace(/^\d+\.\s*/, '').trim();

        // 2. Fallback inmediato (Búsqueda)
        link.href = `https://www.aliexpress.com/af/${encodeURIComponent(cleanName)}.html?aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=${trackingId}`;
        link.target = "_blank";
        link.rel = "nofollow sponsored";

        // 3. Si no es una info-card (que busca listados), intentamos match directo de producto
        if (!isInfoCard) {
            try {
                const products = await buscarProductos(cleanName, true); 
                if (products && products.length > 0) {
                    const bestMatch = products[0];
                    link.href = bestMatch.link;
                    link.title = `Mejor oferta encontrada: ${bestMatch.price}€`;
                    
                    const priceEl = card.querySelector('.current-price');
                    if (priceEl && !priceEl.textContent.includes('€')) {
                        priceEl.textContent = `${bestMatch.price}€`;
                    }
                }
            } catch (err) {
                console.warn(`No se pudo encontrar match directo para "${cleanName}"`);
            }
        }
    }
}

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
 * Corrige los enlaces e imágenes cuando estamos en una subcarpeta
 */
function fixLinks(basePath) {
    // Corregir enlaces
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
            if (!href.startsWith(basePath)) {
                link.href = basePath + href;
            }
        }
    });

    // Corregir imágenes (como el logo)
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith(basePath)) {
            img.src = basePath + src;
        }
    });
}

/**
 * Función principal para mostrar productos dinámicos en cualquier contenedor
 * Conecta el frontend con la API de AliExpress
 */
async function mostrarProductos(keyword, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Mostrar esqueletos de carga (UX mejorada)
    container.innerHTML = Array(4).fill(0).map(() => `
        <article class="card product-card skeleton-card">
            <div style="height: 180px; background: #2a3441; border-radius: 12px; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
            <div style="height: 20px; background: #2a3441; border-radius: 4px; width: 80%; animation: pulse 1.5s infinite 0.2s;"></div>
            <div style="height: 40px; background: #2a3441; border-radius: 8px; margin-top: 20px; animation: pulse 1.5s infinite 0.4s;"></div>
        </article>
    `).join('');

    try {
        console.log(`%c[DomoTech] Buscando "${keyword}" para el contenedor #${containerId}...`, "color: #facc15");
        
        // 2. Llamada a la API (buscarProductos ya maneja caché y proceso de tags)
        const products = await buscarProductos(keyword, true); 
        
        if (products && products.length > 0) {
            // 3. Renderizar productos reales de AliExpress
            container.innerHTML = products.slice(0, 4).map(p => {
                const tagClass = p.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
                const hasOldPrice = p.original_price && parseFloat(p.original_price) > parseFloat(p.price);
                const oldPriceHtml = hasOldPrice ? `<span class="old-price">${p.original_price}€</span>` : '';

                return `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="urgency-badge">⚡ ¡OFERTA REAL!</div>
                    <div class="product-image-container">
                        <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=Tech+Gadget'">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        ${oldPriceHtml}
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales || 0}+ vendidos</div>` : ''}
                    <a href="${p.url || p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">Comprar Ahora →</a>
                </article>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 40px;">No hay ofertas disponibles para esta búsqueda en este momento.</p>';
        }
    } catch (error) {
        console.error("Error en mostrarProductos:", error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff4747; padding: 40px;">Error al conectar con AliExpress. Inténtalo de nuevo más tarde.</p>';
    }
}

/**
 * Carga productos destacados (Automatizado)
 */
async function loadFeatured(basePath) {
    const container = document.getElementById('productos-destacados');
    if (!container) return;

    try {
        // Traemos lo mejor de lo mejor (best sellers reales)
        const keyword = "top rated smart home gadgets";

        const products = await buscarProductos(keyword, true); 
        if (products && products.length > 0) {
            // Mostramos los productos reales por ranking de la API
            container.innerHTML = products.slice(0, 4).map(p => {
                const tagClass = p.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
                return `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="product-image-container">
                        <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=Tech+Gadget'">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales}+ vendidos</div>` : ''}
                    <a href="${p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">Ver Detalles →</a>
                </article>
                `;
            }).join('');
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
        
        // Usamos las primeras 3 categorías principales para mostrar sus top ventas REALES
        const selectedCategories = allCategories.slice(0, 3);
        const results = await Promise.all(selectedCategories.map(cat => buscarProductos(cat.keyword, true))); 
        
        let hasContent = false;
        const html = selectedCategories.map((cat, idx) => {
            // El primer resultado de buscarProductos para cada categoría es el Top Venta real
            let product = results[idx]?.[0];
            
            if (!product) return '';
            hasContent = true;
            
            return `
                <div class="top-sales-item card">
                    <div style="width: 70px; height: 70px; flex-shrink: 0; background: #fff; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img src="${product.image}" style="width: 90%; height: 90%; object-fit: contain;" loading="lazy" onerror="this.src='https://placehold.co/100x100/1e293b/white?text=Tech'">
                    </div>
                    <div style="flex-grow: 1; min-width: 0;">
                        <div class="cat-tag">${cat.nombre}</div>
                        <h4 style="font-size: 0.85rem; margin-bottom: 5px; height: 2.4em; overflow: hidden; line-height: 1.2;">${product.title}</h4>
                        <a href="${product.link}" class="btn-link" style="font-size: 0.75rem; margin: 0;" target="_blank" onclick="trackClick('${product.id}', 'top_sales')">Ver Top Venta →</a>
                    </div>
                </div>
            `;
        }).join('');

        if (hasContent) {
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">No hay ofertas disponibles en AliExpress en este momento.</p>';
        }
    } catch (error) {
        console.error("Error cargando top ventas reales:", error);
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
                                    <td><a href="${formatAffiliateLink(p.enlace, 'Domotech_2026')}" class="btn-aliexpress" style="padding: 8px 15px; font-size: 0.8rem; margin: 0;" target="_blank">Comprar →</a></td>
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
 * Asegura que el enlace de afiliado esté bien formateado con los parámetros de Portals
 */
function formatAffiliateLink(url, trackingId) {
    if (!url) return "#";
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=${trackingId}`;
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
                link: formatAffiliateLink(p.enlace, 'Domotech_2026'),
                descripcion: p.descripcion
            }));

            // Generar Structured Data
            injectProductSchema(rawProducts);

            container.innerHTML = products.map(p => {
                const discount = p.old_price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;
                const tagClass = p.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
                return `
                    <article class="card product-card" itemscope itemtype="https://schema.org/Product" style="position: relative;">
                        ${p.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                        ${showDiscount && discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
                        <div class="product-image-container">
                            <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=Tech+Gadget'">
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
async function buscarProductos(keyword, isHot = false) {
    if (!keyword) return [];
    const cacheKey = `search_${keyword.toLowerCase().trim().replace(/\s+/g, '_')}${isHot ? '_hot' : ''}`;
    const CACHE_TIME = 1000 * 60 * 15; // Reducido a 15 minutos para mayor frescura (antes 1 hora)

    // 1. Intentar obtener de la caché (localStorage)
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TIME) {
                console.log(`%c[API] Cargando "${keyword}" desde caché...`, "color: #4ade80");
                return data;
            }
        }
    } catch (e) {}

    console.log(`%c[API] Conectando con AliExpress para: "${keyword}"...`, "color: #3b82f6");

    // 2. Llamada a la API
    const endpoint = "/aliexpress";
    let items = [];
    try {
        const url = `${endpoint}?keyword=${encodeURIComponent(keyword)}${isHot ? '&hot=true' : ''}`;
        const res = await fetch(url);
        
        if (res.status === 401) {
            console.error("%c[API] Error 401: Unauthorized. Revisa tu APP_KEY y SECRET en Cloudflare.", "background: #ff4747; color: white; padding: 2px 5px; border-radius: 3px;");
            return [];
        }
        
        if (!res.ok) throw new Error(`Error API: ${res.status}`);
        
        const data = await res.json();
        
        if (data.error) {
            console.error(`%c[API] AliExpress Error: ${data.error}`, "background: #450a0a; color: #f87171; padding: 2px 5px; border-radius: 3px;");
            if (data.details) console.dir(data.details);
            return [];
        }

        const result = data.result || data;
        items = result.items || [];
        
        console.log(`%c[API] Éxito: ${items.length} productos recibidos.`, "color: #4ade80");
    } catch (apiErr) {
        console.warn("%c[API] Error en llamada API AliExpress:", "color: #facc15", apiErr);
    }

    // 3. Fallback: Si pedimos 'hot' y no vino nada, intentar búsqueda normal una vez
    if (isHot && items.length === 0) {
        console.log(`No se encontraron Hot Products para "${keyword}", intentando búsqueda normal...`);
        return await buscarProductos(keyword, false);
    }

    // 4. Guardar en caché si hay resultados
    if (items.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({
            data: items,
            timestamp: Date.now()
        }));
    }

    return processBestProducts(items);
}

/**
 * Procesa una lista de productos para marcar los "Mejores" según criterios reales de AliExpress
 */
function processBestProducts(products) {
    if (!products || products.length === 0) return [];

    // 1. Ordenar por "Calidad" (Rating + Ventas) para tener una base de confianza
    const sortedByQuality = [...products].sort((a, b) => {
        const scoreA = (parseFloat(a.rating) || 0) * 10 + (parseInt(a.sales) || 0) / 100;
        const scoreB = (parseFloat(b.rating) || 0) * 10 + (parseInt(b.sales) || 0) / 100;
        return scoreB - scoreA;
    });

    // 2. Identificar el de Mejor Precio (el más barato de entre los que tienen buen rating)
    const cheapest = [...products]
        .filter(p => (parseFloat(p.rating) || 0) >= 4.2) // Filtro mínimo de calidad para el barato
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
    
    // 3. Identificar Calidad-Precio (el que tiene mejor relación Rating/Precio)
    const bestValue = [...products]
        .filter(p => (parseInt(p.sales) || 0) > 50) // Que tenga algunas ventas
        .sort((a, b) => {
            const ratioA = (parseFloat(a.rating) || 0) / parseFloat(a.price);
            const ratioB = (parseFloat(b.rating) || 0) / parseFloat(b.price);
            return ratioB - ratioA;
        })[0];
    
    // 4. Identificar el Top Ventas (Popularidad pura)
    const topSales = [...products].sort((a, b) => (parseInt(b.sales) || 0) - (parseInt(a.sales) || 0))[0];

    return sortedByQuality.map(p => {
        if (cheapest && p.id === cheapest.id) p.tag = "MEJOR PRECIO";
        else if (bestValue && p.id === bestValue.id) p.tag = "CALIDAD-PRECIO";
        else if (topSales && p.id === topSales.id) p.tag = "MÁS VENDIDO";
        else if ((parseFloat(p.rating) || 0) >= 4.8) p.tag = "RECOMENDADO";
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

// Conexión automática con AliExpress (Ofertas del día)
document.addEventListener("DOMContentLoaded", () => {
    if (typeof mostrarProductos === 'function') {
        mostrarProductos("smart home", "ofertas-dia");
    }
});