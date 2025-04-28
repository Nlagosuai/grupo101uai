document.addEventListener('DOMContentLoaded', () => {
    const starsContainer = document.querySelector('.star-rating .stars');
    const starLabels = starsContainer ? Array.from(starsContainer.querySelectorAll('.star')) : [];
    const ratingTextElement = document.querySelector('.rating-text');
    const ratingRadioInputs = starsContainer ? Array.from(starsContainer.querySelectorAll('input[type="radio"]')) : [];
    const categoryTagsContainer = document.querySelector('.category-tags');
    const categoryTagLabels = categoryTagsContainer ? Array.from(categoryTagsContainer.querySelectorAll('.category-tag')) : [];

    let currentSelectedRating = 0;

    // --- Star Rating Logic ---

    const updateStarRatingVisuals = (rating) => {
        starLabels.forEach(starLabel => {
            const starRatingValue = parseInt(starLabel.dataset.rating || '0');
            if (starRatingValue <= rating) {
                starLabel.classList.add('active');
            } else {
                starLabel.classList.remove('active');
            }
        });
        if (ratingTextElement) {
            ratingTextElement.textContent = rating > 0 ? `Calificación: ${rating} estrella${rating > 1 ? 's' : ''}` : 'Selecciona una calificación';
        }
    };

    starLabels.forEach(starLabel => {
        starLabel.addEventListener('mouseover', () => {
            const hoverRatingValue = parseInt(starLabel.dataset.rating || '0');
            updateStarRatingVisuals(hoverRatingValue);
        });

        starLabel.addEventListener('mouseout', () => {
            // Restore visual to the actual selected rating
            updateStarRatingVisuals(currentSelectedRating);
        });

        starLabel.addEventListener('click', () => {
            currentSelectedRating = parseInt(starLabel.dataset.rating || '0');
            // Find the corresponding radio button and check it
            const correspondingRadioInput = ratingRadioInputs.find(input => parseInt(input.value) === currentSelectedRating);
            if (correspondingRadioInput) {
                correspondingRadioInput.checked = true;
            }
            updateStarRatingVisuals(currentSelectedRating); // Update visual permanently on click
        });
    });

    // Initial state check (if a rating was already selected, e.g., server-side error redisplay)
    const initiallyCheckedRadio = ratingRadioInputs.find(input => input.checked);
    if (initiallyCheckedRadio) {
        currentSelectedRating = parseInt(initiallyCheckedRadio.value);
        updateStarRatingVisuals(currentSelectedRating);
    }

    // --- Category Tag Logic ---

    categoryTagLabels.forEach(label => {
        const checkboxId = label.getAttribute('for');
        const checkboxInput = checkboxId ? document.getElementById(checkboxId) : null;

        if (checkboxInput) {
            // Sync label style with initial checkbox state
            if (checkboxInput.checked) {
                label.classList.add('active');
            }

            // Toggle style on click
            label.addEventListener('click', () => {
                // The click on the label inherently toggles the checkbox state
                // We just need to sync the visual style *after* the state changes
                // Use setTimeout to allow the browser to process the click and state change first
                setTimeout(() => {
                    if (checkboxInput.checked) {
                        label.classList.add('active');
                    } else {
                        label.classList.remove('active');
                    }
                }, 0);
            });
        }
    });

    
}); 