/**
 * DomoTechStore - Main JavaScript v3.0 Production
 * ⚡ Advanced request management, error handling, and fallback system
 * Designed to never crash and always show content
 */

// ============================================================================
// 🔧 CONFIGURACIÓN GLOBAL & STATE MANAGEMENT
// ============================================================================

const CONFIG = {
    // API Configuration
    API_ENDPOINT: '/aliexpress',
    API_TIMEOUT: 8000, // 8 segundos
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000, // ms exponencial
    
    // Cache Configuration
    CACHE_TTL: 15 * 60 * 1000, // 15 minutos
    CACHE_MAX_SIZE: 50 * 1024 * 1024, // 50 MB localStorage max
    
    // Request Management
    MAX_CONCURRENT_REQUESTS: 3,
    REQUEST_QUEUE_TIMEOUT: 30000, // 30 segundos antes de timeout
    DEBOUNCE_DELAY: 300, // ms
    
    // Fallback Data
    FALLBACK_PRODUCTS_COUNT: 4,
    FALLBACK_PLACEHOLDER: 'https://placehold.co/400x400/1e293b/white?text=Tech+Gadget',
    
    // Monitoring
    ENABLE_DIAGNOSTICS: true,
    LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
};

// Estado global
const STATE = {
    requestQueue: [],
    activeRequests: new Map(),
    failedEndpoints: new Map(),
    cacheStats: { hits: 0, misses: 0, size: 0 },
    apiHealth: { status: 'unknown', lastCheck: null, failureCount: 0 },
    circuitBreaker: { isOpen: false, failureThreshold: 5, resetTimeout: 60000 },
};

// ============================================================================
// 📊 LOGGING & DIAGNOSTICS
// ============================================================================

class Logger {
    static log(level, message, data = null) {
        if (!CONFIG.ENABLE_DIAGNOSTICS) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        const color = {
            debug: '#6366f1',
            info: '#3b82f6',
            warn: '#f59e0b',
            error: '#ef4444'
        }[level] || '#808080';
        
        if (level === 'error') {
            console.error(`%c${prefix} ${message}`, `color: ${color}; font-weight: bold;`, data);
        } else {
            console.log(`%c${prefix} ${message}`, `color: ${color}; font-weight: bold;`, data);
        }
    }
    
    static debug(msg, data) { this.log('debug', msg, data); }
    static info(msg, data) { this.log('info', msg, data); }
    static warn(msg, data) { this.log('warn', msg, data); }
    static error(msg, data) { this.log('error', msg, data); }
}

// ============================================================================
// 🔄 REQUEST QUEUE & CONCURRENCY MANAGER
// ============================================================================

class RequestManager {
    constructor() {
        this.queue = [];
        this.active = 0;
    }

    async execute(fn, priority = 0) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject, priority, createdAt: Date.now() });
            this.queue.sort((a, b) => b.priority - a.priority);
            this.process();
        });
    }

    async process() {
        if (this.active >= CONFIG.MAX_CONCURRENT_REQUESTS || this.queue.length === 0) return;

        this.active++;
        const { fn, resolve, reject, createdAt } = this.queue.shift();

        // Timeout check
        const elapsed = Date.now() - createdAt;
        if (elapsed > CONFIG.REQUEST_QUEUE_TIMEOUT) {
            Logger.warn('Request timeout (queue)', { elapsed });
            this.active--;
            reject(new Error('Request queue timeout'));
            this.process();
            return;
        }

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.active--;
            this.process();
        }
    }

    getStats() {
        return { queued: this.queue.length, active: this.active };
    }
}

const requestManager = new RequestManager();

// ============================================================================
// 💾 ADVANCED CACHE SYSTEM
// ============================================================================

class CacheManager {
    constructor() {
        this.prefix = 'domotech_cache_';
        this.metaPrefix = 'domotech_meta_';
        this.cleanupOldEntries();
    }

    set(key, data, ttl = CONFIG.CACHE_TTL) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                ttl,
                size: JSON.stringify(data).length
            };

            localStorage.setItem(this.prefix + key, JSON.stringify(cacheData));
            Logger.debug(`Cache SET: ${key}`, { ttl: ttl / 1000 / 60 + ' min' });
            STATE.cacheStats.misses++;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                Logger.warn('Cache storage full, clearing old entries');
                this.clearOldest();
                this.set(key, data, ttl); // Retry
            } else {
                Logger.error('Cache set error', e);
            }
        }
    }

    get(key) {
        try {
            const cached = localStorage.getItem(this.prefix + key);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;

            if (isExpired) {
                localStorage.removeItem(this.prefix + key);
                Logger.debug(`Cache EXPIRED: ${key}`);
                return null;
            }

            Logger.debug(`Cache HIT: ${key}`);
            STATE.cacheStats.hits++;
            return cacheData.data;
        } catch (e) {
            Logger.error('Cache get error', e);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clearOldest() {
        const entries = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const data = JSON.parse(localStorage.getItem(key));
                entries.push({ key, timestamp: data.timestamp });
            }
        }
        entries.sort((a, b) => a.timestamp - b.timestamp);
        entries.slice(0, Math.floor(entries.length / 2)).forEach(e => {
            localStorage.removeItem(e.key);
        });
    }

    cleanupOldEntries() {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const data = JSON.parse(localStorage.getItem(key));
                if (Date.now() - data.timestamp > data.ttl) {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    getStats() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                totalSize += localStorage.getItem(key).length;
            }
        }
        STATE.cacheStats.size = totalSize;
        return STATE.cacheStats;
    }
}

const cacheManager = new CacheManager();

// ============================================================================
// 🔌 CIRCUIT BREAKER PATTERN
// ============================================================================

class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.successCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'closed'; // closed, open, half-open
        this.nextAttempt = Date.now();
    }

    recordSuccess() {
        this.failureCount = 0;
        if (this.state === 'half-open') {
            this.state = 'closed';
            Logger.info('Circuit breaker CLOSED');
        }
    }

    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'open';
            this.nextAttempt = Date.now() + this.timeout;
            Logger.warn('Circuit breaker OPEN', { retryAt: this.timeout / 1000 + 's' });
        }
    }

    allowRequest() {
        if (this.state === 'closed') return true;
        if (this.state === 'open' && Date.now() > this.nextAttempt) {
            this.state = 'half-open';
            Logger.info('Circuit breaker HALF-OPEN (testing)');
            return true;
        }
        return false;
    }

    isOpen() {
        return this.state === 'open' && Date.now() < this.nextAttempt;
    }
}

const circuitBreaker = new CircuitBreaker();

// ============================================================================
// 🌐 API COMMUNICATION WITH FALLBACKS
// ============================================================================

async function fetchWithRetry(keyword, isHot = false, retryCount = 0) {
    // Circuit breaker check
    if (!circuitBreaker.allowRequest()) {
        Logger.warn('Circuit breaker is OPEN, skipping API call');
        return null;
    }

    const cacheKey = `search_${keyword.toLowerCase().trim().replace(/\s+/g, '_')}${isHot ? '_hot' : ''}`;

    try {
        // Intentar obtener de caché primero
        const cachedData = cacheManager.get(cacheKey);
        if (cachedData) {
            Logger.info(`Using cached data for: "${keyword}"`);
            return cachedData;
        }

        // Ejecutar petición con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

        const url = `${CONFIG.API_ENDPOINT}?keyword=${encodeURIComponent(keyword)}${isHot ? '&hot=true' : ''}`;
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 401) {
                Logger.error('API 401: Check ALI_APP_KEY and ALI_APP_SECRET');
                circuitBreaker.recordFailure();
                return null;
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            Logger.error('API returned error:', data.error);
            return null;
        }

        const items = data.result?.items || data.items || [];
        
        if (items.length > 0) {
            cacheManager.set(cacheKey, items);
            circuitBreaker.recordSuccess();
            Logger.info(`API Success: ${items.length} products received`);
            return items;
        } else if (isHot) {
            // Fallback: retry sin flag 'hot'
            Logger.info(`No hot products for "${keyword}", retrying normal search...`);
            return fetchWithRetry(keyword, false, retryCount);
        }

        return null;
    } catch (error) {
        Logger.warn(`API Error (attempt ${retryCount + 1}):`, error.message);
        circuitBreaker.recordFailure();

        // Retry logic con exponential backoff
        if (retryCount < CONFIG.MAX_RETRIES) {
            const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
            Logger.info(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(keyword, isHot, retryCount + 1);
        }

        return null;
    }
}

