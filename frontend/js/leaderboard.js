document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboardData();
});

async function fetchLeaderboardData() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leaderboardData = await response.json();
        displayLeaderboard(leaderboardData);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        const tbody = document.querySelector('#leaderboard-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="3">Error al cargar el leaderboard. Intente más tarde.</td></tr>';
        }
    }
}

function displayLeaderboard(data) {
    const tbody = document.querySelector('#leaderboard-table tbody');
    if (!tbody) {
        console.error('Leaderboard table body not found!');
        return;
    }

    tbody.innerHTML = ''; // Limpiar datos anteriores

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No hay datos disponibles en el leaderboard.</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tbody.insertRow();
        const rankCell = row.insertCell();
        const bankCell = row.insertCell();
        const scoreCell = row.insertCell();

        rankCell.textContent = item.rank;
        bankCell.textContent = item.bank;
        scoreCell.textContent = item.averageRating.toFixed(1); 
    });
} 