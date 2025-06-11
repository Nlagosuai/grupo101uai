document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const leaderboardList = document.getElementById('leaderboard-list');
    const scoreHeader = document.getElementById('score-header');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorIndicator = document.getElementById('error-indicator');

    const categoryNames = {
        averageRating: 'Promedio General',
        facilidadDeUso: 'Facilidad de Uso',
        accesibilidad: 'Accesibilidad',
        estabilidad: 'Estabilidad',
        precio: 'Precio',
        serviciosAlUsuario: 'Servicios al Usuario'
    };

    async function fetchLeaderboard(category = 'averageRating') {
        loadingIndicator.style.display = 'flex';
        errorIndicator.style.display = 'none';
        leaderboardList.innerHTML = '';
        
        const currentCategoryTitle = document.getElementById('current-category-title');
        if (currentCategoryTitle) {
            currentCategoryTitle.textContent = categoryNames[category] || 'Promedio';
        }

        try {
            const response = await fetch(`/api/leaderboard?sortBy=${category}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            renderLeaderboard(data.leaderboard, category);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            errorIndicator.style.display = 'flex';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function renderLeaderboard(leaderboardData, category) {
        if (!leaderboardData || leaderboardData.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">No hay datos disponibles para mostrar.</div>';
            return;
        }

        leaderboardData.forEach(bank => {
            const score = (category === 'averageRating' ? bank.averageRating : bank.subRatings[category]) || 0;
            const stars = renderStars(score);
            const card = document.createElement('div');
            card.className = 'leaderboard-card';

            card.innerHTML = `
                <div class="card-rank">${bank.rank}</div>
                <div class="card-bank-info">
                    <span class="bank-name">${bank.bank}</span>
                    <div class="score-display">
                        <span class="stars">${stars}</span>
                        <span class="score-number">(${score.toFixed(1)})</span>
                    </div>
                </div>
                <div class="card-review-count">
                    <span>${bank.reviewCount}</span>
                    <small>Reseñas</small>
                </div>
            `;
            leaderboardList.appendChild(card);
        });
    }

    function renderStars(rating) {
        const validatedRating = isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating));
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= validatedRating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= validatedRating) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        return starsHtml;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            fetchLeaderboard(category);
        });
    });

    // Initial load
    fetchLeaderboard('averageRating');
}); 