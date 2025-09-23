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

  // Initialize the popup
  await setInitialState();
});
