import * as DomUtils from "./game/DomUtils.js";

export async function setLanguage(lang) {
  try {
    const response = await fetch(`/translations/${lang}.json`);
    if (!response.ok) {
      throw new Error("Translation file not found");
    }
    const translations = await response.json();
    sessionStorage.setItem("lang", lang);
    applyTranslations(translations);

    // Update the language flag image
    const langFlagImage = document.getElementById("current-lang-flag");
    if (langFlagImage) {
      langFlagImage.src = `static/img/${lang}.png`;
    }
  } catch (error) {
    console.error(error);
    DomUtils.createAlert("alert.languageFailed");
  }
}

export async function applyTranslations(translations = null) {
  if (!translations) {
    const lang = sessionStorage.getItem("lang") || "en";
    try {
      const response = await fetch(`/translations/${lang}.json`);
      if (!response.ok) {
        throw new Error("Translation file not found");
      }
      translations = await response.json();
    } catch (error) {
      console.error(error);
      return;
    }
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const keys = key.split(".");
    let text = translations;
    let missing = false;
    for (const k of keys) {
      if (text[k] !== undefined) {
        text = text[k];
      } else {
        console.warn(`Missing translation key: ${key}`);
        missing = true;
        break;
      }
    }
    if (!missing && text) {
      element.innerText = text;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const keys = key.split(".");
    let placeholder = translations;
    let missing = false;
    for (const k of keys) {
      if (placeholder[k] !== undefined) {
        placeholder = placeholder[k];
      } else {
        console.warn(`Missing translation key: ${key}`);
        missing = true;
        break;
      }
    }
    if (!missing && placeholder) {
      element.placeholder = placeholder;
    }
  });
}
