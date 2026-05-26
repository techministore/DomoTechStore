/**
 * Comparador Multi-Tienda: AliExpress + Banggood
 * Busca productos en ambas tiendas y muestra comparativa automática
 * Destaca la mejor opción por precio y rating
 */

class ComparadorMultitienda {
    constructor() {
        this.aliProducts = [];
        this.banggoodProducts = [];
        this.comparativas = [];
    }

    /**
     * Busca productos en ambas tiendas
     */
    async buscar(keyword) {
        if (!keyword || keyword.trim().length === 0) {
            console.warn('Keyword vacío');
            return [];
        }

        console.log('🔍 Comparador: Buscando', keyword);

        try {
            // Búsqueda en paralelo para mejor performance
            const [aliRes, bangRes] = await Promise.all([
                this.buscarAliExpress(keyword),
                this.buscarBanggood(keyword)
            ]);

            this.aliProducts = aliRes;
            this.banggoodProducts = bangRes;

            // Generar comparativa
            this.comparativas = this.generarComparativa();
            console.log('✅ Comparativa generada:', this.comparativas.length, 'productos');

            return this.comparativas;
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            return [];
        }
    }

    /**
     * Busca en AliExpress
     */
    async buscarAliExpress(keyword) {
        try {
            const response = await fetch(`/aliexpress?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error('AliExpress API error');
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('❌ AliExpress error:', error);
            return [];
        }
    }

    /**
     * Busca en Banggood
     */
    async buscarBanggood(keyword) {
        try {
            const response = await fetch(`/banggood?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error('Banggood API error');
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('❌ Banggood error:', error);
            return [];
        }
    }

    /**
     * Agrupa productos similares y determina mejor opción
     */
    generarComparativa() {
        const grupos = new Map();
        const procesados = new Set();

        // Procesar todos los productos de AliExpress
        for (const ali of this.aliProducts) {
            if (procesados.has(ali.id)) continue;

            const clave = this.generarClaveProducto(ali.title);
            const bangSimilar = this.encontrarProductoSimilar(ali, this.banggoodProducts);

            const grupo = {
                id: `${ali.id}-banggood`,
                nombre: ali.title,
                aliexpress: ali,
                banggood: bangSimilar,
                mejorOpcion: this.determinarMejorOpcion(ali, bangSimilar),
                ahorro: bangSimilar ? Math.abs(ali.price - bangSimilar.price) : 0,
                clave
            };

            grupos.set(clave, grupo);
            procesados.add(ali.id);
            if (bangSimilar) procesados.add(bangSimilar.id);
        }

        // Añadir productos Banggood sin pareja en AliExpress
        for (const bang of this.banggoodProducts) {
            if (!procesados.has(bang.id)) {
                const clave = this.generarClaveProducto(bang.title);
                if (!grupos.has(clave)) {
                    grupos.set(clave, {
                        id: `${bang.id}-solo`,
                        nombre: bang.title,
                        aliexpress: null,
                        banggood: bang,
                        mejorOpcion: 'Banggood',
                        ahorro: 0,
                        clave
                    });
                }
            }
        }

        // Ordenar por ahorro mayor
        return Array.from(grupos.values()).sort((a, b) => b.ahorro - a.ahorro);
    }

    /**
     * Genera clave normalizada del producto para agrupación
     */
    generarClaveProducto(titulo) {
        return titulo
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20);
    }

    /**
     * Encuentra producto similar en lista
     */
    encontrarProductoSimilar(producto, lista) {
        const palabras = producto.title
            .toLowerCase()
            .split(/\s+/)
            .filter(p => p.length > 3);

        let mejorMatch = null;
        let mejorScore = 0;

        for (const item of lista) {
            const matches = palabras.filter(palabra =>
                item.title.toLowerCase().includes(palabra)
            ).length;

            const score = matches / palabras.length;
            if (score > mejorScore && score >= 0.5) {
                mejorScore = score;
                mejorMatch = item;
            }
        }

        return mejorMatch;
    }

    /**
     * Determina cuál es la mejor opción basándose en precio y rating
     */
    determinarMejorOpcion(ali, bang) {
        if (!bang) return 'AliExpress';
        if (!ali) return 'Banggood';

        // Calcular score: precio bajo + rating alto = mejor
        const scoreAli = this.calcularScore(ali);
        const scoreBang = this.calcularScore(bang);

        return scoreAli < scoreBang ? 'AliExpress' : 'Banggood';
    }

    /**
     * Calcula score para comparación (menor es mejor)
     */
    calcularScore(producto) {
        const rating = producto.rating || 0;
        const normalizedRating = Math.min(rating / 5, 1);
        // Precio ajustado por calidad
        return producto.price * (1.5 - normalizedRating);
    }

    /**
     * Renderiza la comparativa en un contenedor
     */
    renderizar(contenedorId) {
        const container = document.getElementById(contenedorId);
        if (!container) {
            console.error(`Contenedor ${contenedorId} no encontrado`);
            return;
        }

        if (this.comparativas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p>No se encontraron productos comparables</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.comparativas.map(grupo => `
            <div class="comparativa-card" data-ahorro="${grupo.ahorro}">
                <h3 class="comparativa-titulo">${grupo.nombre}</h3>
                
                <div class="tiendas-grid">
                    ${grupo.aliexpress ? `
                        <div class="tienda-card ${grupo.mejorOpcion === 'AliExpress' ? 'mejor-opcion' : ''}">
                            <div class="tienda-nombre">🛒 AliExpress</div>
                            <img src="${grupo.aliexpress.image}" alt="AliExpress" onerror="this.src='/assets/img/placeholder.jpg'">
                            <div class="precio">$${grupo.aliexpress.price.toFixed(2)}</div>
                            ${grupo.aliexpress.old_price ? `<div class="precio-original">$${grupo.aliexpress.old_price.toFixed(2)}</div>` : ''}
                            ${grupo.aliexpress.rating ? `<div class="rating">⭐ ${grupo.aliexpress.rating}</div>` : ''}
                            <a href="${grupo.aliexpress.link}" target="_blank" class="btn btn-aliexpress">Ver en AliExpress</a>
                        </div>
                    ` : `<div class="tienda-card no-disponible">❌ No disponible en AliExpress</div>`}

                    ${grupo.banggood ? `
                        <div class="tienda-card ${grupo.mejorOpcion === 'Banggood' ? 'mejor-opcion' : ''}">
                            <div class="tienda-nombre">🎁 Banggood</div>
                            <img src="${grupo.banggood.image}" alt="Banggood" onerror="this.src='/assets/img/placeholder.jpg'">
                            <div class="precio">$${grupo.banggood.price.toFixed(2)}</div>
                            ${grupo.banggood.old_price ? `<div class="precio-original">$${grupo.banggood.old_price.toFixed(2)}</div>` : ''}
                            ${grupo.banggood.rating ? `<div class="rating">⭐ ${grupo.banggood.rating}</div>` : ''}
                            <a href="${grupo.banggood.link}" target="_blank" class="btn btn-banggood">Ver en Banggood</a>
                        </div>
                    ` : `<div class="tienda-card no-disponible">❌ No disponible en Banggood</div>`}
                </div>

                ${grupo.mejorOpcion && grupo.ahorro > 0.5 ? `
                    <div class="mejor-opcion-badge">
                        ✨ Mejor en <strong>${grupo.mejorOpcion}</strong> - Ahorras <strong>$${grupo.ahorro.toFixed(2)}</strong>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

// Exportar para uso global
window.ComparadorMultitienda = ComparadorMultitienda;
