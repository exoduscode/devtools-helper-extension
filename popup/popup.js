async function getActiveTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs[0].id);
      } else {
        resolve(null);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const pickFontBtn = document.getElementById("btn-pick-font");
  const langSelect = document.getElementById("lang-select");
  const themeSelect = document.getElementById("theme-select");

  const updateButtonText = () => {
    const baseText = translator.getMessage("detectCSSTitle");
    const onLabel = translator.getMessage("labelOn");
    const offLabel = translator.getMessage("labelOff");
    const isDetecting = pickFontBtn.classList.contains('active');

    const icon = '🔤'; // Keep the icon consistent
    if (isDetecting) {
      pickFontBtn.innerHTML = `${icon} ${baseText} <span style="color: #a5d6a7;">${onLabel}</span>`;
    } else {
      pickFontBtn.innerHTML = `${icon} ${baseText} <span style="color: #ef9a9a;">${offLabel}</span>`;
    }
  };

  const setInitialState = async () => {
    const { userLang = 'en', isDetecting, userTheme = 'system' } = await chrome.storage.local.get(["userLang", "isDetecting", "userTheme"]);
    langSelect.value = userLang;
    themeSelect.value = userTheme;
    
    await translator.load(userLang);
    translator.apply();

    if (isDetecting) pickFontBtn.classList.add("active");
    updateButtonText();
  };

  // Handle Language Change
  langSelect.addEventListener("change", async () => {
    const selectedLang = langSelect.value;
    await chrome.storage.local.set({ userLang: selectedLang });
    await translator.load(selectedLang);
    translator.apply();
    updateButtonText();
  });

  themeSelect.addEventListener("change", async () => {
    const selectedTheme = themeSelect.value;
    await themeManager.setTheme(selectedTheme);
  });

  // --- Event Listeners for Buttons ---

  document.getElementById("btn-clear-session").addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    if (tabId) chrome.scripting.executeScript({ target: { tabId }, func: () => sessionStorage.clear() });
    window.close();
  });

  document.getElementById("btn-clear-local").addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    if (tabId) chrome.scripting.executeScript({ target: { tabId }, func: () => localStorage.clear() });
    window.close();
  });

  document.getElementById("btn-clear-cookies").addEventListener("click", () => {
    chrome.browsingData.remove({ since: 0 }, { cookies: true });
    window.close();
  });

  pickFontBtn.addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    const { isDetecting } = await chrome.storage.local.get("isDetecting");
    const newIsDetecting = !isDetecting;
    
    await chrome.storage.local.set({ isDetecting: newIsDetecting });
    if (tabId) {
        chrome.tabs.sendMessage(tabId, {
            action: "toggle-css-detect",
            isDetecting: newIsDetecting,
        });
    }
    pickFontBtn.classList.toggle('active');
    updateButtonText();
    setTimeout(() => window.close(), 100);
  });

  // --- Color Finder --- 
  const findColorsBtn = document.getElementById('btn-find-colors');
  const colorResultsDiv = document.getElementById('color-results');

  findColorsBtn.addEventListener('click', async () => {
    const tabId = await getActiveTabId();
    if (tabId) {
        findColorsBtn.disabled = true;
        findColorsBtn.textContent = 'Finding...';
        chrome.tabs.sendMessage(tabId, { action: 'find-colors' });
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'color-results') {
        findColorsBtn.disabled = false;
        findColorsBtn.innerHTML = `<span data-i18n="findColorsButton"></span>`;
        translator.apply(); // Re-apply to translate the button text

        colorResultsDiv.innerHTML = ''; // Clear previous results
        msg.colors.forEach(colorString => {
            const color = new Color(colorString);
            const rgb = color.toRgb();
            const hex = color.toHex();

            const item = document.createElement('div');
            item.className = 'color-item';

            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = rgb;

            const details = document.createElement('div');
            details.className = 'color-details';

            const rgbValue = document.createElement('div');
            rgbValue.className = 'color-value';
            rgbValue.textContent = rgb;
            rgbValue.title = 'Copy RGB';
            rgbValue.addEventListener('click', () => navigator.clipboard.writeText(rgb));

            const hexValue = document.createElement('div');
            hexValue.className = 'color-value';
            hexValue.textContent = hex;
            hexValue.title = 'Copy HEX';
            hexValue.addEventListener('click', () => navigator.clipboard.writeText(hex));

            details.appendChild(rgbValue);
            details.appendChild(hexValue);
            item.appendChild(swatch);
            item.appendChild(details);
            colorResultsDiv.appendChild(item);
        });
    }
  });

  // Initialize the popup
  await setInitialState();
});
