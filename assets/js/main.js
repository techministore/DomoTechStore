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
});

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
    const container = document.getElementById('productos-destacados');
    if (!container) return;

    fetch(`${basePath}data/productos.json`)
        .then(r => r.json())
        .then(data => {
            const featured = data.filter(p => p.destacado).slice(0, 4);
            if (featured.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5;">Cargando ofertas exclusivas...</p>';
                return;
            }
            container.innerHTML = featured.map(p => `
                <article class="card">
                    <div class="cat-icon" style="font-size:2rem">📦</div>
                    <h3>${p.nombre}</h3>
                    <p style="font-size: 0.9rem; color: var(--muted-text); margin-bottom: 15px;">${p.descripcion}</p>
                    <div style="color:var(--primary); font-weight:800; font-size: 1.2rem; margin:10px 0">~${p.precio_aproximado}€</div>
                    <a href="${p.enlace}" class="btn-aliexpress" target="_blank" rel="nofollow">Ver en AliExpress →</a>
                </article>
            `).join('');
        })
        .catch(err => console.error("Error cargando productos:", err));
}