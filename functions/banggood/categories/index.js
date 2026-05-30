export async function onRequest() {
    try {
        const categories = [
            {
                id: 1,
                name: "Iluminación Inteligente",
                nameEn: "Smart Lighting",
                slug: "lighting",
                icon: "💡"
            },
            {
                id: 2,
                name: "Seguridad y Vigilancia",
                nameEn: "Security & Surveillance",
                slug: "security",
                icon: "📷"
            },
            {
                id: 3,
                name: "Enchufes y Energía",
                nameEn: "Plugs & Energy",
                slug: "plugs",
                icon: "🔌"
            },
            {
                id: 4,
                name: "Cámaras WiFi",
                nameEn: "WiFi Cameras",
                slug: "cameras",
                icon: "🎥"
            },
            {
                id: 5,
                name: "Sensores y Automatización",
                nameEn: "Sensors & Automation",
                slug: "sensors",
                icon: "🛠️"
            },
            {
                id: 6,
                name: "Gaming y Setup",
                nameEn: "Gaming & Setup",
                slug: "gaming",
                icon: "🎮"
            },
            {
                id: 7,
                name: "Limpieza Inteligente",
                nameEn: "Smart Cleaning",
                slug: "cleaning",
                icon: "🧹"
            },
            {
                id: 8,
                name: "Cocina Inteligente",
                nameEn: "Smart Kitchen",
                slug: "kitchen",
                icon: "🍳"
            },
            {
                id: 9,
                name: "Climatización Inteligente",
                nameEn: "Smart Climate",
                slug: "climate",
                icon: "❄️"
            },
            {
                id: 10,
                name: "Electrónica y Gadgets",
                nameEn: "Electronics & Gadgets",
                slug: "electronics",
                icon: "📱"
            }
        ];

        return new Response(JSON.stringify({ code: 0, data: { categories } }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