// ============================================================================
// 🎯 PRODUCT PROCESSING & RANKING
// ============================================================================

function processBestProducts(products) {
    if (!products || products.length === 0) return [];

    try {
        // Primero ordenar por conversiones (nuevo ranking automático)
        const sortedByConversions = sortByConversions(products);
        
        const sortedByQuality = [...sortedByConversions].sort((a, b) => {
            const scoreA = (parseFloat(a.rating) || 0) * 10 + (parseInt(a.sales) || 0) / 100;
            const scoreB = (parseFloat(b.rating) || 0) * 10 + (parseInt(b.sales) || 0) / 100;
            return scoreB - scoreA;
        });

        const cheapest = [...products]
            .filter(p => (parseFloat(p.rating) || 0) >= 4.2)
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];

        const bestValue = [...products]
            .filter(p => (parseInt(p.sales) || 0) > 50)
            .sort((a, b) => {
                const ratioA = (parseFloat(a.rating) || 0) / (parseFloat(a.price) || 1);
                const ratioB = (parseFloat(b.rating) || 0) / (parseFloat(b.price) || 1);
                return ratioB - ratioA;
            })[0];

        const topSales = [...products].sort((a, b) => (parseInt(b.sales) || 0) - (parseInt(a.sales) || 0))[0];

        return sortedByConversions.map(p => {
            const conversionCount = getConversionRank(p.id);
            if (conversionCount > 0) p.conversionCount = conversionCount;
            
            if (cheapest && p.id === cheapest.id) p.tag = "MEJOR PRECIO";
            else if (bestValue && p.id === bestValue.id) p.tag = "CALIDAD-PRECIO";
            else if (topSales && p.id === topSales.id) p.tag = "MÁS VENDIDO";
            else if ((parseFloat(p.rating) || 0) >= 4.8) p.tag = "RECOMENDADO";
            else if (conversionCount > 2) p.tag = "🔥 POPULAR";
            return p;
        });
    } catch (error) {
        Logger.error('Error processing products:', error);
        return products || [];
    }
}

// ============================================================================
// 🎨 UI RENDERING FUNCTIONS
// ============================================================================

/**
 * Genera un enlace de afiliado de Miravia con cacheo local
 */
function getMiraviaAffiliateUrl(productTitle) {
    try {
        const cacheKey = `miravia_cache_${productTitle.toLowerCase().trim()}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            return cached;
        }

        const AWIN_MID = "30521";
        const AWIN_AFFID = "1636287";
        const searchUrl = `https://www.miravia.es/search?q=${encodeURIComponent(productTitle)}`;
        const affiliateUrl = `https://www.awin1.com/cread.php?awinmid=${AWIN_MID}&awinaffid=${AWIN_AFFID}&ued=${encodeURIComponent(searchUrl)}`;
        
        // Guardar en caché por 24 horas
        localStorage.setItem(cacheKey, affiliateUrl);
        return affiliateUrl;
    } catch (e) {
        return `https://www.miravia.es/search?q=${encodeURIComponent(productTitle)}`;
    }
}

function renderProductCard(product) {
    const tagClass = product.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
    const hasOldPrice = product.original_price && parseFloat(product.original_price) > parseFloat(product.price);
    const oldPriceHtml = hasOldPrice ? `<span class="old-price">${product.original_price}€</span>` : '';
    const image = product.image || CONFIG.FALLBACK_PLACEHOLDER;
    const aliLink = product.url || product.link || '#';
    
    // Generación inteligente de enlace Miravia con caché
    const miraviaUrl = getMiraviaAffiliateUrl(product.title);

    // Lógica de "Mejor tienda" automática
    // Si el producto viene de un fallback de AliExpress (vacio o error), priorizamos Miravia visualmente
    const isAliFallback = !product.id || product.id === 'unknown';

    // NUEVO: Historial de precios y contador de conversiones
    const priceHistoryHtml = renderPriceHistory(product.id);
    const conversionBadge = product.conversionCount > 0 
        ? `<div style="font-size: 0.7rem; color: #ff9800; margin-top: 5px;">🔥 ${product.conversionCount} clicks</div>` 
        : '';

    return `
        <article class="card product-card ${isAliFallback ? 'priority-miravia' : ''}" style="position: relative;">
            ${product.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${product.tag}</div>` : ''}
            <div class="product-image-container">
                <img src="${image}" alt="${product.title}" loading="lazy" onerror="this.src='${CONFIG.FALLBACK_PLACEHOLDER}'">
            </div>
            <h3>${product.title || 'Producto'}</h3>
            <div class="price-container">
                ${oldPriceHtml}
                <span class="current-price">${product.price || '0'}€</span>
            </div>
            ${product.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${product.rating} | ${product.sales || 0}+ vendidos</div>` : ''}
            ${conversionBadge}
            ${priceHistoryHtml}
            
            <div class="product-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <a href="${aliLink}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored" 
                   style="order: ${isAliFallback ? 2 : 1}; opacity: ${isAliFallback ? 0.7 : 1}"
                   onclick="trackClick('${product.id || 'unknown'}', 'aliexpress', null, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    ${isAliFallback ? 'Buscar en AliExpress' : 'Comprar en AliExpress →'}
                </a>
                <a href="${miraviaUrl}" class="btn-miravia" target="_blank" rel="nofollow sponsored"
                   style="order: ${isAliFallback ? 1 : 2}; border-color: ${isAliFallback ? 'var(--primary)' : '#e2e8f0'}"
                   onclick="trackClick('${product.id || 'unknown'}', 'miravia', 'search_fallback', ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    ${isAliFallback ? '🚀 Ver en Miravia (Envío Rápido)' : 'Ver en Miravia (Awin)'}
                </a>
            </div>
        </article>
    `;
}

function renderLoadingSkeleton(count = 4) {
    return Array(count).fill(0).map(() => `
        <article class="card product-card skeleton-card">
            <div style="height: 180px; background: #2a3441; border-radius: 12px; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
            <div style="height: 20px; background: #2a3441; border-radius: 4px; width: 80%; animation: pulse 1.5s infinite 0.2s;"></div>
            <div style="height: 40px; background: #2a3441; border-radius: 8px; margin-top: 20px; animation: pulse 1.5s infinite 0.4s;"></div>
        </article>
    `).join('');
}

function renderEmptyState() {
    return '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 40px;">No hay ofertas disponibles en este momento. Por favor, intenta más tarde.</p>';
}

function renderErrorState() {
    return '<p style="grid-column: 1/-1; text-align: center; color: #ff4747; padding: 40px;">⚠️ Error al conectar con AliExpress. Mostrando resultados en caché.</p>';
}

// ============================================================================
// 🔍 PRODUCT SEARCH & DISPLAY
// ============================================================================

async function mostrarProductos(keyword, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading state
    container.innerHTML = renderLoadingSkeleton(4);

    try {
        // Use fused search (default: Banggood only)
        const products = await requestManager.execute(async () => {
            return await fusedSearch(keyword);
        }, 1); // Priority 1

        if (products && products.length > 0) {
            const processed = processBestProducts(products);
            const filtered = processed.slice(0, CONFIG.FALLBACK_PRODUCTS_COUNT);
            container.innerHTML = filtered.map(renderFusedProductCard).join('');
            Logger.info(`Displayed ${filtered.length} products for: ${keyword}`);
        } else {
            container.innerHTML = renderEmptyState();
        }
    } catch (error) {
        Logger.error('Error displaying products:', error);
        container.innerHTML = renderEmptyState();
    }
}

