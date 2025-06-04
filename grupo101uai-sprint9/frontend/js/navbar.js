// Navbar toggle script
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('mobile-active');
        });
    } else {
        console.warn('Hamburger menu or nav links not found for toggle functionality.');
    }
}); 