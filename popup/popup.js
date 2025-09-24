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
  const langSelect = document.getElementById("lang-select");
  const themeSelect = document.getElementById("theme-select");

  const setInitialState = async () => {
    const { userLang = "en", userTheme = "system" } =
      await chrome.storage.local.get(["userLang", "userTheme"]);
    langSelect.value = userLang;
    themeSelect.value = userTheme;

    await translator.load(userLang);
    translator.apply();
  };

  // Handle Language Change
  langSelect.addEventListener("change", async () => {
    const selectedLang = langSelect.value;
    await chrome.storage.local.set({ userLang: selectedLang });
    await translator.load(selectedLang);
    translator.apply();
  });

  themeSelect.addEventListener("change", async () => {
    const selectedTheme = themeSelect.value;
    await themeManager.setTheme(selectedTheme);
  });

  // --- Event Listeners for Buttons ---

  document
    .getElementById("btn-clear-session")
    .addEventListener("click", async () => {
      const tabId = await getActiveTabId();
      if (tabId)
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => sessionStorage.clear(),
        });
      window.close();
    });

  document
    .getElementById("btn-clear-local")
    .addEventListener("click", async () => {
      const tabId = await getActiveTabId();
      if (tabId)
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => localStorage.clear(),
        });
      window.close();
    });

  document.getElementById("btn-clear-cookies").addEventListener("click", () => {
    chrome.browsingData.remove({ since: 0 }, { cookies: true });
    window.close();
  });

  // --- Toast / Status ---
  const showStatus = (messageKey) => {
    const toast = document.getElementById("status-toast");
    if (!toast) return;

    toast.textContent = translator.getMessage(messageKey);
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 5000);
  };

  // --- Clipboard Helper ---
  const copyToClipboard = (text, statusMessageKey) => {
    const ta = document.createElement("textarea");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showStatus(statusMessageKey);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    document.body.removeChild(ta);
  };

  // Initialize the popup
  await setInitialState();
});
