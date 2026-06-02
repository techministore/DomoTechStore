/**
 * DomoTechStore - Banggood UI Module
 * ⚡ Módulo seguro: SOLO UI + llamadas al Worker
 * ❌ Sin claves
 * ❌ Sin OAuth
 * ❌ Sin BanggoodAPIClient
 * ✔ Llama únicamente al Worker /banggood
 */

// ============================================================================
// 🎟️ CUPONES
// ============================================================================

class CouponsManager {
    constructor() {
        this.cacheKey = 'domotech_coupons_cache';
        this.cacheDuration = 60 * 60 * 1000; // 1 hora
        this.coupons = [];
    }

    async getCouponList() {
        const cached = this._getCached();
        if (cached) return cached;

        try {
            const res = await fetch('/banggood?action=coupons');
            const data = await res.json();

            if (data?.coupon_list?.length) {
                this.coupons = data.coupon_list;
                this._cache(this.coupons);
                return this.coupons;
            }

            return this._fallback();
        } catch {
            return this._fallback();
        }
    }

    getSorted() {
        return [...this.coupons].sort((a, b) => {
            const A = parseFloat(a.discount || 0);
            const B = parseFloat(b.discount || 0);
            return B - A;
        });
    }

    _getCached() {
        try {
            const raw = localStorage.getItem(this.cacheKey);
            if (!raw) return null;

            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp < this.cacheDuration) {
                return data.coupons;
            }

            localStorage.removeItem(this.cacheKey);
            return null;
        } catch {
            return null;
        }
    }

    _cache(coupons) {
        localStorage.setItem(this.cacheKey, JSON.stringify({
            coupons,
            timestamp: Date.now()
        }));
    }

    _fallback() {
        return [
            { coupon_code: 'BG0c387a', discount: 5, description: 'Descuento en domótica' },
            { coupon_code: 'TECH2026', discount: 10, description: 'Oferta especial 2026' },
            { coupon_code: 'SUMMER25', discount: 15, description: 'Descuento verano' }
        ];
    }
}

const couponsManager = new CouponsManager();

// ============================================================================
// 🎟️ RENDERIZADO DE CUPONES
// ============================================================================

function renderCouponCard(c) {
    return `
        <div class="card coupon-card">
            <div class="coupon-header">
                <div>
                    <div class="coupon-label">Código</div>
                    <div class="coupon-code">${c.coupon_code}</div>
                </div>
                <div class="coupon-value">-${c.discount || 0}€</div>
            </div>
            <p>${c.description || 'Descuento disponible'}</p>
            <button onclick="copiarCodigo('${c.coupon_code}')">📋 Copiar</button>
        </div>
    `;
}

async function loadCouponsSection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<p>Cargando cupones...</p>`;

    const coupons = await couponsManager.getCouponList();
    const sorted = couponsManager.getSorted();

    container.innerHTML = sorted.slice(0, 3).map(renderCouponCard).join('');
}

// ============================================================================
// ⚡ OFERTAS DEL DÍA
// ============================================================================

async function loadBanggoodDailyOffers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = renderLoadingSkeleton(4);

    try {
        const res = await fetch('/banggood?action=search&q=smart home deals');
        const data = await res.json();

        if (data?.product_list?.length) {
            container.innerHTML = data.product_list
                .slice(0, 4)
                .map(normalizeBanggoodProduct)
                .map(renderFusedProductCard)
                .join('');
        } else {
            container.innerHTML = renderEmptyState();
        }
    } catch {
        container.innerHTML = renderEmptyState();
    }
}

// ============================================================================
// 📋 COPIAR CÓDIGO
// ============================================================================

function copiarCodigo(code) {
    navigator.clipboard.writeText(code);
    alert(`Código ${code} copiado`);
}

// ============================================================================
// 🌐 EXPORTAR
// ============================================================================

window.banggoodUI = {
    loadCoupons: loadCouponsSection,
    loadDailyOffers: loadBanggoodDailyOffers
};

console.log('✅ Banggood UI Module Loaded');