// ============================================================================
// 🏠 PAGE INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    Logger.info('🚀 DomoTechStore v3.0 Initializing');

    const rootPath = '/';
    const isSubfolder = window.location.pathname.includes('/categorias/') || 
                        window.location.pathname.includes('/comparativas/');
    const basePath = isSubfolder ? '../' : '';

    // Load components
    loadComponent('header-placeholder', `${rootPath}includes/header.html`, () => {
        loadComponent('menu-placeholder', `${rootPath}includes/menu.html`, () => {
            setupMobileMenu();
            fixLinks(rootPath);
        });
    });

    loadComponent('footer-placeholder', `${rootPath}includes/footer.html`, () => {
        fixLinks(rootPath);
    });

    // Generate SEO
    generateSEO(rootPath);

    // Load dynamic content
    loadFeatured(rootPath);
    loadTopSales(rootPath);
    automateProductLinks();

    // Check API health
    checkApiStatus();

    Logger.info('✅ DomoTechStore Initialized');
});

// ============================================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================================

function loadComponent(id, url, callback) {
    const container = document.getElementById(id);
    if (!container) return;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error loading ${url}`);
            return response.text();
        })
        .then(data => {
            container.innerHTML = data;
            if (callback) callback();
        })
        .catch(err => Logger.error(`Component load error: ${id}`, err));
}

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

function fixLinks(basePath) {
    const links = document.querySelectorAll('a');
    (links || []).forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
            if (!href.startsWith(basePath)) {
                link.href = basePath + href;
            }
        }
    });

    const images = document.querySelectorAll('img');
    (images || []).forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith(basePath)) {
            img.src = basePath + src;
        }
    });
}

function generateSEO(basePath) {
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
}

async function loadFeatured(basePath) {
    const container = document.getElementById('productos-destacados');
    if (!container) return;

    container.innerHTML = renderLoadingSkeleton(4);

    try {
        const products = await requestManager.execute(async () => {
            return await fusedSearch('top rated smart home gadgets');
        }, 0);

        if (products && products.length > 0) {
            const processed = processBestProducts(products);
            const filtered = processed.slice(0, 4);
            container.innerHTML = filtered.map(renderFusedProductCard).join('');
        } else {
            container.innerHTML = renderEmptyState();
        }
    } catch (error) {
        Logger.error('Load featured error:', error);
        container.innerHTML = renderEmptyState();
    }
}

async function loadTopSales(basePath) {
    const container = document.getElementById('top-ventas-categorias');
    if (!container) return;

    try {
        const res = await fetch(`${basePath}data/categorias.json`);
        const allCategories = await res.json();

        if (!allCategories || allCategories.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const selectedCategories = (allCategories || []).slice(0, 3);
        const results = await Promise.all(
            selectedCategories.map(cat => 
                requestManager.execute(() => fusedSearch(cat.keyword), 0)
            )
        );

        let hasContent = false;
        const html = selectedCategories.map((cat, idx) => {
            const product = results[idx]?.[0];
            if (!product) return '';

            hasContent = true;
            return `
                <div class="top-sales-item card">
                    <div style="width: 70px; height: 70px; flex-shrink: 0; background: #fff; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img src="${product.image || CONFIG.FALLBACK_PLACEHOLDER}" style="width: 90%; height: 90%; object-fit: contain;" loading="lazy" onerror="this.src='${CONFIG.FALLBACK_PLACEHOLDER}'">
                    </div>
                    <div style="flex-grow: 1; min-width: 0;">
                        <div class="cat-tag">${cat.nombre}</div>
                        <h4 style="font-size: 0.85rem; margin-bottom: 5px; height: 2.4em; overflow: hidden; line-height: 1.2;">${product.title}</h4>
                        <a href="${product.link || '#'}" class="btn-link" style="font-size: 0.75rem; margin: 0;" target="_blank" onclick="trackClick('${product.id}', 'top_sales')">Ver Top Venta →</a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = hasContent ? html : renderEmptyState();
    } catch (error) {
        Logger.error('Load top sales error:', error);
        container.innerHTML = renderEmptyState();
    }
}

async function automateProductLinks() {
    const emptyLinks = document.querySelectorAll('a[href="#"]');

    for (const link of emptyLinks) {
        // 1. Obtener el nombre del producto o categoría del contexto
        const card = link.closest('.card') || link.parentElement;
        
        // Si es una "clickable-info-card", usamos el texto descriptivo para una búsqueda más precisa
        const isInfoCard = link.classList.contains('clickable-info-card');
        const productName = isInfoCard 
            ? card.querySelector('p')?.textContent 
            : card.querySelector('h2, h3')?.textContent;
            
        const cleanName = (productName || "smart home").replace(/^\d+\.\s*/, '').trim();

        // 2. Configuración inicial
        link.target = "_blank";
        link.rel = "nofollow sponsored";
        link.textContent = "Buscando mejor oferta...";

        // 3. Si no es una info-card, intentamos match directo de producto
        if (!isInfoCard) {
            try {
                const products = await requestManager.execute(() => fusedSearch(cleanName), 0);
                
                // REGLA DE ORO: Solo si hay resultados y tienen un ID válido
                if (products && products.length > 0) {
                    const bestMatch = products[0];
                    if (bestMatch.link) {
                        link.href = bestMatch.link;
                        link.title = `Oferta real verificada: ${bestMatch.price}€`;
                        link.textContent = `Comprar ahora (${bestMatch.price}€) →`;
                    } else {
                        link.href = `https://www.banggood.com/search/${encodeURIComponent(cleanName)}.html`;
                        link.textContent = "Ver ofertas similares →";
                    }

                    // Actualizar imagen si es necesario
                    let imgEl = card.querySelector('img');
                    if (bestMatch.image && imgEl && (imgEl.src.includes('placeholder') || imgEl.src.includes('unsplash'))) {
                        imgEl.src = bestMatch.image;
                        imgEl.alt = bestMatch.title;
                    }
                } else {
                    link.href = `https://www.banggood.com/search/${encodeURIComponent(cleanName)}.html`;
                    link.textContent = "Ver en Banggood →";
                }
            } catch (err) {
                Logger.warn(`Error en automatización para "${cleanName}"`, err);
                link.href = `https://www.banggood.com/search/${encodeURIComponent(cleanName)}.html`;
                link.textContent = "Ver en Banggood →";
            }
        } else {
            // Categorías usan búsqueda controlada
            link.href = `https://www.banggood.com/search/${encodeURIComponent(cleanName)}.html`;
            link.textContent = "Explorar productos →";
        }
    }
}

async function checkApiStatus() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

        const res = await fetch(`${CONFIG.API_ENDPOINT}?keyword=test`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
            STATE.apiHealth.status = 'operational';
            STATE.apiHealth.lastCheck = Date.now();
            Logger.info('✅ API Status: Operational');
        } else if (res.status === 401) {
            Logger.error('⚠️ API 401: Check credentials');
            STATE.apiHealth.status = 'auth_failed';
        } else {
            Logger.warn(`⚠️ API Status: ${res.status}`);
            STATE.apiHealth.status = 'degraded';
        }
    } catch (error) {
        Logger.error('API health check failed:', error.message);
        STATE.apiHealth.status = 'offline';
        STATE.apiHealth.failureCount++;
    }
}

/**
 * Sistema de estadísticas de clics y conversiones (100% Autónomo)
 */
function trackClick(productId, provider, contextInfo = null, productData = null) {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": [], "total": 0, "interests": {}, "recently_viewed": [], "conversions": {}}');
        
        // Registrar el click
        stats.clicks.push({
            id: productId,
            provider: provider,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
        });
        stats.total++;

        // Registrar interés (keyword o categoría)
        if (contextInfo) {
            stats.interests[contextInfo] = (stats.interests[contextInfo] || 0) + 1;
        } else {
            const path = window.location.pathname;
            if (path.includes('/categorias/')) {
                const cat = path.split('/').pop().replace('.html', '');
                stats.interests[cat] = (stats.interests[cat] || 0) + 1;
            }
        }

        // NUEVO: Guardar en "Vistos recientemente"
        if (productData) {
            // Evitar duplicados: eliminar si ya existe y poner al principio
            stats.recently_viewed = stats.recently_viewed.filter(p => p.id !== productId);
            stats.recently_viewed.unshift({
                id: productId,
                title: productData.title,
                image: productData.image,
                price: productData.price,
                url: productData.url || productData.link,
                timestamp: Date.now()
            });
            // Limitar a los últimos 8 productos vistos
            if (stats.recently_viewed.length > 8) stats.recently_viewed.pop();
        }

        // NUEVO: Registrar conversiones (clicks = conversión simplificado)
        if (productId) {
            stats.conversions[productId] = (stats.conversions[productId] || 0) + 1;
        }

        // NUEVO: Guardar historial de precios y añadir a alertas automáticamente
        if (productData && productId) {
            trackPriceHistory(productId, productData);
            trackProductForPriceAlerts(productData);
        }
        
        if (stats.clicks.length > 100) stats.clicks.shift();
        
        localStorage.setItem('domotech_stats', JSON.stringify(stats));
        Logger.debug(`Click registrado: ${productId} | Recientemente visto actualizado`);
    } catch (e) {
        Logger.error("Error registrando click:", e);
    }
}

