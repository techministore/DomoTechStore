/* 
    DomoTechStore - Buscador con AliExpress API
    Filtra elementos locales y busca productos en AliExpress
*/

const API_CONFIG = {
    tracking_id: "Domotech_2026"
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
                    buscarYMostrarProductos(searchTerm);
                }, 800);
            }
        });
    }

    // 3. Automatización por Página
    const path = window.location.pathname;
    if (path.includes('smart-home.html')) {
        buscarYMostrarProductos("smart home");
    } else if (path.includes('camaras.html')) {
        buscarYMostrarProductos("security camera");
    } else if (path.includes('interruptores.html')) {
        buscarYMostrarProductos("wifi switch");
    } else if (path.endsWith('index.html') || path === '/') {
        const initialKeywords = ["smart home", "gadgets", "wifi switch", "security camera"];
        const randomKeyword = initialKeywords[Math.floor(Math.random() * initialKeywords.length)];
        buscarYMostrarProductos(randomKeyword);
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
 * Muestra los productos en la web (Con Loading Skeletons y Optimización)
 * Función específica para el buscador y páginas de categoría
 */
async function buscarYMostrarProductos(keyword, customContainerId = null) {
    if (!keyword) return;

    const containerId = customContainerId || 'ofertas-dia';
    const container = document.getElementById(containerId);

    // 1. Mostrar Skeletons antes de la carga
    renderSkeletons(keyword, containerId);

    // 2. Obtener productos (buscarProductos ya maneja el caché)
    const productos = await buscarProductos(keyword);
    
    // 3. Renderizar resultados finales
    renderExternalResults(productos, keyword, containerId);
}

/**
 * Renderiza Loading Skeletons para mejorar el UX
 */
function renderSkeletons(keyword, customContainerId = null) {
    let grid = customContainerId ? document.getElementById(customContainerId) : document.getElementById('productos');
    if (!grid) {
        // Si no hay grid, forzamos la creación de la sección externa
        renderExternalResults([], keyword, customContainerId);
        grid = document.getElementById('external-grid');
    }

    if (!grid) return;

    const skeletons = Array(4).fill(0).map(() => `
        <article class="card product-card skeleton-card" style="opacity: 0.6; pointer-events: none;">
            <div class="skeleton-image" style="height: 200px; background: #2a3441; border-radius: 12px; margin-bottom: 15px; animation: pulse 1.5s infinite ease-in-out;"></div>
            <div class="skeleton-title" style="height: 20px; background: #2a3441; border-radius: 4px; margin-bottom: 10px; width: 80%; animation: pulse 1.5s infinite ease-in-out 0.2s;"></div>
            <div class="skeleton-price" style="height: 25px; background: #2a3441; border-radius: 4px; width: 40%; animation: pulse 1.5s infinite ease-in-out 0.4s;"></div>
            <div class="skeleton-btn" style="height: 40px; background: #2a3441; border-radius: 8px; margin-top: 15px; animation: pulse 1.5s infinite ease-in-out 0.6s;"></div>
        </article>
    `).join('');

    grid.innerHTML = skeletons;
}

/**
 * Renderiza los productos obtenidos de la API
 */
function renderExternalResults(products, keyword = "", customContainerId = null) {
    // 1. Prioridad: Contenedor personalizado -> Contenedor "productos" -> Contenedor dinámico
    let grid = customContainerId ? document.getElementById(customContainerId) : document.getElementById('productos');
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
        let badgeClass = "badge";
        if (p.tag === "MEJOR PRECIO") badgeClass = "badge badge-price";
        else if (p.tag === "CALIDAD-PRECIO") badgeClass = "badge badge-value";
        else if (p.tag === "RECOMENDADO" || p.tag === "MÁS VENDIDO") badgeClass = "badge badge-recommended";

        const hasOldPrice = p.original_price && parseFloat(p.original_price) > parseFloat(p.price);
        const oldPriceHtml = hasOldPrice ? `<span class="old-price">${p.original_price}€</span>` : '';

        return `
            <article class="card product-card" style="position: relative;">
                ${p.tag ? `<div class="${badgeClass}" style="position: absolute; top: 10px; left: 10px; z-index: 10;">${p.tag}</div>` : ''}
                <div class="urgency-badge">🔥 ¡OFERTA LIMITADA!</div>
                <div class="product-image-container">
                    <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1e293b/white?text=AliExpress'">
                </div>
                <h3>${p.title}</h3>
                <div class="price-container">
                    ${oldPriceHtml}
                    <span class="current-price">${p.price}€</span>
                </div>
                ${p.rating ? `<div style="font-size: 0.8rem; margin-top: 5px;">⭐ ${p.rating} | ${p.sales || 0}+ vendidos</div>` : ''}
                <a href="${p.url}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored" onclick="trackClick('${p.id}', 'aliexpress')">
                    Comprar Ahora →
                </a>
            </article>
        `;
    }).join('');
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