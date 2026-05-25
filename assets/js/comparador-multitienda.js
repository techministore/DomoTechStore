/**
 * Comparador inteligente multi-tienda: AliExpress + Banggood
 * Busca, compara y recomienda la mejor opción de compra
 */

class ComparadorMultitienda {
    constructor(config = {}) {
        this.aliProducts = [];
        this.bangProducts = [];
        this.comparativas = [];
        this.config = {
            minSimilaridad: 0.65,
            incluirPuntuacion: true,
            ordenarPor: 'mejor_precio', // 'mejor_precio', 'mejor_rating', 'mejor_valor'
            ...config
        };
    }

    /**
     * Busca productos en ambas tiendas en paralelo
     */
    async buscar(keyword) {
        if (!keyword || keyword.trim().length === 0) {
            console.warn('ComparadorMultitienda: keyword vacío');
            return [];
        }

        console.log('[COMPARADOR] Buscando:', keyword);

        try {
            // Búsquedas en paralelo
            const [aliRes, bangRes] = await Promise.all([
                this.buscarAliExpress(keyword),
                this.buscarBanggood(keyword)
            ]);

            this.aliProducts = aliRes || [];
            this.bangProducts = bangRes || [];

            console.log(`[COMPARADOR] AliExpress: ${this.aliProducts.length} | Banggood: ${this.bangProducts.length}`);

            // Generar comparativas automáticas
            return this.generarComparativas();

        } catch (error) {
            console.error('[COMPARADOR] Error en búsqueda:', error);
            return [];
        }
    }

