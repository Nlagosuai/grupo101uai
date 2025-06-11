document.addEventListener('DOMContentLoaded', () => {
    // Inicializar las funcionalidades de navegación
    initSmoothScrolling();
});

/**
 * Inicializa el desplazamiento suave para los enlaces internos
 */
function initSmoothScrolling() {
    // Seleccionar todos los enlaces que llevan a secciones de reseñas
    const reviewLinks = document.querySelectorAll('.scroll-to-reviews');
    
    reviewLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Obtener el ID del destino desde el href
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Desplazamiento suave hacia el elemento destino
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Reutilizar la lógica existente de status.js
// Esta funcionalidad se mantiene separada en su propio archivo 