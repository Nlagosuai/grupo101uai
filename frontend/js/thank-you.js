// Countdown script for thank you page
document.addEventListener('DOMContentLoaded', () => {
    let count = 5;
    const countdownElement = document.querySelector('.countdown');

    if (countdownElement) {
        const interval = setInterval(() => {
            count--;
            countdownElement.textContent = count.toString();

            if (count <= 0) {
                clearInterval(interval);
                // Redirect to the status page
                window.location.href = '/status';
            }
        }, 1000);
    }
}); 