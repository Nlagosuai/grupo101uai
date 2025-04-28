// Countdown script for thank you page
document.addEventListener('DOMContentLoaded', () => {
    let count = 3;
    const countdownElement = document.querySelector('.countdown');

    if (countdownElement) {
        const interval = setInterval(() => {
            count--;
            countdownElement.textContent = count.toString();

            if (count <= 0) {
                clearInterval(interval);
                // Optional: Redirect if meta refresh fails
                // window.location.href = '/';
            }
        }, 1000);
    }
}); 