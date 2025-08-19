import { setLanguage } from './translations.js';

document.addEventListener('DOMContentLoaded', () => {
  const langButton = document.getElementById('lang-button');
  const langDropdown = document.getElementById('lang-dropdown');
  const langOptions = document.querySelectorAll('.lang-option');
  const currentLangFlag = document.getElementById('current-lang-flag');

  // Toggle dropdown visibility on button click
  langButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent event from bubbling up to the document
    langDropdown.classList.toggle('show');
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!langButton.contains(event.target) && !langDropdown.contains(event.target)) {
      langDropdown.classList.remove('show');
    }
  });

  // Handle language selection
  langOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedLang = option.getAttribute('data-lang');
      setLanguage(selectedLang);
      langDropdown.classList.remove('show');
      updateCurrentFlag(selectedLang);
      setActiveLanguage(selectedLang);
    });
  });

  function updateCurrentFlag(lang) {
    currentLangFlag.src = `static/img/${lang}.png`;
  }


  function setActiveLanguage(selectedLang) {
    langOptions.forEach(option => {
      if (option.getAttribute('data-lang') === selectedLang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  // Initialize with default language or previously selected language
  const savedLang = sessionStorage.getItem('lang') || 'en';
  setLanguage(savedLang);
  updateCurrentFlag(savedLang);
  setActiveLanguage(savedLang);
});