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
        
        const products = await buscarProductos(keyword, true); // Forzar Hot Products para ofertas
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(p => {
                const tagClass = p.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
                return `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="urgency-badge">⚡ ¡SUPER OFERTA!</div>
                    <div class="product-image-container">
                        <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=Tech+Gadget'">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        <span class="old-price">${(parseFloat(p.price) * 1.4).toFixed(2)}€</span>
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales}+ vendidos</div>` : ''}
                    <a href="${p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress')">Comprar Ahora →</a>
                </article>
                `;
            }).join('');
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

        const products = await buscarProductos(`best ${randomCategory.keyword}`, true); // Productos destacados con alta comisión
        if (products && products.length > 0) {
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
        const [categoriesRes, productsRes] = await Promise.all([
            fetch(`${basePath}data/categorias.json`),
            fetch(`${basePath}data/productos.json`)
        ]);
        
        const allCategories = await categoriesRes.json();
        const localProducts = await productsRes.json();
        
        const selectedCategories = allCategories.slice(0, 3);
        const results = await Promise.all(selectedCategories.map(cat => buscarProductos(cat.keyword, true))); // Top ventas con alta comisión
        
        let hasContent = false;
        const html = selectedCategories.map((cat, idx) => {
            let product = results[idx]?.[0];
            
            // Fallback a producto local si la API falla
            if (!product) {
                product = localProducts.find(p => p.categoria === cat.slug);
                if (product) {
                    // Adaptar formato local al unificado
                    product = {
                        id: product.id,
                        title: product.nombre,
                        image: product.imagen,
                        link: formatAffiliateLink(product.enlace, 'domotech2026')
                    };
                }
            }

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
                        <a href="${product.link}" class="btn-link" style="font-size: 0.75rem; margin: 0;" target="_blank" onclick="trackClick('${product.id}', 'top_sales')">Ver oferta →</a>
                    </div>
                </div>
            `;
        }).join('');

        if (hasContent) {
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">Cargando ofertas...</p>';
        }
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
 * Asegura que el enlace de afiliado esté bien formateado con los parámetros de Portals
 */
function formatAffiliateLink(url, trackingId) {
    if (!url) return "#";
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=domotech_2026`;
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
    const CACHE_TIME = 1000 * 60 * 60; // 1 hora de caché

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
    const endpoint = "/api/aliexpress";
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
    
    // 4. Identificar el de mayor comisión o "Hot Product" (Simulado si no hay dato real)
    const recommended = [...products].sort((a, b) => {
        // Si hay dato de comisión real, usarlo. Si no, priorizar rating + ventas
        const valA = (a.commission || 0) * 100 + (a.rating || 0) * 10 + (a.sales || 0) / 100;
        const valB = (b.commission || 0) * 100 + (b.rating || 0) * 10 + (b.sales || 0) / 100;
        return valB - valA;
    })[0];

    return products.map(p => {
        if (p.id === recommended.id && (p.commission || p.rating >= 4.8)) p.tag = "RECOMENDADO";
        else if (p.id === cheapest.id) p.tag = "PRECIO MÁS BAJO";
        else if (topSales && p.id === topSales.id && p.sales > 100) p.tag = "MÁS VENDIDO";
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