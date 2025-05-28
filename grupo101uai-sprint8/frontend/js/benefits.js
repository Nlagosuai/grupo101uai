document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de beneficios cargada. JavaScript activo.');
    
    // Almacenar todos los beneficios en memoria para filtrar sin hacer peticiones adicionales
    let allBenefits = [];
    
    // Cargar los beneficios actuales al iniciar
    loadCurrentBenefits();
    
    // Configurar los filtros
    setupFilters();
});

/**
 * Configura los eventos para los filtros
 */
function setupFilters() {
    const bankFilter = document.getElementById('bank-filter');
    const categoryFilter = document.getElementById('category-filter');
    const dayFilter = document.getElementById('day-filter');
    
    // Añadir evento de cambio a cada filtro
    if (bankFilter) {
        bankFilter.addEventListener('change', applyFilters);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (dayFilter) {
        dayFilter.addEventListener('change', applyFilters);
    }
}

/**
 * Aplica todos los filtros seleccionados a los beneficios
 */
function applyFilters() {
    const bankFilter = document.getElementById('bank-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const dayFilter = document.getElementById('day-filter').value;
    
    console.log(`Filtrando por: Banco=${bankFilter}, Categoría=${categoryFilter}, Día=${dayFilter}`);
    
    // Obtener todos los beneficios de nuevo si no están en memoria
    if (!window.allBenefits || window.allBenefits.length === 0) {
        loadCurrentBenefits();
        return;
    }
    
    // Aplicar filtros a los beneficios en memoria
    let filteredBenefits = [...window.allBenefits];
    
    // Filtrar por banco
    if (bankFilter && bankFilter !== 'all') {
        filteredBenefits = filteredBenefits.filter(benefit => 
            benefit.bank.toLowerCase() === bankFilter.toLowerCase()
        );
    }
    
    // Filtrar por categoría
    if (categoryFilter && categoryFilter !== 'all') {
        filteredBenefits = filteredBenefits.filter(benefit => 
            benefit.category.toLowerCase() === categoryFilter.toLowerCase()
        );
    }
    
    // Filtrar por día
    if (dayFilter && dayFilter !== 'all') {
        filteredBenefits = filteredBenefits.filter(benefit => 
            benefit.validDays.some(day => day.toLowerCase() === dayFilter.toLowerCase() || day === 'Todos los días')
        );
    }
    
    // Mostrar los beneficios filtrados
    displayBenefits(filteredBenefits);
}

/**
 * Carga los beneficios del mes y año actual
 */
async function loadCurrentBenefits() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    await loadBenefitsForMonth(currentYear, currentMonth);
}

/**
 * Carga beneficios para un mes y año específicos
 */
async function loadBenefitsForMonth(year, month) {
    try {
        const response = await fetch(`/api/benefits`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        
        // Guardar todos los beneficios en una variable global para filtrar sin hacer peticiones adicionales
        window.allBenefits = data.benefits;
        
        // Mostrar todos los beneficios inicialmente
        displayBenefits(data.benefits);
        
        // Actualizar los filtros con los valores disponibles
        updateFilterOptions(data.benefits);
    } catch (error) {
        console.error('Error al cargar beneficios:', error);
        displayErrorMessage('No se pudieron cargar los beneficios. Intente nuevamente más tarde.');
    }
}

/**
 * Actualiza las opciones de los filtros según los datos disponibles
 */
function updateFilterOptions(benefits) {
    // Obtener valores únicos para los filtros
    const banks = [...new Set(benefits.map(b => b.bank))];
    const categories = [...new Set(benefits.map(b => b.category))];
    const days = [...new Set(benefits.flatMap(b => b.validDays))];
    
    // Opcional: Actualizar dinámicamente las opciones de los filtros
    // Esta función podría expandirse para generar dinámicamente las opciones
    console.log('Bancos disponibles:', banks);
    console.log('Categorías disponibles:', categories);
    console.log('Días disponibles:', days);
}

/**
 * Muestra los beneficios en la página
 */
function displayBenefits(benefits) {
    const listContainer = document.getElementById('benefits-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Limpiar lista anterior

    if (!benefits || benefits.length === 0) {
        listContainer.innerHTML = '<p class="no-results">No hay beneficios que coincidan con los filtros seleccionados.</p>';
        return;
    }

    // Agrupar beneficios por banco
    const benefitsByBank = {};
    
    benefits.forEach(benefit => {
        if (!benefitsByBank[benefit.bank]) {
            benefitsByBank[benefit.bank] = [];
        }
        benefitsByBank[benefit.bank].push(benefit);
    });

    // Crear sección para cada banco
    for (const bank in benefitsByBank) {
        const bankBenefits = benefitsByBank[bank];
        
        const bankSection = document.createElement('div');
        bankSection.className = 'bank-benefits-section';
        
        const bankTitle = document.createElement('h3');
        bankTitle.className = 'bank-name';
        bankTitle.textContent = bank;
        bankSection.appendChild(bankTitle);
        
        const benefitsList = document.createElement('ul');
        benefitsList.className = 'benefits-list';
        
        bankBenefits.forEach(benefit => {
            const benefitItem = document.createElement('li');
            benefitItem.className = 'benefit-item';
            
            // Determinar la clase CSS e ícono basados en la categoría
            const categoryClass = getCategoryCssClass(benefit.category);
            const categoryIcon = getCategoryIcon(benefit.category);
            
            benefitItem.innerHTML = `
                <div class="benefit-header">
                    <h4 class="benefit-name">${benefit.name}</h4>
                    <span class="benefit-category ${categoryClass}">
                        <span class="category-icon">${categoryIcon}</span>
                        ${benefit.category}
                    </span>
                </div>
                <p class="benefit-description">${benefit.description}</p>
                <div class="benefit-valid-days">
                    <strong>Días válidos:</strong> ${benefit.validDays.join(', ')}
                </div>
            `;
            
            benefitsList.appendChild(benefitItem);
        });
        
        bankSection.appendChild(benefitsList);
        listContainer.appendChild(bankSection);
    }
}

/**
 * Devuelve la clase CSS correspondiente a una categoría
 */
function getCategoryCssClass(category) {
    const normalizedCategory = category.trim();
    
    // Categorías conocidas
    const knownCategories = ['Comida', 'Viajes', 'Entretenimiento', 'Compras', 'Transporte'];
    
    // Verificar si la categoría está en la lista de conocidas
    if (knownCategories.includes(normalizedCategory)) {
        return `category-${normalizedCategory}`;
    }
    
    // Devolver clase por defecto para categorías no reconocidas
    return 'category-default';
}

/**
 * Devuelve el ícono correspondiente a una categoría
 */
function getCategoryIcon(category) {
    const normalizedCategory = category.trim();
    
    // Mapeo de categorías a íconos
    const categoryIcons = {
        'Comida': '🍽️',
        'Viajes': '✈️',
        'Entretenimiento': '🎭',
        'Compras': '🛍️',
        'Transporte': '🚗'
    };
    
    // Devolver ícono si existe, o un ícono por defecto
    return categoryIcons[normalizedCategory] || '📋';
}

/**
 * Muestra un mensaje de error
 */
function displayErrorMessage(message) {
    const listContainer = document.getElementById('benefits-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
} 