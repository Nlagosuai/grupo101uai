document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('report-problem-form');
    if (!form) return;

    const hiddenInput = document.getElementById('problem-type');
    const categoryButtons = form.querySelectorAll('.category-btn');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Set the value in the hidden input
            hiddenInput.value = button.dataset.value;

            // Update button styles
            categoryButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!hiddenInput.value) {
            alert('Por favor, selecciona un tipo de problema.');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Deshabilitar el botón para evitar envíos múltiples
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        try {
            const response = await fetch('/api/report-problem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // Redirigir a una página de agradecimiento
                window.location.href = `/thank-you-report?banco=${encodeURIComponent(data.banco)}`;
            } else {
                const errorData = await response.json();
                console.error('Error al enviar el reporte:', errorData.message);
                alert(`Error: ${errorData.message}`);
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Reporte';
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Hubo un problema de conexión. Inténtalo de nuevo.');
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Reporte';
        }
    });
}); 