// Estados page script

function updateStatuses() {
    // Mostrar indicador visual de actualización
    const lastUpdateElement = document.getElementById('ultima-actualizacion');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = 'Actualizando...';
        lastUpdateElement.style.color = 'var(--primary-color)';
    }

    fetch('/api/statuses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // La respuesta del API contiene los estados en data.statuses
            const statusesData = data.statuses || [];
            
            const activeBanksElement = document.getElementById('bancos-activos');
            const inactiveBanksElement = document.getElementById('bancos-inactivos');
            const lastUpdateElement = document.getElementById('ultima-actualizacion');
            const banksGridContainer = document.querySelector('.banks-grid');

            if (!activeBanksElement || !inactiveBanksElement || !lastUpdateElement || !banksGridContainer) {
                console.error("Required elements not found in the DOM.");
                return;
            }

            // Consideramos que un banco está activo si su estado es "online"
            const activeBanksCount = statusesData.filter(bank => bank.status === "online").length;
            const inactiveBanksCount = statusesData.length - activeBanksCount;

            // Actualizar contadores
            activeBanksElement.textContent = `Bancos Activos: ${activeBanksCount}`;
            inactiveBanksElement.textContent = `Bancos Inactivos: ${inactiveBanksCount}`;
            
            // Actualizar hora de actualización
            const currentTime = new Date().toLocaleTimeString();
            lastUpdateElement.textContent = `Última actualización: ${currentTime}`;
            lastUpdateElement.style.color = 'var(--text-color)';

            // Mapear la información de estado para acceso rápido
            const statusDataMap = new Map(statusesData.map(b => [b.name, b]));

            // Actualizar cada tarjeta de banco
            const bankCardElements = banksGridContainer.querySelectorAll('.bank-card');
            bankCardElements.forEach(cardElement => {
                const bankNameElement = cardElement.querySelector('.bank-name');
                if (!bankNameElement) return;

                const bankName = bankNameElement.textContent;
                const bankStatusData = statusDataMap.get(bankName);

                if (bankStatusData) {
                    const statusBadgeElement = cardElement.querySelector('.status-badge');
                    const statusIconElement = cardElement.querySelector('.status-icon');
                    const lastUpdateElement = cardElement.querySelector('.card-last-update');

                    if (statusBadgeElement && statusIconElement) {
                        const isBankOnline = bankStatusData.status === "online";
                        const statusText = isBankOnline ? "Operativo" : "Con Problemas";

                        // Actualizar el texto manteniendo el ícono
                        statusBadgeElement.textContent = statusText;
                        statusBadgeElement.prepend(statusIconElement);

                        // Actualizar clases CSS para el estilo
                        statusBadgeElement.classList.remove('status-online', 'status-offline');
                        statusBadgeElement.classList.add(isBankOnline ? 'status-online' : 'status-offline');

                        // Actualizar el ícono
                        statusIconElement.classList.remove('fa-check-circle', 'fa-times-circle');
                        statusIconElement.classList.add(isBankOnline ? 'fa-check-circle' : 'fa-times-circle');
                    }
                    
                    // Actualizar el indicador de última actualización en la tarjeta
                    if (lastUpdateElement) {
                        lastUpdateElement.textContent = `Estado actualizado: ${currentTime}`;
                    }
                }
            });

            console.log("Estados actualizados correctamente:", currentTime);
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
    // Actualizar al cargar la página
    updateStatuses();

    // Actualizar cada 2 minutos (120000 ms)
    setInterval(updateStatuses, 120000);

    // Configurar botón de actualizar
    const refreshButtonElement = document.querySelector('.refresh-section .button');
    if (refreshButtonElement) {
        refreshButtonElement.addEventListener('click', updateStatuses);
    }
});