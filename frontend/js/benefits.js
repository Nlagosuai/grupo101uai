document.addEventListener('DOMContentLoaded', () => {
    let allBenefits = [];
    const bankLogos = document.querySelectorAll('.bank-logo-btn');
    const benefitsContent = document.getElementById('benefits-content');
    const bankSelector = document.getElementById('bank-selector-container');
    const selectedBankHeader = document.getElementById('selected-bank-header');
    const bankFilterInput = document.getElementById('bank-filter');

    // Cargar beneficios una sola vez al inicio
    fetchBenefits();

    async function fetchBenefits() {
        try {
            const response = await fetch(`/api/benefits`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allBenefits = data.benefits;
            setupBankSelectors();
        } catch (error) {
            console.error('Error fetching benefits:', error);
            const listContainer = document.getElementById('benefits-list');
            if(listContainer) listContainer.innerHTML = '<p class="error-message">No se pudieron cargar los beneficios.</p>';
        }
    }

    function setupBankSelectors() {
        bankLogos.forEach(button => {
            button.addEventListener('click', () => {
                const bankName = button.dataset.bank;
                displayBenefitsForBank(bankName);
            });
        });
    }

    function displayBenefitsForBank(bankName) {
        bankSelector.classList.add('hidden');
        benefitsContent.classList.remove('hidden');

        bankFilterInput.value = bankName;

        const bankData = allBenefits.find(b => b.bank === bankName);
        const bankIcon = bankLogos.length > 0 ? document.querySelector(`[data-bank="${bankName}"] img`).src : '';

        selectedBankHeader.innerHTML = `
            <div class="selected-bank-info">
                <img src="${bankIcon}" alt="Logo ${bankName}" class="selected-bank-logo">
                <h2>Beneficios de ${bankName}</h2>
            </div>
            <button id="change-bank-btn" class="button button-secondary">Cambiar de Banco</button>
        `;

        document.getElementById('change-bank-btn').addEventListener('click', () => {
            benefitsContent.classList.add('hidden');
            bankSelector.classList.remove('hidden');
            bankFilterInput.value = 'all';
        });

        setupAndApplyFilters();
    }

    function setupAndApplyFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const dayFilter = document.getElementById('day-filter');

        categoryFilter.onchange = applyFilters;
        dayFilter.onchange = applyFilters;

        applyFilters();
    }

    function applyFilters() {
        const bankName = bankFilterInput.value;
        const selectedCategory = document.getElementById('category-filter').value;
        const selectedDay = document.getElementById('day-filter').value;

        let bankBenefits = allBenefits.filter(b => b.bank === bankName);
        
        updateFilterOptions(bankBenefits);
        
        if (selectedCategory !== 'all') {
            bankBenefits = bankBenefits.filter(b => b.category === selectedCategory);
        }
        if (selectedDay !== 'all') {
            bankBenefits = bankBenefits.filter(b => b.validDays.includes(selectedDay) || b.validDays.includes('Todos los días'));
        }

        renderBenefits(bankBenefits);
    }
    
    function updateFilterOptions(benefits) {
        const categoryFilter = document.getElementById('category-filter');
        const dayFilter = document.getElementById('day-filter');
        
        const currentCategory = categoryFilter.value;
        const currentDay = dayFilter.value;

        const categories = ['all', ...new Set(benefits.map(b => b.category))];
        const days = ['all', ...new Set(benefits.flatMap(b => b.validDays))];

        categoryFilter.innerHTML = categories.map(c => `<option value="${c}">${c === 'all' ? 'Todas las categorías' : c}</option>`).join('');
        dayFilter.innerHTML = days.map(d => `<option value="${d}">${d === 'all' ? 'Todos los días' : d}</option>`).join('');
        
        categoryFilter.value = currentCategory;
        dayFilter.value = currentDay;
    }

    function renderBenefits(benefits) {
        const listContainer = document.getElementById('benefits-list');
        listContainer.innerHTML = '';

        if (benefits.length === 0) {
            listContainer.innerHTML = '<p class="no-results">No se encontraron beneficios con los filtros seleccionados.</p>';
            return;
        }

        benefits.forEach(benefit => {
            const categoryClass = benefit.category.replace(/\s+/g, '-');
            const icon = getCategoryIcon(benefit.category);
            const benefitElement = document.createElement('div');
            benefitElement.className = 'benefit-card card';
            benefitElement.innerHTML = `
                <div class="benefit-card-header category-bg ${categoryClass}">
                    <span class="benefit-card-icon">${icon}</span>
                    <h4 class="benefit-card-category">${benefit.category}</h4>
                </div>
                <div class="benefit-card-body">
                    <h3 class="benefit-card-title">${benefit.name}</h3>
                    <p class="benefit-card-description">${benefit.description}</p>
                </div>
                <div class="benefit-card-footer">
                    <strong>Días:</strong> ${benefit.validDays.join(', ')}
                </div>
            `;
            listContainer.appendChild(benefitElement);
        });
    }

    function getCategoryIcon(category) {
        const icons = {
            'Comida': '🍽️',
            'Viajes': '✈️',
            'Entretenimiento': '🎭',
            'Compras': '🛍️',
            'Transporte': '🚗'
        };
        return icons[category] || '✨';
    }
}); 