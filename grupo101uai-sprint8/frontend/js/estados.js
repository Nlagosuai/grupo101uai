// Estados page script

function actualizarEstados() {
    fetch('/api/estados')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(datos => {
            const bancosActivosElement = document.getElementById('bancos-activos');
            const bancosInactivosElement = document.getElementById('bancos-inactivos');
            const ultimaActualizacionElement = document.getElementById('ultima-actualizacion');
            const banksGridElement = document.querySelector('.banks-grid'); // Get the grid container

            if (!bancosActivosElement || !bancosInactivosElement || !ultimaActualizacionElement || !banksGridElement) {
                console.error("Required elements not found in the DOM.");
                return;
            }

            // Calculate active/inactive counts
            const bancosActivos = datos.filter(banco => banco.estado === "activo").length;
            const bancosInactivos = datos.length - bancosActivos;

            // Update summary stats
            bancosActivosElement.textContent = `Bancos Activos: ${bancosActivos}`;
            bancosInactivosElement.textContent = `Bancos Inactivos: ${bancosInactivos}`;
            ultimaActualizacionElement.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;

            // --- Update individual bank cards dynamically --- START
            const bankCards = banksGridElement.querySelectorAll('.bank-card');
            const statusMap = new Map(datos.map(b => [b.nombre, b])); // Create a map for easy lookup

            bankCards.forEach(card => {
                const bankNameElement = card.querySelector('.bank-name');
                if (!bankNameElement) return;

                const bankName = bankNameElement.textContent;
                const bankData = statusMap.get(bankName);

                if (bankData) {
                    const statusBadge = card.querySelector('.status-badge');
                    const statusIcon = card.querySelector('.status-icon');

                    if (statusBadge && statusIcon) {
                        const esEnLinea = bankData.estado === "activo";

                        // Update badge text
                        statusBadge.textContent = bankData.status;
                        // Re-insert icon because textContent replaces it
                        statusBadge.prepend(statusIcon);

                        // Update badge classes
                        statusBadge.classList.remove('status-online', 'status-offline');
                        statusBadge.classList.add(esEnLinea ? 'status-online' : 'status-offline');

                        // Update icon classes
                        statusIcon.classList.remove('fa-check-circle', 'fa-times-circle');
                        statusIcon.classList.add(esEnLinea ? 'fa-check-circle' : 'fa-times-circle');
                    }
                }
            });
            // --- Update individual bank cards dynamically --- END

        })
        .catch(error => {
            console.error('Error al actualizar estados:', error);
            // Optionally display an error message to the user on the page
            const ultimaActualizacionElement = document.getElementById('ultima-actualizacion');
            if (ultimaActualizacionElement) {
                ultimaActualizacionElement.textContent = 'Error al actualizar. Intente de nuevo.';
                ultimaActualizacionElement.style.color = 'var(--color-error)';
            }
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial update
    actualizarEstados();

    // Set interval for periodic updates (every 10 minutes)
    setInterval(actualizarEstados, 600000); // 600000ms = 10 minutes

    // Add event listener to the refresh button if it exists
    const refreshButton = document.querySelector('.refresh-section .button');
    if (refreshButton) {
        refreshButton.addEventListener('click', actualizarEstados);
    }
}); 