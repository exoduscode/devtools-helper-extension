class ThemeManager {
  constructor() {
    this.theme = 'system';
    this.init();
  }

  async init() {
    const { userTheme = 'system' } = await chrome.storage.local.get('userTheme');
    this.theme = userTheme;
    this.apply();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme === 'system') {
        this.applySystemTheme();
      }
    });
  }

  apply() {
    if (this.theme === 'system') {
      this.applySystemTheme();
    } else {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  }

  applySystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  async setTheme(newTheme) {
    this.theme = newTheme;
    await chrome.storage.local.set({ userTheme: newTheme });
    this.apply();
  }
}

const themeManager = new ThemeManager();
