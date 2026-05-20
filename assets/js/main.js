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
        const sortedByQuality = [...products].sort((a, b) => {
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

        return sortedByQuality.map(p => {
            if (cheapest && p.id === cheapest.id) p.tag = "MEJOR PRECIO";
            else if (bestValue && p.id === bestValue.id) p.tag = "CALIDAD-PRECIO";
            else if (topSales && p.id === topSales.id) p.tag = "MÁS VENDIDO";
            else if ((parseFloat(p.rating) || 0) >= 4.8) p.tag = "RECOMENDADO";
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

function renderProductCard(product) {
    const tagClass = product.tag === "RECOMENDADO" ? "badge badge-recommended" : "badge";
    const hasOldPrice = product.original_price && parseFloat(product.original_price) > parseFloat(product.price);
    const oldPriceHtml = hasOldPrice ? `<span class="old-price">${product.original_price}€</span>` : '';
    const image = product.image || CONFIG.FALLBACK_PLACEHOLDER;
    const link = product.url || product.link || '#';

    return `
        <article class="card product-card" style="position: relative;">
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
            <a href="${link}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored" onclick="trackClick('${product.id || 'unknown'}', 'product')">Comprar Ahora →</a>
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
        // Use request manager to queue the request
        const products = await requestManager.execute(async () => {
            return await fetchWithRetry(keyword, true);
        }, 1); // Priority 1

        if (products && products.length > 0) {
            const processed = processBestProducts(products);
            const filtered = processed.slice(0, CONFIG.FALLBACK_PRODUCTS_COUNT);
            container.innerHTML = filtered.map(renderProductCard).join('');
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
            return await fetchWithRetry('top rated smart home gadgets', true);
        }, 0);

        if (products && products.length > 0) {
            const processed = processBestProducts(products);
            const filtered = processed.slice(0, 4);
            container.innerHTML = filtered.map(renderProductCard).join('');
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
                requestManager.execute(() => fetchWithRetry(cat.keyword, true), 0)
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

        // 2. Configuración inicial (Sin fallback de búsqueda para mayor calidad)
        link.target = "_blank";
        link.rel = "nofollow sponsored";
        link.textContent = "Buscando mejor oferta...";

        // 3. Si no es una info-card, intentamos match directo de producto
        if (!isInfoCard) {
            try {
                const products = await requestManager.execute(() => fetchWithRetry(cleanName, true), 0);
                if (products && products.length > 0) {
                    const bestMatch = products[0];
                    
                    // FORZAR ENLACE DIRECTO CON TRACKING
                    // Si la API devuelve un link ya trackeado lo usamos, si no lo construimos con el ID
                    const finalUrl = bestMatch.url || bestMatch.link;
                    link.href = finalUrl;
                    link.title = `Oferta real encontrada: ${bestMatch.price}€`;
                    
                    // Actualizar texto del botón con el precio
                    const buttonText = link.classList.contains('btn-primary') || link.classList.contains('btn-aliexpress') 
                        ? `Comprar ahora (${bestMatch.price}€) →`
                        : `Ver en AliExpress (${bestMatch.price}€)`;
                    link.textContent = buttonText;
                    
                    // ACTUALIZACIÓN: Inyectar imagen de AliExpress si no hay una o es placeholder
                    let imgEl = card.querySelector('img');
                    if (!imgEl) {
                        imgEl = document.createElement('img');
                        imgEl.style.width = '100%';
                        imgEl.style.borderRadius = '8px';
                        imgEl.style.marginBottom = '15px';
                        card.insertBefore(imgEl, card.firstChild);
                    }
                    
                    if (bestMatch.image && (!imgEl.src || imgEl.src.includes('placeholder') || imgEl.src.includes('unsplash'))) {
                        imgEl.src = bestMatch.image;
                        imgEl.alt = bestMatch.title;
                    }

                    const priceEl = card.querySelector('.current-price');
                    if (priceEl) {
                        priceEl.textContent = `${bestMatch.price}€`;
                    }
                } else {
                    // Si no hay resultados exactos, usamos un enlace de búsqueda de alta calidad
                    link.href = `https://www.aliexpress.com/af/${encodeURIComponent(cleanName)}.html?aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=${trackingId}`;
                    link.textContent = "Ver ofertas en AliExpress →";
                }
            } catch (err) {
                Logger.warn(`No se pudo encontrar match directo para "${cleanName}"`, err);
                link.href = `https://www.aliexpress.com/af/${encodeURIComponent(cleanName)}.html?aff_id=${trackingId}`;
                link.textContent = "Ver en AliExpress →";
            }
        } else {
            // Para info-cards (categorías), usamos búsqueda directa
            link.href = `https://www.aliexpress.com/af/${encodeURIComponent(cleanName)}.html?aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=${trackingId}`;
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
        const stats = JSON.parse(localStorage.getItem('domotech_stats') || '{"clicks": [], "total": 0, "interests": {}, "recently_viewed": []}');
        
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
        
        if (stats.clicks.length > 100) stats.clicks.shift();
        
        localStorage.setItem('domotech_stats', JSON.stringify(stats));
        Logger.debug(`Click registrado: ${productId} | Recientemente visto actualizado`);
    } catch (e) {
        Logger.error("Error registrando click:", e);
    }
}

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
