async function getActiveTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0].id);
    });
  });
}

// Clear SessionStorage
document
  .getElementById("btn-clear-session")
  .addEventListener("click", async () => {
    const tabId = await getActiveTabId();
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => sessionStorage.clear(),
    });
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
  });

// Clear Cookies
document.getElementById("btn-clear-cookies").addEventListener("click", () => {
  chrome.browsingData.remove({ since: 0 }, { cookies: true });
});

// Detectar Fonte
document.getElementById("btn-pick-font").addEventListener("click", async () => {
  const tabId = await getActiveTabId();
  chrome.tabs.sendMessage(tabId, { action: "pick-font" });
});

// Detectar Cor de Fundo
document.getElementById("btn-pick-bg").addEventListener("click", async () => {
  const tabId = await getActiveTabId();
  chrome.tabs.sendMessage(tabId, { action: "pick-bg" });
});