/**
 * NUEVO: Historial de precios por producto
 */
function trackPriceHistory(productId, productData) {
    try {
        const priceHistory = JSON.parse(localStorage.getItem('domotech_price_history') || '{}');
        const currentPrice = parseFloat(productData.price);

        if (!priceHistory[productId]) {
            priceHistory[productId] = [];
        }

        // Solo añadir si el precio es diferente o han pasado más de 1 hora
        const lastEntry = priceHistory[productId][priceHistory[productId].length - 1];
        const now = Date.now();
        const shouldAdd = !lastEntry || 
            Math.abs(lastEntry.price - currentPrice) > 0.01 || 
            (now - lastEntry.timestamp) > 3600000; // 1 hora

        if (shouldAdd) {
            priceHistory[productId].push({
                price: currentPrice,
                timestamp: now,
                title: productData.title,
                image: productData.image
            });

            // Limitar historial a 30 entradas
            if (priceHistory[productId].length > 30) {
                priceHistory[productId].shift();
            }

            localStorage.setItem('domotech_price_history', JSON.stringify(priceHistory));
            Logger.debug(`Precio registrado para ${productId}: ${currentPrice}€`);
        }
    } catch (e) {
        Logger.error("Error guardando historial de precios:", e);
    }
}

/**
 * NUEVO: Obtener el ranking de productos por conversiones
 */
function getConversionRank(productId) {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"conversions": {}}');
        return stats.conversions[productId] || 0;
    } catch (e) {
        return 0;
    }
}

/**
 * NUEVO: Ordenar productos por conversiones (ranking automático)
 */
function sortByConversions(products) {
    return [...products].sort((a, b) => {
        const rankA = getConversionRank(a.id);
        const rankB = getConversionRank(b.id);
        return rankB - rankA; // Mayor conversión primero
    });
}

/**
 * NUEVO: Encontrar productos similares (estilo "AI" - similitud textual)
 */
function findSimilarProducts(targetProduct, allProducts, limit = 4) {
    if (!targetProduct || !allProducts || allProducts.length === 0) return [];

    const targetWords = tokenize(targetProduct.title || '');
    const targetCat = targetProduct.categoria || '';

    const scored = allProducts
        .filter(p => p.id !== targetProduct.id)
        .map(p => {
            const productWords = tokenize(p.title || '');
            const wordOverlap = targetWords.filter(w => productWords.includes(w)).length;
            const catMatch = (p.categoria || '') === targetCat ? 5 : 0;
            const score = wordOverlap + catMatch;
            return { product: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return scored.map(item => item.product);
}

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-záéíóúñ0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

/**
 * NUEVO: Renderizar historial de precios (gráfica simple con CSS)
 */
function renderPriceHistory(productId) {
    try {
        const history = JSON.parse(localStorage.getItem('domotech_price_history') || '{}')[productId];
        if (!history || history.length < 2) return '';

        const prices = history.map(h => h.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        const bars = history.map((h, i) => {
            const height = ((h.price - min) / range) * 80 + 20; // 20-100px
            const isLast = i === history.length - 1;
            return `
                <div class="price-bar ${isLast ? 'current' : ''}" style="height: ${height}%;" title="${new Date(h.timestamp).toLocaleDateString()}: ${h.price}€"></div>
            `;
        }).join('');

        return `
            <div class="price-history" style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                <div style="font-size: 0.7rem; color: var(--muted-text); margin-bottom: 5px;">📊 Historial de precios</div>
                <div class="price-chart" style="display: flex; gap: 3px; align-items: flex-end; height: 60px;">
                    ${bars}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; margin-top: 3px;">
                    <span>⬇️ ${min.toFixed(2)}€</span>
                    <span>⬆️ ${max.toFixed(2)}€</span>
                </div>
            </div>
        `;
    } catch (e) {
        Logger.error("Error renderizando historial de precios:", e);
        return '';
    }
}

/**
 * NUEVO: Obtener y renderizar productos similares
 */
async function renderSimilarProducts(targetProduct, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Primero intentamos usar productos ya cargados, si no, buscamos
        let productsToSearch = [];
        
        // Intentamos obtener productos de la API con el mismo keyword
        const keyword = (targetProduct.categoria || targetProduct.title || 'smart home').replace(/-/g, ' ');
        const apiProducts = await fetchWithRetry(keyword, true);
        
        if (apiProducts && apiProducts.length > 0) {
            productsToSearch = apiProducts;
        }

        const similar = findSimilarProducts(targetProduct, productsToSearch, 3);

        if (similar.length > 0) {
            container.parentElement.style.display = 'block';
            container.innerHTML = similar.map(p => renderProductCard(p)).join('');
        } else {
            container.parentElement.style.display = 'none';
        }
    } catch (e) {
        Logger.error("Error renderizando productos similares:", e);
    }
}

// ============================================================================
// 📊 MÓDULO 1: TOP 10 DEL MES (datos reales de clicks/conversiones)
// ============================================================================
function getTop10DelMes() {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": []}');
        const now = new Date();
        const mesActual = now.getMonth();
        const añoActual = now.getFullYear();
        
        // Filtrar clicks del mes actual
        const clicksMes = stats.clicks.filter(click => {
            const clickDate = new Date(click.timestamp);
            return clickDate.getMonth() === mesActual && clickDate.getFullYear() === añoActual;
        });
        
        // Contar frecuencia por producto
        const contador = {};
        clicksMes.forEach(click => {
            if (click.id) {
                contador[click.id] = (contador[click.id] || 0) + 1;
            }
        });
        
        // Ordenar y tomar top 10
        const top10 = Object.entries(contador)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));
            
        return top10;
    } catch (e) {
        Logger.error("Error obteniendo Top 10 del mes:", e);
        return [];
    }
}

