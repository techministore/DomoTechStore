/**
 * Comparador Multi-Tienda: 8 tiendas
 * AliExpress · Banggood · Geekbuying · Temu · eBay · Miravia · Cafago · TomTop
 */

class ComparadorMultitienda {
    constructor() {
        this.aliProducts      = [];
        this.banggoodProducts = [];
        this.geekbuyingProducts = [];
        this.temuProducts     = [];
        this.ebayProducts     = [];
        this.miraviaProducts  = [];
        this.cafagoProducts   = [];
        this.tomtopProducts   = [];
        this.comparativas     = [];
    }

    async buscar(keyword) {
        if (!keyword || keyword.trim().length === 0) return [];
        console.log('🔍 Comparador: Buscando en 8 tiendas —', keyword);

        try {
            const [aliRes, bangRes, gbRes, temuRes, ebayRes, mirRes, cafRes, ttRes] = await Promise.all([
                this.buscarAliExpress(keyword),
                this.buscarBanggood(keyword),
                this.buscarGeekbuying(keyword),
                this.buscarTemu(keyword),
                this.buscarEbay(keyword),
                this.buscarMiravia(keyword),
                this.buscarCafago(keyword),
                this.buscarTomtop(keyword)
            ]);

            this.aliProducts      = aliRes;
            this.banggoodProducts = bangRes;
            this.geekbuyingProducts = gbRes;
            this.temuProducts     = temuRes;
            this.ebayProducts     = ebayRes;
            this.miraviaProducts  = mirRes;
            this.cafagoProducts   = cafRes;
            this.tomtopProducts   = ttRes;

            this.comparativas = this.generarComparativa();
            console.log('✅ Comparativa generada:', this.comparativas.length, 'grupos');
            return this.comparativas;
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            return [];
        }
    }

    async buscarAliExpress(keyword) {
        try {
            const r = await fetch(`/aliexpress?keyword=${encodeURIComponent(keyword)}`);
            const d = await r.json(); return d.items || [];
        } catch { return []; }
    }

    async buscarBanggood(keyword) {
        try {
            const r = await fetch(`/banggood?q=${encodeURIComponent(keyword)}`);
            const d = await r.json(); return d.data?.products || d.items || [];
        } catch { return []; }
    }

    async buscarGeekbuying(keyword) {
        try {
            if (typeof window.searchGeekbuying === 'function') return await window.searchGeekbuying(keyword);
            const r = await fetch(`/geekbuying?action=search&q=${encodeURIComponent(keyword)}`);
            const d = await r.json(); return d.data?.products || d.products || [];
        } catch { return []; }
    }

    async buscarTemu(keyword) {
        try {
            if (typeof window.searchTemu === 'function') return await window.searchTemu(keyword);
            const r = await fetch(`/temu?action=search&q=${encodeURIComponent(keyword)}`);
            const d = await r.json(); return d.data?.goods_search_response?.goods_list || [];
        } catch { return []; }
    }

    async buscarEbay(keyword) {
        try {
            if (typeof window.searchEbay === 'function') return await window.searchEbay(keyword);
            return [];
        } catch { return []; }
    }

    async buscarMiravia(keyword) {
        try {
            if (typeof window.searchMiravia === 'function') return await window.searchMiravia(keyword);
            return [];
        } catch { return []; }
    }

    async buscarCafago(keyword) {
        try {
            if (typeof window.searchCafago === 'function') return await window.searchCafago(keyword);
            return [];
        } catch { return []; }
    }

    async buscarTomtop(keyword) {
        try {
            if (typeof window.searchTomtop === 'function') return await window.searchTomtop(keyword);
            return [];
        } catch { return []; }
    }

    generarComparativa() {
        const grupos   = new Map();
        const procesados = new Set();

        const listas = [
            { productos: this.aliProducts,       campo: 'aliexpress', nombre: 'AliExpress' },
            { productos: this.banggoodProducts,  campo: 'banggood',   nombre: 'Banggood'   },
            { productos: this.geekbuyingProducts,campo: 'geekbuying', nombre: 'Geekbuying' },
            { productos: this.temuProducts,      campo: 'temu',       nombre: 'Temu'       },
            { productos: this.ebayProducts,      campo: 'ebay',       nombre: 'eBay'       },
            { productos: this.miraviaProducts,   campo: 'miravia',    nombre: 'Miravia'    },
            { productos: this.cafagoProducts,    campo: 'cafago',     nombre: 'Cafago'     },
            { productos: this.tomtopProducts,    campo: 'tomtop',     nombre: 'TomTop'     }
        ];

        for (const { productos, campo, nombre } of listas) {
            for (const p of productos) {
                if (procesados.has(p.id)) continue;
                const clave = this.clave(p.title || p.nombre || '');

                if (!grupos.has(clave)) {
                    grupos.set(clave, {
                        id: `${p.id}-multi`,
                        nombre: p.title || p.nombre,
                        aliexpress: null, banggood: null, geekbuying: null, temu: null,
                        ebay: null, miravia: null, cafago: null, tomtop: null,
                        mejorOpcion: nombre, ahorro: 0, clave
                    });
                }

                const grupo = grupos.get(clave);
                grupo[campo] = p;
                procesados.add(p.id);

                for (const otra of listas) {
                    if (otra.campo === campo) continue;
                    const similar = this.similar(p, otra.productos);
                    if (similar && !procesados.has(similar.id)) {
                        grupo[otra.campo] = similar;
                        procesados.add(similar.id);
                    }
                }

                grupo.mejorOpcion = this.mejorOpcion(grupo);
                grupo.ahorro = this.ahorro(grupo);
            }
        }

        return Array.from(grupos.values()).sort((a, b) => b.ahorro - a.ahorro);
    }

    clave(titulo) {
        return (titulo || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    }

    similar(producto, lista) {
        const palabras = (producto.title || '').toLowerCase().split(/\s+/).filter(p => p.length > 3);
        if (!palabras.length) return null;
        let best = null, bestScore = 0;
        for (const item of lista) {
            const t = (item.title || '').toLowerCase();
            const matches = palabras.filter(w => t.includes(w)).length;
            const score = matches / palabras.length;
            if (score > bestScore && score >= 0.5) { bestScore = score; best = item; }
        }
        return best;
    }

    mejorOpcion(grupo) {
        const campos = ['aliexpress','banggood','geekbuying','temu','ebay','miravia','cafago','tomtop'];
        const nombres = { aliexpress:'AliExpress', banggood:'Banggood', geekbuying:'Geekbuying',
                          temu:'Temu', ebay:'eBay', miravia:'Miravia', cafago:'Cafago', tomtop:'TomTop' };
        const opciones = campos
            .filter(c => grupo[c] != null)
            .map(c => ({ nombre: nombres[c], producto: grupo[c] }));

        if (!opciones.length) return 'Ninguna';
        if (opciones.length === 1) return opciones[0].nombre;

        let mejor = Infinity, mejorNombre = opciones[0].nombre;
        for (const { nombre, producto } of opciones) {
            const score = this.score(producto);
            if (score < mejor) { mejor = score; mejorNombre = nombre; }
        }
        return mejorNombre;
    }

    ahorro(grupo) {
        const precios = ['aliexpress','banggood','geekbuying','temu','ebay','miravia','cafago','tomtop']
            .map(c => grupo[c]?.price).filter(p => p != null && p > 0);
        if (precios.length < 2) return 0;
        return Math.max(...precios) - Math.min(...precios);
    }

    score(p) {
        const r = Math.min((p.rating || 0) / 5, 1);
        return p.price * (1.5 - r);
    }
}

window.ComparadorMultitienda = ComparadorMultitienda;
