document.addEventListener('DOMContentLoaded', () => {
    // Cargar los datos del leaderboard
    fetchLeaderboardData();
    
    // Configurar eventos de los botones de categoría
    setupCategoryButtons();
    
    // Configurar evento para cerrar detalles
    const closeDetailsButton = document.getElementById('close-details');
    if (closeDetailsButton) {
        closeDetailsButton.addEventListener('click', hideDetails);
    }
});

// Datos globales para almacenar resultados
let leaderboardData = null;
let categories = [];
let currentCategory = 'overall';

/**
 * Configura los eventos para los botones de categoría
 */
function setupCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Quitar clase 'active' de todos los botones
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase 'active' al botón seleccionado
            button.classList.add('active');
            
            // Obtener la categoría seleccionada
            const category = button.getAttribute('data-category');
            currentCategory = category;
            
            // Actualizar título de la categoría actual
            const currentCategoryElement = document.getElementById('current-category');
            if (currentCategoryElement) {
                const categoryName = getCategoryName(category);
                currentCategoryElement.textContent = categoryName;
            }
            
            // Reordenar y mostrar el leaderboard según la categoría seleccionada
            if (leaderboardData) {
                sortAndDisplayLeaderboard(leaderboardData, category);
            }
            
            // Ocultar detalles si están visibles
            hideDetails();
        });
    });
}

/**
 * Obtiene el nombre de una categoría por su ID
 */
function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'General';
}

/**
 * Obtiene los datos del leaderboard desde la API
 */
async function fetchLeaderboardData() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Guardar los datos y categorías
        leaderboardData = data.leaderboard;
        categories = data.categories || [];
        
        // Mostrar el leaderboard con la categoría actual
        sortAndDisplayLeaderboard(leaderboardData, currentCategory);
        
    } catch (error) {
        console.error('Error al obtener datos del leaderboard:', error);
        const tbody = document.querySelector('#leaderboard-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="error-row">Error al cargar el leaderboard. Intente más tarde.</td></tr>';
        }
    }
}

/**
 * Ordena y muestra los datos del leaderboard según la categoría seleccionada
 */
function sortAndDisplayLeaderboard(data, category) {
    if (!data || data.length === 0) {
        return;
    }
    
    // Clonar los datos para no modificar el original
    const sortedData = [...data];
    
    // Ordenar por la categoría seleccionada
    if (category === 'overall') {
        sortedData.sort((a, b) => b.overall - a.overall);
    } else {
        sortedData.sort((a, b) => b.scores[category] - a.scores[category]);
    }
    
    // Actualizar el ranking
    sortedData.forEach((item, index) => {
        item.rank = index + 1;
    });
    
    // Mostrar los datos ordenados
    displayLeaderboard(sortedData, category);
}

/**
 * Muestra los datos del leaderboard en la tabla
 */
function displayLeaderboard(data, category) {
    const tbody = document.querySelector('#leaderboard-table tbody');
    if (!tbody) {
        console.error('Tabla de leaderboard no encontrada!');
        return;
    }

    tbody.innerHTML = ''; // Limpiar datos anteriores

    data.forEach(item => {
        const row = tbody.insertRow();
        
        // Obtener el valor de puntuación según la categoría
        const score = category === 'overall' ? 
            item.overall : 
            item.scores[category];
            
        // Determinar si hay puntuación o no
        const hasScore = score > 0;
        
        // Colorear según la puntuación
        const scoreClass = hasScore ? getScoreClass(score) : 'score-no-data';
        
        // Crear celdas
        const rankCell = row.insertCell();
        rankCell.className = 'rank-cell';
        rankCell.textContent = item.rank;
        
        const bankCell = row.insertCell();
        bankCell.className = 'bank-cell';
        bankCell.textContent = item.name;
        
        const scoreCell = row.insertCell();
        scoreCell.className = `score-cell ${scoreClass}`;
        scoreCell.textContent = hasScore ? score : 'Sin calificación';
        
        // Celda para el botón de detalles
        const detailCell = row.insertCell();
        detailCell.className = 'detail-cell';
        
        const detailButton = document.createElement('button');
        detailButton.className = 'detail-btn';
        detailButton.innerHTML = '<i class="fas fa-info-circle"></i>';
        detailButton.title = 'Ver puntuaciones detalladas';
        
        detailButton.addEventListener('click', () => {
            showDetails(item);
        });
        
        detailCell.appendChild(detailButton);
    });
}

/**
 * Obtiene la clase CSS según la puntuación
 */
function getScoreClass(score) {
    if (score >= 4.5) return 'score-excellent';
    if (score >= 3.5) return 'score-good';
    if (score >= 2.5) return 'score-average';
    if (score >= 1.5) return 'score-poor';
    if (score > 0) return 'score-bad';
    return 'score-no-data';
}

/**
 * Muestra los detalles de puntuación de un banco
 */
function showDetails(bankData) {
    const detailedScores = document.getElementById('detailed-scores');
    const bankNameElement = document.getElementById('detailed-bank-name');
    const scoresGrid = document.getElementById('scores-grid');
    
    if (!detailedScores || !bankNameElement || !scoresGrid) {
        console.error('Elementos de detalles no encontrados');
        return;
    }
    
    // Actualizar nombre del banco
    bankNameElement.textContent = bankData.name;
    
    // Limpiar grid de puntuaciones
    scoresGrid.innerHTML = '';
    
    // Agregar puntuación general
    const hasOverallScore = bankData.overall > 0;
    const overallItem = document.createElement('div');
    overallItem.className = `score-item ${getScoreClass(bankData.overall)}`;
    overallItem.innerHTML = `
        <div class="score-label">General</div>
        <div class="score-value">${hasOverallScore ? bankData.overall : 'Sin calificación'}</div>
    `;
    scoresGrid.appendChild(overallItem);
    
    // Agregar puntuaciones por categoría
    categories.forEach(category => {
        if (category.id === 'overall') return;
        
        const score = bankData.scores[category.id];
        const hasScore = score > 0;
        const scoreItem = document.createElement('div');
        scoreItem.className = `score-item ${getScoreClass(score)}`;
        scoreItem.innerHTML = `
            <div class="score-label">${category.name}</div>
            <div class="score-value">${hasScore ? score : 'Sin calificación'}</div>
        `;
        scoresGrid.appendChild(scoreItem);
    });
    
    // Mostrar panel de detalles
    detailedScores.classList.remove('hidden');
}

/**
 * Oculta el panel de detalles
 */
function hideDetails() {
    const detailedScores = document.getElementById('detailed-scores');
    if (detailedScores) {
        detailedScores.classList.add('hidden');
    }
} 