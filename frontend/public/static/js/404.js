import { applyTranslations } from './translations.js';
export function render404Page() {
    const pageContainer = document.getElementById('pageContainer');
    pageContainer.className = 'not-found-page';
    pageContainer.innerHTML = `
        <div id="notFoundPage">
            <h2 data-i18n="404.header">404 - Page Not Found</h2>
            <p data-i18n="404.message">The page you are looking for does not exist.</p>
            <button onclick="navigateTo('/profile')" data-i18n="404.goHome">Go to Home</button>
        </div>
    `;
    applyTranslations();
}