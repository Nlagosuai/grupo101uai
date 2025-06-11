document.addEventListener('DOMContentLoaded', () => {
    const ratingContainers = document.querySelectorAll('.star-rating, .star-rating-small');

    ratingContainers.forEach(container => {
        const stars = [...container.querySelectorAll('.star')];
        const ratingInput = container.querySelector('.rating-value');

        // Mouseover event for hover effect
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const hoverRating = parseInt(star.dataset.rating);
                updateStarsVisual(stars, hoverRating, false); // false = don't show half stars on hover
            });
        });

        // Mouseout event to restore the selected state
        container.addEventListener('mouseout', () => {
            const currentRating = parseFloat(ratingInput.value) || 0;
            updateStarsVisual(stars, currentRating, true); // true = show half stars if they exist
        });

        // Click event for selection
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const clickedRating = parseInt(star.dataset.rating);
                const currentRating = parseFloat(ratingInput.value) || 0;
                let newRating;

                // If clicking the same star that represents the current integer value, subtract 0.5
                if (currentRating === clickedRating) {
                    newRating = clickedRating - 0.5;
                } else {
                    newRating = clickedRating;
                }
                
                ratingInput.value = newRating;
                updateStarsVisual(stars, newRating, true);
            });
        });
    });

    function updateStarsVisual(starElements, rating, allowHalf) {
        starElements.forEach(star => {
            const starValue = parseInt(star.dataset.rating);
            const icon = star.querySelector('i');

            if (starValue <= rating) {
                icon.className = 'fas fa-star'; // Full star
                icon.style.color = 'var(--color-star)';
            } else if (allowHalf && starValue - 0.5 === rating) {
                icon.className = 'fas fa-star-half-alt'; // Half star
                icon.style.color = 'var(--color-star)';
            } else {
                icon.className = 'far fa-star'; // Empty star (outline)
                icon.style.color = '#ccc'; // Color para estrellas vacías
            }
        });
    }

    // Form submission validation
    const evaluationForm = document.getElementById('evaluationForm');
    if (evaluationForm) {
        evaluationForm.addEventListener('submit', (e) => {
            const mainRatingInput = document.querySelector('.star-rating .rating-value');
            if (!mainRatingInput || parseFloat(mainRatingInput.value) === 0) {
                e.preventDefault();
                alert('Por favor, proporciona una calificación general (la principal).');
                return;
            }
            const submitButton = evaluationForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Enviando...';
            }
        });
    }
}); 