    /**
     * Busca en AliExpress
     */
    async buscarAliExpress(keyword) {
        try {
            const response = await fetch(`/aliexpress?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('[COMPARADOR] Error AliExpress:', error.message);
            return [];
        }
    }

    /**
     * Busca en Banggood
     */
    async buscarBanggood(keyword) {
        try {
            const response = await fetch(`/banggood?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('[COMPARADOR] Error Banggood:', error.message);
            return [];
        }
    }

    /**
     * Genera comparativas automáticas agrupando productos similares
     */
    generarComparativas() {
        const grupos = [];
        const procesados = new Set();

        // 1. Emparejar AliExpress con Banggood
        for (const aliProduct of this.aliProducts) {
            if (procesados.has(`ali_${aliProduct.id}`)) continue;

            const bgSimilar = this.encontrarProductoSimilar(aliProduct, this.bangProducts);

            const grupo = {
                nombre: aliProduct.title,
                categoria: this.extraerCategoria(aliProduct.title),
                aliexpress: aliProduct,
                banggood: bgSimilar,
                mejorOpcion: null,
                ahorro: 0,
                ventajas: {}
            };

            // Calcular mejor opción
            if (bgSimilar) {
                grupo.mejorOpcion = this.calcularMejorOpcion(aliProduct, bgSimilar);
                grupo.ahorro = Math.abs(aliProduct.price - bgSimilar.price);
                grupo.ventajas = this.calcularVentajas(aliProduct, bgSimilar);
                procesados.add(`bang_${bgSimilar.id}`);
            } else {
                grupo.mejorOpcion = 'AliExpress';
            }

            grupos.push(grupo);
            procesados.add(`ali_${aliProduct.id}`);
        }

        // 2. Añadir productos de Banggood sin pareja
        for (const bgProduct of this.bangProducts) {
            if (procesados.has(`bang_${bgProduct.id}`)) continue;

            grupos.push({
                nombre: bgProduct.title,
                categoria: this.extraerCategoria(bgProduct.title),
                aliexpress: null,
                banggood: bgProduct,
                mejorOpcion: 'Banggood',
                ahorro: 0,
                ventajas: { solo_banggood: true }
            });

            procesados.add(`bang_${bgProduct.id}`);
        }

        // 3. Ordenar según configuración
        this.comparativas = this.ordenarComparativas(grupos);
        return this.comparativas;
    }

    /**
     * Busca producto similar en una lista (usando similitud de título)
     */
    encontrarProductoSimilar(producto, lista) {
        if (!lista || lista.length === 0) return null;

        const palabrasClave = this.normalizarTitulo(producto.title).split(/\s+/);
        const similitudes = lista.map(item => {
            const matches = palabrasClave.filter(palabra =>
                this.normalizarTitulo(item.title).includes(palabra)
            ).length;
            const score = matches / palabrasClave.length;
            return { item, score };
        });

        const mejor = similitudes
            .filter(s => s.score >= this.config.minSimilaridad)
            .sort((a, b) => b.score - a.score)[0];

        return mejor ? mejor.item : null;
    }

    /**
     * Calcula cuál es la mejor opción entre dos productos
     */
    calcularMejorOpcion(aliProduct, bgProduct) {
        // Scoring: Precio (40%) + Rating (35%) + Disponibilidad (25%)
        const scoreAli = this.calcularScore(aliProduct);
        const scoreBg = this.calcularScore(bgProduct);

        console.log(`[SCORE] Ali: ${scoreAli.toFixed(2)} vs Banggood: ${scoreBg.toFixed(2)}`);

        return scoreAli < scoreBg ? 'AliExpress' : 'Banggood';
    }

    /**
     * Calcula un score para el producto (menor es mejor)
     */
    calcularScore(producto) {
        const priceFactor = producto.price; // Peso: precio bajo
        const ratingFactor = (5 - (producto.rating || 3)) * 2; // Peso: rating alto (invertido)
        const avaliabilityFactor = 0; // TODO: Implementar si tienes datos de stock

        return (priceFactor * 0.4) + (ratingFactor * 0.35) + (avaliabilityFactor * 0.25);
    }

    /**
     * Calcula ventajas de una tienda sobre la otra
     */
    calcularVentajas(aliProduct, bgProduct) {
        const ventajas = {};

        // Precio
        if (aliProduct.price < bgProduct.price) {
            ventajas.precio_ali = true;
            ventajas.ahorro_precio = (bgProduct.price - aliProduct.price).toFixed(2);
        } else if (bgProduct.price < aliProduct.price) {
            ventajas.precio_bg = true;
            ventajas.ahorro_precio = (aliProduct.price - bgProduct.price).toFixed(2);
        }

        // Rating
        const ratingAli = aliProduct.rating || 0;
        const ratingBg = bgProduct.rating || 0;
        if (ratingAli > ratingBg + 0.5) {
            ventajas.mejor_rating_ali = true;
        } else if (ratingBg > ratingAli + 0.5) {
            ventajas.mejor_rating_bg = true;
        }

        return ventajas;
    }

    /**
     * Ordena las comparativas según la configuración
     */
    ordenarComparativas(grupos) {
        return grupos.sort((a, b) => {
            switch (this.config.ordenarPor) {
                case 'mejor_precio':
                    return b.ahorro - a.ahorro;
                case 'mejor_rating':
                    const ratingA = (a.aliexpress?.rating || a.banggood?.rating || 0);
                    const ratingB = (b.aliexpress?.rating || b.banggood?.rating || 0);
                    return ratingB - ratingA;
                case 'mejor_valor':
                default:
                    return this.calcularScore(a.aliexpress || a.banggood) -
                           this.calcularScore(b.aliexpress || b.banggood);
            }
        });
    }

    /**
     * Normaliza títulos para comparación
     */
    normalizarTitulo(titulo) {
        return titulo
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extrae la categoría del título del producto
     */
    extraerCategoria(titulo) {
        const categorias = {
            enchufe: ['enchufe', 'plug', 'outlet', 'smart plug'],
            camara: ['camara', 'camera', 'webcam', 'ip cam'],
            bombilla: ['bombilla', 'bulb', 'light', 'led'],
            sensor: ['sensor', 'detector', 'motion'],
            alarma: ['alarma', 'alarm', 'security'],
            cerradura: ['cerradura', 'lock', 'doorlock'],
        };

        const tituloNorm = this.normalizarTitulo(titulo);
        for (const [cat, palabras] of Object.entries(categorias)) {
            if (palabras.some(p => tituloNorm.includes(p))) {
                return cat;
            }
        }
        return 'otros';
    }

    /**
     * Renderiza la comparativa en un contenedor HTML
     */
    renderizar(contenedorId) {
        const container = document.getElementById(contenedorId);
        if (!container) {
            console.error(`[COMPARADOR] Contenedor #${contenedorId} no encontrado`);
            return;
        }

        if (this.comparativas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; opacity: 0.6;">
                    <p>No se encontraron productos para comparar</p>
                </div>
            `;
            return;
        }

        const html = this.comparativas
            .map((grupo, idx) => this.renderizarGrupo(grupo, idx))
            .join('');

        container.innerHTML = `
            <div class="comparativas-container">
                ${html}
            </div>
        `;

        // Agregar estilos si no están presentes
        this.inyectarEstilos();
    }

    /**
     * Renderiza un grupo de comparativa
     */
    renderizarGrupo(grupo, idx) {
        const tieneMejor = grupo.mejorOpcion && grupo.ahorro > 0;

        return `
            <div class="comparativa-card" data-categoria="${grupo.categoria}" data-index="${idx}">
                <div class="comparativa-header">
                    <h3>${grupo.nombre}</h3>
                    <span class="categoria-badge">${grupo.categoria}</span>
                </div>

                <div class="tiendas-grid">
                    ${grupo.aliexpress ? this.renderizarTienda(grupo.aliexpress, 'AliExpress', grupo.mejorOpcion === 'AliExpress') : this.renderizarNoDisponible()}
                    ${grupo.banggood ? this.renderizarTienda(grupo.banggood, 'Banggood', grupo.mejorOpcion === 'Banggood') : this.renderizarNoDisponible()}
                </div>

                ${tieneMejor ? `
                    <div class="mejor-opcion-banner">
                        <div class="banner-content">
                            <span class="banner-icon">✨</span>
                            <div>
                                <strong>Mejor opción en ${grupo.mejorOpcion}</strong>
                                <p>Ahorras: <span class="ahorro-cantidad">$${grupo.ahorro.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Renderiza una tienda individual
     */
    renderizarTienda(producto, nombre, esMejor) {
        return `
            <div class="tienda-card ${esMejor ? 'mejor-opcion' : ''}">
                <div class="tienda-header">
                    <h4>${nombre}</h4>
                    ${esMejor ? '<span class="badge-mejor">★ MEJOR</span>' : ''}
                </div>

                <img src="${producto.image}" alt="${producto.title}" class="tienda-img" onerror="this.src='https://via.placeholder.com/300x300?text=${nombre}'">

                <div class="tienda-body">
                    <p class="precio-actual">$${producto.price.toFixed(2)}</p>
                    ${producto.old_price ? `<p class="precio-anterior">$${producto.old_price.toFixed(2)}</p>` : ''}
                    
                    ${producto.rating ? `
                        <div class="rating">
                            <span class="stars">★ ${producto.rating.toFixed(1)}</span>
                        </div>
                    ` : ''}

                    <a href="${producto.link}" target="_blank" rel="noopener" class="btn btn-primary">
                        Ver en ${nombre} →
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza cuando no hay producto disponible
     */
    renderizarNoDisponible() {
        return `
            <div class="tienda-card no-disponible">
                <div style="text-align: center; padding: 30px;">
                    <p style="color: #999;">No disponible</p>
                </div>
            </div>
        `;
    }

    /**
     * Inyecta estilos CSS necesarios
     */
    inyectarEstilos() {
        if (document.getElementById('comparador-styles')) return;

        const styles = `
            .comparativas-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .comparativa-card {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
            }

            .comparativa-card:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .comparativa-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                gap: 10px;
            }

            .comparativa-header h3 {
                margin: 0;
                font-size: 1.2rem;
                color: #1a1a1a;
                flex: 1;
            }

            .categoria-badge {
                background: #e3f2fd;
                color: #1976d2;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
                white-space: nowrap;
            }

            .tiendas-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }

            .tienda-card {
                background: white;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
                transition: all 0.3s ease;
            }

            .tienda-card.mejor-opcion {
                border-color: #4caf50;
                background: #f1f8f4;
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.15);
            }

            .tienda-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .tienda-header h4 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
            }

            .badge-mejor {
                background: #4caf50;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: bold;
            }

            .tienda-img {
                width: 100%;
                height: 200px;
                object-fit: contain;
                margin: 10px 0;
                border-radius: 6px;
                background: #f0f0f0;
            }

            .tienda-body {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .precio-actual {
                font-size: 1.5rem;
                font-weight: bold;
                color: #2c3e50;
                margin: 0;
            }

            .precio-anterior {
                font-size: 0.9rem;
                color: #999;
                text-decoration: line-through;
                margin: 0;
            }

            .rating {
                font-size: 0.9rem;
                color: #f39c12;
            }

            .rating .stars {
                font-weight: bold;
            }

            .btn {
                display: inline-block;
                padding: 10px 15px;
                border-radius: 6px;
                text-align: center;
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: 600;
                transition: all 0.3s;
                border: none;
                cursor: pointer;
            }

            .btn-primary {
                background: #1976d2;
                color: white;
            }

            .btn-primary:hover {
                background: #1565c0;
                transform: translateY(-1px);
            }

            .tienda-card.no-disponible {
                border-color: #ddd;
                background: #f5f5f5;
                opacity: 0.6;
            }

            .mejor-opcion-banner {
                background: linear-gradient(135deg, #4caf50, #45a049);
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .banner-icon {
                font-size: 1.5rem;
            }

            .ahorro-cantidad {
                font-size: 1.2rem;
                font-weight: bold;
                display: block;
            }

            @media (max-width: 768px) {
                .tiendas-grid {
                    grid-template-columns: 1fr;
                }

                .comparativa-header {
                    flex-direction: column;
                }

                .tienda-img {
                    height: 150px;
                }
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = 'comparador-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
}

// Exportar para uso global
window.ComparadorMultitienda = ComparadorMultitienda;
