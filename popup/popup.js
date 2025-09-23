async function getActiveTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0].id);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pickFontBtn = document.getElementById("btn-pick-font");
  const originalBtnText = "🔤 Detectar CSS em Tempo Real";

  // Function to update button appearance
  const updateButtonState = (isDetecting) => {
    if (isDetecting) {
      pickFontBtn.classList.add("active");
      pickFontBtn.innerHTML = `${originalBtnText} <span style="color: #a5d6a7;">(ON)</span>`;
    } else {
      pickFontBtn.classList.remove("active");
      pickFontBtn.innerHTML = `${originalBtnText} <span style="color: #ef9a9a;">(OFF)</span>`;
    }
  };

  // Set initial button state
  chrome.storage.local.get("isDetecting", ({ isDetecting }) => {
    updateButtonState(isDetecting);
  });

  // Clear SessionStorage
  document
    .getElementById("btn-clear-session")
    .addEventListener("click", async () => {
      const tabId = await getActiveTabId();
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => sessionStorage.clear(),
      });
      window.close();
    });

  // Clear LocalStorage
  document
    .getElementById("btn-clear-local")
    .addEventListener("click", async () => {
      const tabId = await getActiveTabId();
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => localStorage.clear(),
      });
      window.close();
    });

  // Clear Cookies
  document.getElementById("btn-clear-cookies").addEventListener("click", () => {
    chrome.browsingData.remove({ since: 0 }, { cookies: true });
    window.close();
  });

  // Toggle CSS Detection
  pickFontBtn.addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    chrome.storage.local.get("isDetecting", ({ isDetecting }) => {
      const newIsDetecting = !isDetecting;
      chrome.storage.local.set({ isDetecting: newIsDetecting }, () => {
        chrome.tabs.sendMessage(tabId, {
          action: "toggle-css-detect",
          isDetecting: newIsDetecting,
        });
        updateButtonState(newIsDetecting);
        setTimeout(() => window.close(), 100); // Close after a short delay
      });
    });
  });
});