async function renderTop10DelMes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const top10 = getTop10DelMes();
        if (top10.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.5;">Aún no hay datos suficientes para el Top 10 del mes</p>';
            return;
        }
        
        // Intentar cargar detalles de productos (simulado por ahora)
        let html = '<div style="display:grid; gap:15px;">';
        top10.forEach((item, index) => {
            html += `
                <div class="card" style="display:flex; align-items:center; gap:15px; padding:15px;">
                    <div style="width:40px; height:40px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">
                        ${index + 1}
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:700;">Producto ID: ${item.id}</div>
                        <div style="font-size:0.85rem; color:var(--muted-text);">${item.count} clicks este mes</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (e) {
        Logger.error("Error renderizando Top 10 del mes:", e);
    }
}

// ============================================================================
// 🎯 MÓDULO 2: RECOMENDACIÓN PERSONAL POR USUARIO (mejorada)
// ============================================================================
function getUserInterests() {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"interests": {}}');
        return Object.entries(stats.interests)
            .sort((a, b) => b[1] - a[1]);
    } catch (e) {
        return [];
    }
}

async function renderRecomendacionesPersonalizadas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const interests = getUserInterests();
        if (interests.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.5;">Explora productos para generar recomendaciones personalizadas</p>';
            return;
        }
        
        // Usar el interés principal para buscar productos
        const topInterest = interests[0][0];
        const keyword = topInterest.replace(/-/g, ' ');
        const products = await fetchWithRetry(keyword, true);
        
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(renderProductCard).join('');
        } else {
            container.innerHTML = '<p style="text-align:center; opacity:0.5;">No hay productos disponibles para tus intereses</p>';
        }
        
    } catch (e) {
        Logger.error("Error renderizando recomendaciones personalizadas:", e);
    }
}

// ============================================================================
// 📈 MÓDULO 3: PANEL DE ANALÍTICA INTERNO (DASHBOARD)
// ============================================================================
function renderAnaliticaDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": [], "total": 0, "interests": {}}');
        const top10 = getTop10DelMes();
        const priceHistory = JSON.parse(localStorage.getItem('domotech_price_history') || '{}');
        
        const productosTrackeados = Object.keys(priceHistory).length;
        
        container.innerHTML = `
            <div class="grid grid-3" style="margin-bottom:40px;">
                <div class="card" style="text-align:center;">
                    <div style="font-size:3rem; font-weight:800; color:var(--primary);">${stats.total}</div>
                    <div style="color:var(--muted-text); text-transform:uppercase; font-size:0.9rem; font-weight:700;">Clicks Totales</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div style="font-size:3rem; font-weight:800; color:#22c55e;">${top10.length}</div>
                    <div style="color:var(--muted-text); text-transform:uppercase; font-size:0.9rem; font-weight:700;">Top Productos Mes</div>
                </div>
                <div class="card" style="text-align:center;">
                    <div style="font-size:3rem; font-weight:800; color:#f59e0b;">${productosTrackeados}</div>
                    <div style="color:var(--muted-text); text-transform:uppercase; font-size:0.9rem; font-weight:700;">Precios Trackeados</div>
                </div>
            </div>
            
            <div class="grid grid-2">
                <div class="card">
                    <h3 style="margin-bottom:20px; font-weight:700;">📊 Intereses del Usuario</h3>
                    ${Object.entries(stats.interests).length > 0 
                        ? Object.entries(stats.interests).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([key, count]) => `
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px;">
                                <span>${key}</span>
                                <span style="font-weight:700; color:var(--primary);">${count}</span>
                            </div>
                        `).join('')
                        : '<p style="opacity:0.5;">Aún no hay datos de intereses</p>'
                    }
                </div>
                <div class="card">
                    <h3 style="margin-bottom:20px; font-weight:700;">🏆 Top 10 del Mes</h3>
                    <div id="top10-dashboard"></div>
                </div>
            </div>
            
            <div style="margin-top:30px; text-align:center;">
                <button onclick="limpiarDatosAnalitica()" class="btn-aliexpress" style="padding:10px 30px;">🧹 Limpiar Datos de Analítica</button>
            </div>
        `;
        
        // Renderizar top 10 dentro del dashboard
        renderTop10DelMes('top10-dashboard');
        
    } catch (e) {
        Logger.error("Error renderizando dashboard:", e);
    }
}

function limpiarDatosAnalitica() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos de analítica?')) {
        localStorage.removeItem('domotech_stats');
        localStorage.removeItem('domotech_price_history');
        alert('Datos limpiados correctamente');
        location.reload();
    }
}

// ============================================================================
// 🔔 MÓDULO 4: SISTEMA DE ALERTAS DE BAJADA DE PRECIO
// ============================================================================
function trackProductForPriceAlerts(product) {
    try {
        const alerts = JSON.parse(localStorage.getItem('domotech_price_alerts') || '[]');
        const existing = alerts.find(a => a.id === product.id);
        
        if (!existing) {
            alerts.push({
                id: product.id,
                title: product.title,
                image: product.image,
                initialPrice: parseFloat(product.price),
                currentPrice: parseFloat(product.price),
                lowestPrice: parseFloat(product.price),
                addedAt: Date.now()
            });
            localStorage.setItem('domotech_price_alerts', JSON.stringify(alerts));
            Logger.info(`Producto añadido a alertas de precio: ${product.title}`);
            return true;
        }
        return false;
    } catch (e) {
        Logger.error("Error añadiendo alerta de precio:", e);
        return false;
    }
}

function checkPriceDrops() {
    try {
        const alerts = JSON.parse(localStorage.getItem('domotech_price_alerts') || '[]');
        const priceHistory = JSON.parse(localStorage.getItem('domotech_price_history') || '{}');
        const drops = [];
        
        alerts.forEach(alert => {
            const history = priceHistory[alert.id];
            if (history && history.length >= 2) {
                const latest = history[history.length - 1];
                const previous = history[history.length - 2];
                
                if (latest.price < alert.initialPrice) {
                    const dropPercent = Math.round(((alert.initialPrice - latest.price) / alert.initialPrice) * 100);
                    drops.push({
                        ...alert,
                        newPrice: latest.price,
                        dropPercent
                    });
                    
                    // Actualizar alerta con el precio más bajo
                    if (latest.price < alert.lowestPrice) {
                        alert.lowestPrice = latest.price;
                    }
                    alert.currentPrice = latest.price;
                }
            }
        });
        
        // Guardar alertas actualizadas
        localStorage.setItem('domotech_price_alerts', JSON.stringify(alerts));
        
        return drops;
    } catch (e) {
        Logger.error("Error comprobando bajadas de precio:", e);
        return [];
    }
}

function showPriceDropAlerts() {
    const drops = checkPriceDrops();
    if (drops.length === 0) return;
    
    // Crear notificación simple en la página
    const notificationContainer = document.createElement('div');
    notificationContainer.style.cssText = 'position:fixed; top:100px; right:20px; z-index:10000; max-width:350px;';
    
    drops.forEach(drop => {
        const notification = document.createElement('div');
        notification.className = 'card';
        notification.style.cssText = 'margin-bottom:10px; animation:slideIn 0.3s ease;';
        notification.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${drop.image}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:0.9rem;">🔔 ¡Bajada de precio!</div>
                    <div style="font-size:0.8rem; color:var(--muted-text);">${drop.title}</div>
                    <div style="margin-top:5px;">
                        <span style="text-decoration:line-through; opacity:0.5;">${drop.initialPrice}€</span>
                        <span style="margin-left:8px; color:#22c55e; font-weight:700;">${drop.newPrice}€ (-${drop.dropPercent}%)</span>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:var(--muted-text); font-size:1.2rem;">×</button>
            </div>
        `;
        notificationContainer.appendChild(notification);
    });
    
    document.body.appendChild(notificationContainer);
    
    // Autoeliminar después de 10 segundos
    setTimeout(() => {
        if (notificationContainer.parentElement) {
            notificationContainer.remove();
        }
    }, 10000);
}

// Función para mostrar la página del dashboard (si existe)
function initDashboard() {
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        renderAnaliticaDashboard('dashboard-container');
    }
    
    // Comprobar alertas de precio al cargar la página
    setTimeout(showPriceDropAlerts, 2000);
}

// Añadir animación CSS para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Exponer funciones globalmente
window.limpiarDatosAnalitica = limpiarDatosAnalitica;
window.trackProductForPriceAlerts = trackProductForPriceAlerts;

// ============================================================================
// 🛒 MÓDULO 1: INTEGRACIÓN BANGGOOD COMPLETA + NORMALIZACIÓN (100% FRONTEND)
// ============================================================================

// ⚙️ CONFIGURACIÓN PRINCIPAL
const STORE_SETTINGS = {
    ALIEXPRESS_ENABLED: false, // TEMPORALMENTE DESACTIVADO, pon true para activar
    BANGGOOD_ENABLED: true
};

const STORE_CONFIG = {
    ALIEXPRESS: {
        name: 'AliExpress',
        color: '#ff4747',
        prefix: 'ali_'
    },
    BANGGOOD: {
        name: 'Banggood',
        color: '#2196F3',
        prefix: 'bg_'
    }
};

// Credenciales de Banggood (directamente en frontend, seguro según Banggood)
const BANGGOOD_CONFIG = {
    APP_KEY: 'aff6a1a99947bda',
    APP_SECRET: '7dbad72d5973308abd6b9fe65b0cc4db',
    API_URL: 'https://api.banggood.com/api/search',
    AFFILIATE_ID: '' // Añade tu ID de afiliado aquí si lo tienes
};

