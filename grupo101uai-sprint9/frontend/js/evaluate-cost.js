document.addEventListener('DOMContentLoaded', () => {
    initStarRating();
    initCategoryTags();
    setupFormSubmit();
});

/**
 * Inicializa el sistema de calificación con estrellas
 */
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.querySelector('.rating-text');
    const ratingTexts = [
        'Sin calificación',
        'Muy costoso',
        'Costoso',
        'Precio razonable',
        'Buen precio',
        'Muy económico'
    ];
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            
            // Actualizar texto de calificación
            if (ratingText) {
                ratingText.textContent = ratingTexts[rating];
            }
            
            // Activar estrellas hasta la seleccionada
            stars.forEach(s => {
                const starRating = parseInt(s.getAttribute('data-rating'));
                if (starRating <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            // Marcar el input correspondiente
            const input = document.getElementById(`costRating${rating}`);
            if (input) {
                input.checked = true;
            }
        });
    });
}

/**
 * Inicializa las categorías (tags) seleccionables
 */
function initCategoryTags() {
    const categoryTags = document.querySelectorAll('.category-tag');
    
    categoryTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Toggle clase 'active'
            tag.classList.toggle('active');
            
            // Actualizar checkbox correspondiente
            const inputId = tag.getAttribute('for');
            const input = document.getElementById(inputId);
            
            if (input) {
                input.checked = tag.classList.contains('active');
            }
        });
    });
}

/**
 * Configura el manejo del envío del formulario
 */
function setupFormSubmit() {
    const form = document.getElementById('costEvaluationForm');
    const successMessage = document.getElementById('successMessage');
    
    if (form) {
        // Para efectos de este código, dejamos que el backend maneje el envío
        // El formulario ya tiene action y method configurados
        
        // Podríamos agregar validación aquí si es necesario
        form.addEventListener('submit', (e) => {
            // Validación básica
            const costRating = form.querySelector('input[name="costRating"]:checked');
            const affordabilityComment = form.querySelector('#affordabilityComment');
            
            if (!costRating || !affordabilityComment.value.trim()) {
                e.preventDefault();
                alert('Por favor, califica el costo y proporciona un comentario.');
            }
        });
    }
} 