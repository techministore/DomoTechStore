/* 
    DomoTechStore - Buscador Simple
    Filtra elementos en tiempo real según la entrada del usuario
*/

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    
    // Solo se ejecuta si existe un elemento con ID 'search-input' en la página
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Seleccionamos tanto tarjetas de productos como de categorías
            const itemsToSearch = document.querySelectorAll('.product-card, .category-card, .faq-item');
            
            itemsToSearch.forEach(item => {
                // Obtenemos todo el texto dentro de la tarjeta
                const textContent = item.innerText.toLowerCase();
                
                // Si el término de búsqueda está incluido en el texto, mostramos; si no, ocultamos
                if (textContent.includes(searchTerm)) {
                    item.style.display = '';
                    // Añadimos una pequeña animación de aparición si estaba oculto
                    if (item.style.opacity === '0') {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }
                } else {
                    item.style.display = 'none';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                }
            });

            // Feedback visual si no hay resultados
            const visibleItems = Array.from(itemsToSearch).filter(item => item.style.display !== 'none');
            handleNoResults(visibleItems.length, searchInput);
        });
    }
});

/**
 * Muestra un mensaje si no se encuentran resultados
 */
function handleNoResults(count, inputElement) {
    let noResultsMsg = document.getElementById('no-results-msg');
    
    if (count === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('p');
            noResultsMsg.id = 'no-results-msg';
            noResultsMsg.style.textAlign = 'center';
            noResultsMsg.style.padding = '40px';
            noResultsMsg.style.color = '#666';
            noResultsMsg.textContent = 'No se encontraron productos o categorías que coincidan con tu búsqueda.';
            inputElement.closest('.container').appendChild(noResultsMsg);
        }
    } else {
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
}