// Normalizador de productos para unificar formatos
function normalizeProduct(product, store) {
    const config = STORE_CONFIG[store.toUpperCase()];
    
    // Extraer campos comunes
    const productId = product.product_id || product.id || product.productId || null;
    const title = product.title || product.name || product.product_name || 'Producto sin nombre';
    const price = parseFloat(product.price || product.sale_price || product.salePrice || product.original_price || product.originalPrice || 0);
    const originalPrice = parseFloat(product.original_price || product.originalPrice || price);
    const image = product.image || product.image_url || product.imageUrl || product.thumbnail || product.product_image || CONFIG.FALLBACK_PLACEHOLDER;
    const rating = parseFloat(product.rating || product.starRating || product.evaluate_rate || 0);
    const sales = parseInt(product.sales || product.orderCount || product.soldCount || product.last_thirty_days_relevant_shelf_commission || 0);
    
    let link = product.url || product.link || product.product_url || product.productUrl || product.product_detail_url || '#';
    
    // Para Banggood: Construir URL usando product_id para evitar enlaces rotos
    if (store === 'BANGGOOD' && productId) {
        let baseUrl = `https://www.banggood.com/${productId}.html`;
        
        if (BANGGOOD_CONFIG.AFFILIATE_ID) {
            baseUrl += `?affid=${BANGGOOD_CONFIG.AFFILIATE_ID}`;
        }
        
        link = baseUrl;
    } else if (store === 'BANGGOOD' && !productId && !product.url && !product.product_url) {
        // Si no hay ID ni URL válida, descartar el producto
        Logger.warn('[BANGGOOD] Descartando producto sin ID válido:', title);
        return null;
    }
    
    // Para AliExpress, mantener la lógica original
    if (store === 'ALIEXPRESS' && BANGGOOD_CONFIG.AFFILIATE_ID && link) {
        link = link.includes('?') 
            ? `${link}&affid=${BANGGOOD_CONFIG.AFFILIATE_ID}`
            : `${link}?affid=${BANGGOOD_CONFIG.AFFILIATE_ID}`;
    }
    
    const finalId = productId || `unknown_${Date.now()}`;
    
    return {
        id: `${config.prefix}${finalId}`,
        originalId: finalId,
        title,
        price,
        originalPrice,
        image,
        rating,
        sales,
        link,
        store: store.toUpperCase(),
        storeName: config.name,
        storeColor: config.color,
        tag: null,
        timestamp: Date.now()
    };
}

// Módulo de búsqueda Banggood usando el Worker de Cloudflare
async function searchBanggood(keyword) {
    try {
        Logger.info('[BANGGOOD] Buscando usando Worker Cloudflare:', keyword);
        
        const url = `/banggood?q=${encodeURIComponent(keyword)}&page=1&pageSize=20`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 0) {
            console.warn("[BANGGOOD] Error:", data);
            // Fallback: productos de demostración
            Logger.warn('[BANGGOOD] Usando productos de fallback');
            const demoProducts = [
                {
                    product_id: '1234567',
                    title: `Enchufe Inteligente WiFi - ${keyword}`,
                    price: Math.floor(Math.random() * 30) + 8,
                    original_price: Math.floor(Math.random() * 50) + 20,
                    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
                    rating: 4.0 + Math.random() * 0.8,
                    sales: Math.floor(Math.random() * 1000) + 100
                },
                {
                    product_id: '2345678',
                    title: `Bombilla LED RGB WiFi - ${keyword}`,
                    price: Math.floor(Math.random() * 20) + 5,
                    original_price: Math.floor(Math.random() * 40) + 15,
                    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
                    rating: 4.3 + Math.random() * 0.6,
                    sales: Math.floor(Math.random() * 2000) + 200
                },
                {
                    product_id: '3456789',
                    title: `Cámara de Seguridad WiFi - ${keyword}`,
                    price: Math.floor(Math.random() * 80) + 20,
                    original_price: Math.floor(Math.random() * 120) + 40,
                    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
                    rating: 4.1 + Math.random() * 0.7,
                    sales: Math.floor(Math.random() * 800) + 80
                },
                {
                    product_id: '4567890',
                    title: `Sensor de Movimiento Zigbee - ${keyword}`,
                    price: Math.floor(Math.random() * 25) + 7,
                    original_price: Math.floor(Math.random() * 45) + 18,
                    image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
                    rating: 4.4 + Math.random() * 0.5,
                    sales: Math.floor(Math.random() * 600) + 60
                }
            ];
            return demoProducts.map(p => normalizeProduct(p, 'BANGGOOD'));
        }

        const items = data.data?.products || [];
        Logger.info('[BANGGOOD] Éxito desde Worker:', items.length, 'productos');
        
        if (items.length > 0) {
            const normalized = items
                .map(p => normalizeProduct(p, 'BANGGOOD'))
                .filter(p => p !== null);
            
            Logger.info('[BANGGOOD] Productos válidos después de filtrar:', normalized.length);
            
            if (normalized.length > 0) {
                return normalized;
            }
        }

    } catch (e) {
        Logger.warn('[BANGGOOD] Error en Worker, usando fallback:', e.message);
        // Fallback: productos de demostración
        Logger.warn('[BANGGOOD] Usando productos de fallback');
        const demoProducts = [
            {
                product_id: '1234567',
                title: `Enchufe Inteligente WiFi - ${keyword}`,
                price: Math.floor(Math.random() * 30) + 8,
                original_price: Math.floor(Math.random() * 50) + 20,
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
                rating: 4.0 + Math.random() * 0.8,
                sales: Math.floor(Math.random() * 1000) + 100
            },
            {
                product_id: '2345678',
                title: `Bombilla LED RGB WiFi - ${keyword}`,
                price: Math.floor(Math.random() * 20) + 5,
                original_price: Math.floor(Math.random() * 40) + 15,
                image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
                rating: 4.3 + Math.random() * 0.6,
                sales: Math.floor(Math.random() * 2000) + 200
            },
            {
                product_id: '3456789',
                title: `Cámara de Seguridad WiFi - ${keyword}`,
                price: Math.floor(Math.random() * 80) + 20,
                original_price: Math.floor(Math.random() * 120) + 40,
                image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=400&q=80',
                rating: 4.1 + Math.random() * 0.7,
                sales: Math.floor(Math.random() * 800) + 80
            },
            {
                product_id: '4567890',
                title: `Sensor de Movimiento Zigbee - ${keyword}`,
                price: Math.floor(Math.random() * 25) + 7,
                original_price: Math.floor(Math.random() * 45) + 18,
                image: 'https://images.unsplash.com/photo-1558002038-103792e17734?auto=format&fit=crop&w=400&q=80',
                rating: 4.4 + Math.random() * 0.5,
                sales: Math.floor(Math.random() * 600) + 60
            }
        ];
        return demoProducts.map(p => normalizeProduct(p, 'BANGGOOD'));
    }
}

