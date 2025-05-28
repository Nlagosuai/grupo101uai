/**
 * Script para manejar las pestañas en las tarjetas de banco
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar las pestañas
    initializeTabs();
});

/**
 * Inicializa las pestañas en todas las tarjetas de banco
 */
function initializeTabs() {
    // Seleccionar todos los botones de pestaña
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Agregar eventos de clic a cada botón
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Obtener el ID del contenido de la pestaña
            const targetTabId = button.getAttribute('data-tab');
            
            // Obtener el elemento contenedor padre (la tarjeta de banco)
            const bankCard = button.closest('.bank-card');
            
            if (!bankCard) return;
            
            // Desactivar todas las pestañas y contenidos en esta tarjeta
            const siblingButtons = bankCard.querySelectorAll('.tab-btn');
            siblingButtons.forEach(btn => btn.classList.remove('active'));
            
            const tabContents = bankCard.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar la pestaña y contenido seleccionados
            button.classList.add('active');
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
} 