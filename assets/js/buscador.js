/* 
    DomoTechStore - Buscador con AliExpress API
    Filtra elementos locales y busca productos en AliExpress
*/

const API_CONFIG = {
    app_key: "534120",
    app_secret: "iyAwX4NpupyrVHI36esNEys1nvLG0Aig",
    tracking_id: "domotech2026" // Tracking ID por defecto
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
 * Función proporcionada para buscar en AliExpress
 */
async function buscarProductos(keyword) {
    const endpoint = "https://api.aliexpress.com/item_search";
    
    // Parámetros base del script
    const params = {
        app_key: API_CONFIG.app_key,
        timestamp: Date.now(),
        keywords: keyword,
        fields: "item_id,title,price,image_url,sale_price,product_url",
        tracking_id: API_CONFIG.tracking_id
    };
    
    try {
        const query = new URLSearchParams(params).toString();
        const url = `${endpoint}?${query}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        return data.result.items || [];
    } catch (error) {
        console.error("Error en AliExpress API:", error);
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
    let externalSection = document.getElementById('external-results-section');
    const searchInput = document.getElementById('search-input');
    const container = document.querySelector('main .container') || document.body;

    if (!externalSection) {
        externalSection = document.createElement('div');
        externalSection.id = 'external-results-section';
        externalSection.className = 'container'; // Asegurar que use el contenedor del sitio
        externalSection.innerHTML = `
            <div style="margin-top: 50px; border-top: 1px solid var(--border); padding-top: 30px; margin-bottom: 50px;">
                <h2 class="section-title" id="external-title" style="font-size: 1.5rem; text-align: left;">Ofertas destacadas en AliExpress</h2>
                <div id="external-grid" class="grid grid-4"></div>
            </div>
        `;
        
        // Insertar antes del footer o al final del main
        const main = document.querySelector('main');
        if (main) {
            main.appendChild(externalSection);
        } else {
            container.appendChild(externalSection);
        }
    }

    const grid = document.getElementById('external-grid');
    const title = document.getElementById('external-title');

    // Actualizar título según contexto
    if (keyword && keyword !== "smart home") {
        title.textContent = `Resultados de "${keyword}" en AliExpress`;
    } else {
        title.textContent = `Recomendaciones Smart Home de AliExpress`;
    }
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5;">No se encontraron ofertas externas en este momento.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <article class="card product-card">
            <div class="urgency-badge">🔥 ¡OFERTA LIMITADA!</div>
            <div class="product-image-container" style="height: 200px; overflow: hidden; border-radius: 12px; margin-bottom: 15px; background: #fff; position: relative;">
                <img src="${p.image_url}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <h3 style="font-size: 1rem; height: 3em; overflow: hidden; margin-bottom: 10px;">${p.title}</h3>
            <div class="price-container">
                <span class="old-price">${(parseFloat(p.sale_price || p.price) * 1.4).toFixed(2)}€</span>
                <span class="current-price">${p.sale_price || p.price}€</span>
            </div>
            <p style="font-size: 0.8rem; color: #4ade80; margin: 5px 0; font-weight: bold;">✓ Envío Gratis disponible</p>
            <a href="${p.product_url}&aff_id=${API_CONFIG.tracking_id}" class="btn-aliexpress" target="_blank" rel="nofollow sponsored">
                Comprar Ahora →
            </a>
        </article>
    `).join('');
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