// ============================================================================
// 🔗 MÓDULO 2: MOTOR DE FUSIÓN ALIEXPRESS + BANGGOOD
// ============================================================================
async function fusedSearch(keyword, options = {}) {
    const { 
        prioritize = 'bg-first', // 'best-price', 'ali-first', 'bg-first' (ahora bg-first por defecto)
        maxItems = 20,
        useFallback = true
    } = options;
    
    Logger.info(`[FUSION] Buscando "${keyword}" con estrategia: ${prioritize}`);
    
    // Preparar búsquedas según tiendas activas
    const searchPromises = [];
    
    if (STORE_SETTINGS.ALIEXPRESS_ENABLED) {
        searchPromises.push(
            fetchWithRetry(keyword, true).then(p => (p || []).map(prod => normalizeProduct({...prod, id: prod.id}, 'ALIEXPRESS')))
        );
    }
    
    if (STORE_SETTINGS.BANGGOOD_ENABLED) {
        searchPromises.push(searchBanggood(keyword));
    }
    
    // Ejecutar búsquedas
    const results = await Promise.allSettled(searchPromises);
    
    // Obtener resultados exitosos
    let allResults = [];
    
    if (STORE_SETTINGS.ALIEXPRESS_ENABLED && results[0]?.status === 'fulfilled') {
        allResults = [...allResults, ...results[0].value];
    }
    if (STORE_SETTINGS.BANGGOOD_ENABLED && results[STORE_SETTINGS.ALIEXPRESS_ENABLED ? 1 : 0]?.status === 'fulfilled') {
        allResults = [...allResults, ...results[STORE_SETTINGS.ALIEXPRESS_ENABLED ? 1 : 0].value];
    }
    
    // Ordenar resultados
    let fusedResults = allResults;
    // Aplicar estrategia de priorización
    switch (prioritize) {
        case 'best-price':
            fusedResults.sort((a, b) => a.price - b.price);
            break;
        case 'ali-first':
            fusedResults.sort((a, b) => (a.store === 'ALIEXPRESS' ? -1 : 1));
            break;
        case 'bg-first':
        default:
            fusedResults.sort((a, b) => (a.store === 'BANGGOOD' ? -1 : 1));
            break;
    }
    
    // Eliminar duplicados (mismo título)
    const seenTitles = new Set();
    fusedResults = fusedResults.filter(p => {
        const normalizedTitle = p.title.toLowerCase().substring(0, 50);
        if (seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
        return true;
    });
    
    Logger.info(`[FUSION] Resultados: ${allResults.length} productos totales`);
    
    return fusedResults.slice(0, maxItems);
}

// ============================================================================
// ⚡ MÓDULO 3: OFERTAS REALES (basado en historial de precios)
// ============================================================================
function getRealDeals(minDiscountPercent = 10) {
    try {
        const priceHistory = JSON.parse(localStorage.getItem('domotech_price_history') || '{}');
        const deals = [];
        
        for (const productId in priceHistory) {
            const history = priceHistory[productId];
            if (history.length < 2) continue;
            
            const firstPrice = history[0].price;
            const currentPrice = history[history.length - 1].price;
            const discountPercent = Math.round(((firstPrice - currentPrice) / firstPrice) * 100);
            
            if (discountPercent >= minDiscountPercent) {
                deals.push({
                    id: productId,
                    title: history[history.length - 1].title,
                    image: history[history.length - 1].image,
                    firstPrice,
                    currentPrice,
                    discountPercent,
                    savings: firstPrice - currentPrice,
                    history
                });
            }
        }
        
        // Ordenar por descuento (mayor primero)
        return deals.sort((a, b) => b.discountPercent - a.discountPercent);
    } catch (e) {
        Logger.error('[REAL DEALS] Error:', e);
        return [];
    }
}

// ============================================================================
// 📈 MÓDULO 4: PRODUCTOS EN TENDENCIA
// ============================================================================
function getTrendingProducts(timeWindowHours = 24) {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": []}');
        const now = Date.now();
        const cutoffTime = now - (timeWindowHours * 60 * 60 * 1000);
        
        // Contar clicks por producto en el período
        const clickCount = {};
        const recentClicks = stats.clicks.filter(click => {
            const clickDate = new Date(click.timestamp).getTime();
            return clickDate > cutoffTime;
        });
        
        recentClicks.forEach(click => {
            if (!click.id) return;
            clickCount[click.id] = (clickCount[click.id] || 0) + 1;
        });
        
        // Calcular "tendencia" (comparar con período anterior)
        const previousCutoff = cutoffTime - (timeWindowHours * 60 * 60 * 1000);
        const previousClickCount = {};
        
        stats.clicks.filter(click => {
            const clickDate = new Date(click.timestamp).getTime();
            return clickDate > previousCutoff && clickDate < cutoffTime;
        }).forEach(click => {
            if (!click.id) return;
            previousClickCount[click.id] = (previousClickCount[click.id] || 0) + 1;
        });
        
        const trending = Object.entries(clickCount)
            .map(([id, count]) => {
                const previousCount = previousClickCount[id] || 0;
                const growthPercent = previousCount > 0 
                    ? Math.round(((count - previousCount) / previousCount) * 100)
                    : 999; // Producto nuevo = 999% growth
                
                return { id, count, previousCount, growthPercent };
            })
            .sort((a, b) => b.growthPercent - a.growthPercent);
        
        return trending;
    } catch (e) {
        Logger.error('[TRENDING] Error:', e);
        return [];
    }
}

function getTrendingCategories() {
    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"interests": {}}');
        return Object.entries(stats.interests)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    } catch (e) {
        return [];
    }
}

// ============================================================================
// ✨ MÓDULO 5: OPTIMIZACIONES UX
// ============================================================================
// Skeleton Loaders (ya existentes, mejorados)
function renderAdvancedSkeleton(count = 4, type = 'product-card') {
    if (type === 'product-card') {
        return Array(count).fill(0).map(() => `
            <article class="card product-card skeleton-card" style="opacity:0.7;">
                <div style="height: 180px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
                <div style="height: 20px; background: rgba(255,255,255,0.05); border-radius: 4px; width: 80%; margin-bottom: 10px; animation: pulse 1.5s infinite 0.1s;"></div>
                <div style="height: 30px; background: rgba(255,255,255,0.05); border-radius: 4px; width: 50%; margin-bottom: 15px; animation: pulse 1.5s infinite 0.2s;"></div>
                <div style="height: 40px; background: rgba(255,255,255,0.05); border-radius: 8px; width: 100%; animation: pulse 1.5s infinite 0.3s;"></div>
            </article>
        `).join('');
    }
    return '';
}

// Sistema de filtros avanzados
const PRODUCT_FILTERS = {
    priceRange: [0, Infinity],
    stores: ['ALIEXPRESS', 'BANGGOOD'],
    minRating: 0,
    sortBy: 'default' // 'default', 'price-asc', 'price-desc', 'rating', 'sales'
};

function applyFilters(products, filters = PRODUCT_FILTERS) {
    return products.filter(p => {
        const priceOk = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
        const storeOk = filters.stores.includes(p.store);
        const ratingOk = p.rating >= filters.minRating;
        return priceOk && storeOk && ratingOk;
    }).sort((a, b) => {
        switch (filters.sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'rating': return b.rating - a.rating;
            case 'sales': return b.sales - a.sales;
            default: return 0;
        }
    });
}

// Renderizar tarjeta de producto mejorada con información de tienda
function renderFusedProductCard(product) {
    const hasOldPrice = product.originalPrice > product.price;
    const oldPriceHtml = hasOldPrice ? `<span class="old-price" style="opacity:0.6;text-decoration:line-through;">${product.originalPrice.toFixed(2)}€</span>` : '';
    const discountHtml = hasOldPrice ? `
        <span style="background:#22c55e;color:white;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;margin-left:8px;">
            -${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
        </span>` : '';
    
    // Convertir product.price a número si es string
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const originalPrice = product.originalPrice ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice) : price;
    
    // Historial de precios y contador de conversiones
    const priceHistoryHtml = renderPriceHistory(product.id);
    const conversionBadge = product.conversionCount > 0 
        ? `<div style="font-size: 0.7rem; color: #ff9800; margin-top: 5px;">🔥 ${product.conversionCount} clicks</div>` 
        : '';
    
    return `
        <article class="card product-card" style="position:relative;transition:transform 0.3s ease, box-shadow 0.3s ease;">
            ${product.tag ? `<div class="badge" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${product.tag}</div>` : ''}
            <div class="product-image-container" style="overflow:hidden;">
                <img src="${product.image}" alt="${product.title}" loading="lazy" 
                     onerror="this.src='${CONFIG.FALLBACK_PLACEHOLDER}'"
                     style="transition:transform 0.3s ease;">
            </div>
            
            <h3 style="font-size:0.95rem;line-height:1.4;">${product.title}</h3>
            
            <div class="price-container" style="display:flex;align-items:center;gap:8px;margin:10px 0;">
                ${oldPriceHtml}
                <span class="current-price" style="font-size:1.3rem;font-weight:800;">${price.toFixed(2)}€</span>
                ${discountHtml}
            </div>
            
            ${product.rating ? `<div style="font-size:0.8rem;color:var(--muted-text);margin-bottom:10px;">⭐ ${(typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating).toFixed(1)} | ${product.sales || 0} vendidos</div>` : ''}
            ${conversionBadge}
            ${priceHistoryHtml}
            
            <div class="product-actions" style="display:flex;flex-direction:column;gap:10px;margin-top: 15px;">
                <a href="${product.link}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored"
                   onclick="trackClick('${product.id}', 'banggood', null, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    Comprar Ahora →
                </a>
            </div>
        </article>
    `;
}

