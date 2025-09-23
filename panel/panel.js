// Distinguish between devtools bootstrap context and actual panel instance
const isPanel = new URLSearchParams(location.search).get("isPanel") === "1";

if (!isPanel) {
  // We are in the devtools_page context. Create the visible panel and exit.
  chrome.devtools.panels.create(
    "EC DevTools Helper",
    "assets/icon128.png",
    "panel/panel.html?isPanel=1",
    function (panel) {
      console.log("Painel DevTools Helper criado a partir do devtools_page");
    }
  );
} else {
  // We are in the actual panel. Wire up UI.

  // Function to execute script in the inspected window
  function executeInInspectedWindow(func, callback) {
    chrome.devtools.inspectedWindow.eval(func.toString() + "()", callback);
  }

  // Clear SessionStorage
  document.getElementById("btn-clear-session").addEventListener("click", () => {
    executeInInspectedWindow(
      () => sessionStorage.clear(),
      (result, isException) => {
        if (isException) {
          showStatus("Erro ao limpar SessionStorage", "error");
        } else {
          showStatus("SessionStorage limpo com sucesso!");
        }
      }
    );
  });

  // Clear LocalStorage
  document.getElementById("btn-clear-local").addEventListener("click", () => {
    executeInInspectedWindow(
      () => localStorage.clear(),
      (result, isException) => {
        if (isException) {
          showStatus("Erro ao limpar LocalStorage", "error");
        } else {
          showStatus("LocalStorage limpo com sucesso!");
        }
      }
    );
  });

  // Clear Cookies - handled via background service worker
  document.getElementById("btn-clear-cookies").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "clear-cookies" }, (response) => {
      if (response && response.success) {
        showStatus("Cookies limpos com sucesso!");
      } else {
        showStatus("Erro ao limpar cookies", "error");
      }
    });
  });

  // CSS Detection Toggle
  const pickFontBtn = document.getElementById("btn-pick-font");
  const originalBtnText = "🔤 Detectar CSS em Tempo Real";

  const updateButtonState = (isDetecting) => {
    if (isDetecting) {
      pickFontBtn.classList.add("active");
      pickFontBtn.innerHTML = `${originalBtnText} <span style="color: #a5d6a7;">(ON)</span>`;
    } else {
      pickFontBtn.classList.remove("active");
      pickFontBtn.innerHTML = `${originalBtnText} <span style="color: #ef9a9a;">(OFF)</span>`;
    }
  };

  // Set initial state and listen for changes
  chrome.storage.local.get("isDetecting", ({ isDetecting }) => {
    updateButtonState(isDetecting);
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.isDetecting) {
      updateButtonState(changes.isDetecting.newValue);
    }
  });

  pickFontBtn.addEventListener("click", () => {
    chrome.storage.local.get("isDetecting", ({ isDetecting }) => {
      const newIsDetecting = !isDetecting;
      chrome.storage.local.set({ isDetecting: newIsDetecting }, () => {
        chrome.tabs.sendMessage(
          chrome.devtools.inspectedWindow.tabId,
          { action: "toggle-css-detect", isDetecting: newIsDetecting },
          () => {
            if (chrome.runtime.lastError) {
              // showStatus("Erro ao comunicar com a página", "error");
            } else {
              showStatus(
                `Detecção de CSS ${newIsDetecting ? "ativada" : "desativada"}.`
              );
            }
          }
        );
      });
    });
  });

  // Live inspection UI updates from content script
  const elFontSize = document.getElementById("live-font-size");
  const elFontRem = document.getElementById("live-font-rem");
  const elFontWeight = document.getElementById("live-font-weight");
  const elTextSw = document.getElementById("live-text-swatch");
  const elTextRGBA = document.getElementById("live-text-rgba");
  const elTextHEX = document.getElementById("live-text-hex");
  const elBgSw = document.getElementById("live-bg-swatch");
  const elBgRGBA = document.getElementById("live-bg-rgba");
  const elBgHEX = document.getElementById("live-bg-hex");

  function resetLive() {
    if (!elFontSize) return; // live UI not present
    elFontSize.textContent = "—";
    elFontRem.textContent = "—";
    elFontWeight.textContent = "—";
    elTextSw && (elTextSw.style.background = "transparent");
    elTextRGBA && (elTextRGBA.textContent = "—");
    elTextHEX && (elTextHEX.textContent = "—");
    elBgSw && (elBgSw.style.background = "transparent");
    elBgRGBA && (elBgRGBA.textContent = "—");
    elBgHEX && (elBgHEX.textContent = "—");
  }

  function applyLive(data) {
    if (!data) return;
    if (elFontSize && data.fontSize) elFontSize.textContent = data.fontSize;
    if (elFontRem && data.fontRem) elFontRem.textContent = `(${data.fontRem})`;
    if (elFontWeight && data.fontWeight)
      elFontWeight.textContent = data.fontWeight;
    if (elTextSw && data.textColor) elTextSw.style.background = data.textColor;
    if (elTextRGBA && data.textColor) elTextRGBA.textContent = data.textColor;
    if (elTextHEX && data.textHex) elTextHEX.textContent = data.textHex;
    if (elBgSw && data.bgColor) elBgSw.style.background = data.bgColor;
    if (elBgRGBA && data.bgColor) elBgRGBA.textContent = data.bgColor;
    if (elBgHEX && data.bgHex) elBgHEX.textContent = data.bgHex;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.action) return;
    if (msg.action === "inspect-update") {
      applyLive(msg);
    }
    if (msg.action === "inspect-freeze") {
      applyLive(msg);
      showStatus("Valores fixados");
    }
    if (msg.action === "inspect-end") {
      resetLive();
      showStatus("Inspeção finalizada");
    }
  });

  function showStatus(message, type = "success") {
    const statusEl = document.getElementById("status");
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = type === "error" ? "#d32f2f" : "#2e7d32";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  }
}
