// Dynamic Year Update for Footer
document.addEventListener('DOMContentLoaded', function() {
    // Select the footer paragraph
    const footerText = document.querySelector('footer p');

    // Replace "2024" with the current year
    footerText.textContent = footerText.textContent.replace('2024', new Date().getFullYear());
});