// ============================================================================
// � FUNCIONES EXTRA PARA NUEVOS ENDPOINTS
// ============================================================================

async function searchBanggoodProducts(keyword, page = 1, pageSize = 20) {
    try {
        const url = `/banggood/search?q=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 0) {
            console.warn("[BANGGOOD] Error searching:", data);
            return [];
        }

        const items = data.data?.products || [];
        return items
            .map(p => normalizeProduct(p, 'BANGGOOD'))
            .filter(p => p !== null);
    } catch (e) {
        console.error("[BANGGOOD] Search error:", e);
        return [];
    }
}

async function getBanggoodProductDetails(productId) {
    try {
        const url = `/banggood/details?productId=${encodeURIComponent(productId)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 0) {
            console.warn("[BANGGOOD] Error fetching details:", data);
            return null;
        }

        return data.data?.product || null;
    } catch (e) {
        console.error("[BANGGOOD] Details error:", e);
        return null;
    }
}

async function getBanggoodOffers(page = 1, pageSize = 20) {
    try {
        const url = `/banggood/offers?page=${page}&pageSize=${pageSize}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 0) {
            console.warn("[BANGGOOD] Error fetching offers:", data);
            return [];
        }

        const items = data.data?.products || [];
        return items
            .map(p => normalizeProduct(p, 'BANGGOOD'))
            .filter(p => p !== null);
    } catch (e) {
        console.error("[BANGGOOD] Offers error:", e);
        return [];
    }
}

async function getBanggoodCategories() {
    try {
        const url = `/banggood/categories`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 0) {
            console.warn("[BANGGOOD] Error fetching categories:", data);
            return [];
        }

        return data.data?.categories || [];
    } catch (e) {
        console.error("[BANGGOOD] Categories error:", e);
        return [];
    }
}

// ============================================================================
// �🌐 EXPORTAR FUNCIONES GLOBALES
// ============================================================================
window.fusedSearch = fusedSearch;
window.searchBanggood = searchBanggood;
window.searchBanggoodProducts = searchBanggoodProducts;
window.getBanggoodProductDetails = getBanggoodProductDetails;
window.getBanggoodOffers = getBanggoodOffers;
window.getBanggoodCategories = getBanggoodCategories;
window.normalizeProduct = normalizeProduct;
window.getRealDeals = getRealDeals;
window.getTrendingProducts = getTrendingProducts;
window.getTrendingCategories = getTrendingCategories;
window.applyFilters = applyFilters;
window.renderFusedProductCard = renderFusedProductCard;
window.renderAdvancedSkeleton = renderAdvancedSkeleton;

/**
 * Carga los productos vistos recientemente por el usuario
 */
function loadRecentlyViewed() {
    const container = document.getElementById('vistos-recientemente');
    if (!container) return;

    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{}');
        const recently = stats.recently_viewed || [];

        if (recently.length > 0) {
            container.innerHTML = recently.slice(0, 4).map(p => `
                <article class="card product-card small-card">
                    <div class="product-image-container" style="height: 120px;">
                        <img src="${p.image}" alt="${p.title}" style="max-height: 100px;">
                    </div>
                    <h4 style="font-size: 0.8rem; height: 2.6em; overflow: hidden; margin-bottom: 8px;">${p.title}</h4>
                    <div class="price-container">
                        <span class="current-price" style="font-size: 1rem;">${p.price}€</span>
                    </div>
                    <a href="${p.url}" class="btn-aliexpress" style="padding: 6px; font-size: 0.7rem; margin-top: 10px;" target="_blank">Volver a ver →</a>
                </article>
            `).join('');
            container.parentElement.style.display = 'block';
        } else {
            container.parentElement.style.display = 'none';
        }
    } catch (e) {
        Logger.error("Error cargando vistos recientemente:", e);
    }
}

/**
 * Carga recomendaciones personalizadas basadas en el comportamiento del usuario
 */
async function loadPersonalizedRecommendations(basePath) {
    const container = document.getElementById('recomendaciones-usuario');
    if (!container) return;

    try {
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{}');
        const interests = stats.interests || {};
        
        // Obtener el interés principal
        const sortedInterests = Object.entries(interests).sort((a, b) => b[1] - a[1]);
        
        let keyword = "smart home gadgets"; // Fallback por defecto
        let title = "Recomendaciones para tu hogar";

        if (sortedInterests.length > 0) {
            const topInterest = sortedInterests[0][0];
            keyword = topInterest.replace(/-/g, ' ');
            title = `Basado en tu interés en "${keyword.toUpperCase()}"`;
        }

        const titleEl = document.getElementById('recomendaciones-titulo');
        if (titleEl) titleEl.textContent = title;

        // Usar fetchWithRetry (la función real de la API)
        const products = await fetchWithRetry(keyword, true);
        if (products && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(p => {
                const tagClass = p.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
                const hasOldPrice = p.original_price && parseFloat(p.original_price) > parseFloat(p.price);
                const oldPriceHtml = hasOldPrice ? `<span class="old-price">${p.original_price}€</span>` : '';
                return `
                <article class="card product-card" style="position: relative;">
                    ${p.tag ? `<div class="${tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                    <div class="urgency-badge">⚡ ¡OFERTA REAL!</div>
                    <div class="product-image-container">
                        <img src="${p.image || CONFIG.FALLBACK_PLACEHOLDER}" alt="${p.title}" loading="lazy" onerror="this.src='${CONFIG.FALLBACK_PLACEHOLDER}'">
                    </div>
                    <h3>${p.title}</h3>
                    <div class="price-container">
                        ${oldPriceHtml}
                        <span class="current-price">${p.price}€</span>
                    </div>
                    ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px; margin-bottom: 10px;">⭐ ${p.rating} | ${p.sales || 0}+ vendidos</div>` : ''}
                    <a href="${p.url || p.link}" class="btn-aliexpress" target="_blank" onclick="trackClick('${p.id}', 'aliexpress', '${keyword}', ${JSON.stringify(p).replace(/"/g, '&quot;')})">Comprar Ahora →</a>
                </article>
                `;
            }).join('');
        } else {
            if (container.parentElement) container.parentElement.style.display = 'none';
        }
    } catch (e) {
        Logger.error("Error cargando recomendaciones:", e);
    }
}

// Conexión automática con AliExpress (Ofertas del día y Recomendaciones)
document.addEventListener("DOMContentLoaded", () => {
    if (typeof mostrarProductos === 'function') {
        mostrarProductos("smart home", "ofertas-dia");
    }
    
    // Inicializar módulos avanzados
    initDashboard();
    
    // Cargar recomendaciones y vistos recientemente después de un breve delay
    setTimeout(() => {
        loadPersonalizedRecommendations('/');
        loadRecentlyViewed();
    }, 1500);
});

// ============================================================================
// 📊 MONITORING & DEBUG CONSOLE
// ============================================================================

function getDiagnostics() {
    return {
        uptime: Math.round((Date.now() - performance.timing.navigationStart) / 1000) + 's',
        cache: cacheManager.getStats(),
        requestManager: requestManager.getStats(),
        circuitBreaker: {
            state: circuitBreaker.state,
            failureCount: circuitBreaker.failureCount
        },
        apiHealth: STATE.apiHealth,
        timestamp: new Date().toISOString()
    };
}

// Expose diagnostics to window for debugging
window.DOMOTECH = {
    diagnostics: getDiagnostics,
    logger: Logger,
    config: CONFIG,
    clearCache: () => {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('domotech_cache_')) localStorage.removeItem(key);
        }
        Logger.info('Cache cleared');
    },
    forceApiCheck: () => checkApiStatus(),
    showStats: () => console.table(getDiagnostics())
};

Logger.info('🔧 Debug mode enabled. Type: DOMOTECH.showStats() to see diagnostics');

// Auto-check API health every 5 minutes
setInterval(checkApiStatus, 5 * 60 * 1000);

// Auto-cleanup cache every 30 minutes
setInterval(() => cacheManager.cleanupOldEntries(), 30 * 60 * 1000);
