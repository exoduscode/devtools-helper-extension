class Translator {
  constructor() {
    this.translations = {};
    this.currentLang = 'en'; // Default language
  }

  async load(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      return; // Already loaded
    }
    try {
      const response = await fetch(`/_locales/${lang}/messages.json`);
      if (!response.ok) {
        throw new Error(`Could not load ${lang} translations.`);
      }
      const messages = await response.json();
      this.translations[lang] = messages;
      this.currentLang = lang;
    } catch (error) {
      console.error('Translation loading failed:', error);
      // Fallback to English if the selected language fails
      if (lang !== 'en') {
        await this.load('en');
      }
    }
  }

  getMessage(key) {
    const langMessages = this.translations[this.currentLang];
    if (langMessages && langMessages[key]) {
      return langMessages[key].message;
    }
    // Fallback to English if key not found in current language
    const enMessages = this.translations['en'];
    if (enMessages && enMessages[key]) {
      return enMessages[key].message;
    }
    return key; // Return the key itself if not found anywhere
  }

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.getMessage(key);
      if (el.hasAttribute('data-i18n-title')) {
        el.title = translation;
      } else {
        el.textContent = translation;
      }
    });
  }
}

// Create a single instance to be used across the scripts
const translator = new Translator();
