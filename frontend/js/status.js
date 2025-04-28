// Estados page script

function updateStatuses() {
    fetch('/api/statuses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(statusesData => {
            const activeBanksElement = document.getElementById('bancos-activos');
            const inactiveBanksElement = document.getElementById('bancos-inactivos');
            const lastUpdateElement = document.getElementById('ultima-actualizacion');
            const banksGridContainer = document.querySelector('.banks-grid');

            if (!activeBanksElement || !inactiveBanksElement || !lastUpdateElement || !banksGridContainer) {
                console.error("Required elements not found in the DOM.");
                return;
            }

            const activeBanksCount = statusesData.filter(bank => bank.state === "active").length;
            const inactiveBanksCount = statusesData.length - activeBanksCount;

            activeBanksElement.textContent = `Bancos Activos: ${activeBanksCount}`;
            inactiveBanksElement.textContent = `Bancos Inactivos: ${inactiveBanksCount}`;
            lastUpdateElement.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;

            const bankCardElements = banksGridContainer.querySelectorAll('.bank-card');
            const statusDataMap = new Map(statusesData.map(b => [b.name, b]));

            bankCardElements.forEach(cardElement => {
                const bankNameElement = cardElement.querySelector('.bank-name');
                if (!bankNameElement) return;

                const bankName = bankNameElement.textContent;
                const bankStatusData = statusDataMap.get(bankName);

                if (bankStatusData) {
                    const statusBadgeElement = cardElement.querySelector('.status-badge');
                    const statusIconElement = cardElement.querySelector('.status-icon');

                    if (statusBadgeElement && statusIconElement) {
                        const isBankOnline = bankStatusData.state === "active";

                        statusBadgeElement.textContent = bankStatusData.statusText;
                        statusBadgeElement.prepend(statusIconElement);

                        statusBadgeElement.classList.remove('status-online', 'status-offline');
                        statusBadgeElement.classList.add(isBankOnline ? 'status-online' : 'status-offline');

                        statusIconElement.classList.remove('fa-check-circle', 'fa-times-circle');
                        statusIconElement.classList.add(isBankOnline ? 'fa-check-circle' : 'fa-times-circle');
                    }
                }
            });

        })
        .catch(error => {
            console.error('Error fetching statuses:', error);
            const lastUpdateElement = document.getElementById('ultima-actualizacion');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = 'Error al actualizar. Intente de nuevo.';
                lastUpdateElement.style.color = 'var(--color-error)';
            }
        });
}

document.addEventListener('DOMContentLoaded', () => {
    updateStatuses();

    setInterval(updateStatuses, 600000);

    const refreshButtonElement = document.querySelector('.refresh-section .button');
    if (refreshButtonElement) {
        refreshButtonElement.addEventListener('click', updateStatuses);
    }
});