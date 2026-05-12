/* 
    DomoTechStore - Buscador con AliExpress API
    Filtra elementos locales y busca productos en AliExpress
*/

const API_CONFIG = {
    tracking_id: "domotech2026"
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // 1. Filtrado Local (Instantáneo)
            filterLocalItems(searchTerm);

            // 2. Búsqueda en AliExpress (Con debounce para no saturar la API)
            clearTimeout(debounceTimer);
            if (searchTerm.length > 3) {
                debounceTimer = setTimeout(() => {
                    mostrarProductos(searchTerm);
                }, 800);
            }
        });
    }

    // 3. Automatización por Página
    const path = window.location.pathname;
    if (path.includes('smart-home.html')) {
        mostrarProductos("smart home");
    } else if (path.includes('camaras.html')) {
        mostrarProductos("security camera");
    } else if (path.includes('interruptores.html')) {
        mostrarProductos("wifi switch");
    } else if (path.endsWith('index.html') || path === '/') {
        const initialKeywords = ["smart home", "gadgets", "wifi switch", "security camera"];
        const randomKeyword = initialKeywords[Math.floor(Math.random() * initialKeywords.length)];
        mostrarProductos(randomKeyword);
    }
});

/**
 * Filtra productos y categorías locales
 */
function filterLocalItems(searchTerm) {
    const itemsToSearch = document.querySelectorAll('.product-card, .category-card, .faq-item');
    
    itemsToSearch.forEach(item => {
        const textContent = item.innerText.toLowerCase();
        if (textContent.includes(searchTerm)) {
            item.style.display = '';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        } else {
            item.style.display = 'none';
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
        }
    });

    const visibleItems = Array.from(itemsToSearch).filter(item => item.style.display !== 'none');
    handleNoResults(visibleItems.length, document.getElementById('search-input'));
}

/**
 * Función proporcionada para buscar en AliExpress (Ahora vía Backend Proxy)
 */
async function buscarProductos(keyword) {
    // LLAMADA AL BACKEND PROXY (Seguro y sin CORS)
    const endpoint = "/api/aliexpress";
    
    try {
        const url = `${endpoint}?keyword=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        // La API de AliExpress devuelve los items dentro de data.result.items
        return (data.result && data.result.items) || [];
    } catch (error) {
        console.error("Error en AliExpress Proxy:", error);
        return [];
    }
}

/**
 * Muestra los productos en la web (Script base optimizado)
 */
async function mostrarProductos(keyword) {
    const productos = await buscarProductos(keyword);
    renderExternalResults(productos, keyword);
}

/**
 * Renderiza los productos obtenidos de la API
 */
function renderExternalResults(products, keyword = "") {
    // Intentar encontrar el contenedor estándar "productos"
    let grid = document.getElementById('productos');
    let externalSection = document.getElementById('external-results-section');
    const searchInput = document.getElementById('search-input');
    const container = document.querySelector('main .container') || document.body;

    // Si no existe el contenedor "productos", creamos la sección dinámica (para el buscador en Home)
    if (!grid) {
        if (!externalSection) {
            externalSection = document.createElement('div');
            externalSection.id = 'external-results-section';
            externalSection.className = 'container';
            externalSection.innerHTML = `
                <div style="margin-top: 50px; border-top: 1px solid var(--border); padding-top: 30px; margin-bottom: 50px;">
                    <h2 class="section-title" id="external-title" style="font-size: 1.5rem; text-align: left;">Ofertas destacadas en AliExpress</h2>
                    <div id="external-grid" class="grid grid-4"></div>
                </div>
            `;
            
            const main = document.querySelector('main');
            if (main) main.appendChild(externalSection);
            else container.appendChild(externalSection);
        }
        grid = document.getElementById('external-grid');
    }

    const title = document.getElementById('external-title');
    if (title) {
        if (keyword && keyword !== "smart home") {
            title.textContent = `Resultados de "${keyword}" en AliExpress`;
        } else {
            title.textContent = `Recomendaciones Smart Home de AliExpress`;
        }
    }
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5;">No se encontraron ofertas externas en este momento.</p>';
        return;
    }

    // Si el grid no tiene la clase grid-4, se la añadimos
    if (!grid.classList.contains('grid')) {
        grid.className = 'grid grid-4';
    }

    grid.innerHTML = products.map(p => {
        // Soporte para múltiples formatos de imagen de la API
        const imageUrl = p.image_url || p.product_main_image_url || p.image || 'assets/img/placeholder-tech.jpg';
        
        return `
            <article class="card product-card">
                <div class="urgency-badge">🔥 ¡OFERTA LIMITADA!</div>
                <div class="product-image-container" style="height: 200px; overflow: hidden; border-radius: 12px; margin-bottom: 15px; background: #fff; position: relative;">
                    <img src="${imageUrl}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <h3 style="font-size: 1rem; height: 3em; overflow: hidden; margin-bottom: 10px;">${p.title}</h3>
                <div class="price-container">
                    <span class="old-price">${(parseFloat(p.sale_price || p.price) * 1.4).toFixed(2)}€</span>
                    <span class="current-price">${p.sale_price || p.price}€</span>
                </div>
                <p style="font-size: 0.8rem; color: #4ade80; margin: 5px 0; font-weight: bold;">✓ Envío Gratis disponible</p>
                <a href="${formatAffiliateLink(p.product_url, API_CONFIG.tracking_id)}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored">
                    Comprar Ahora →
                </a>
            </article>
        `;
    }).join('');
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
 * Muestra un mensaje si no se encuentran resultados locales
 */
function handleNoResults(count, inputElement) {
    let noResultsMsg = document.getElementById('no-results-msg');
    
    if (count === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('p');
            noResultsMsg.id = 'no-results-msg';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.padding = '40px';
            noResultsMsg.style.color = '#94a3b8';
            noResultsMsg.textContent = 'No hay coincidencias en nuestro catálogo local. Buscando en AliExpress...';
            inputElement.closest('.container').appendChild(noResultsMsg);
        }
    } else {
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
}