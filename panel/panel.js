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

  // Detect Font
  document.getElementById("btn-pick-font").addEventListener("click", () => {
    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      { action: "pick-font" },
      () => {
        if (chrome.runtime.lastError) {
          showStatus("Erro ao ativar detecção de fonte", "error");
        } else {
          showStatus(
            "Modo de detecção de fonte ativado. Mova o mouse sobre o texto e clique."
          );
        }
      }
    );
  });

  // Detect Background
  document.getElementById("btn-pick-bg").addEventListener("click", () => {
    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      { action: "pick-bg" },
      () => {
        if (chrome.runtime.lastError) {
          showStatus("Erro ao ativar detecção de background", "error");
        } else {
          showStatus(
            "Modo de detecção de background ativado. Mova o mouse sobre o elemento e clique."
          );
        }
      }
    );
  });

  // Live inspection UI updates from content script
  const elFontSize = document.getElementById("live-font-size");
  const elTextSw = document.getElementById("live-text-swatch");
  const elTextRGBA = document.getElementById("live-text-rgba");
  const elTextHEX = document.getElementById("live-text-hex");
  const elBgSw = document.getElementById("live-bg-swatch");
  const elBgRGBA = document.getElementById("live-bg-rgba");
  const elBgHEX = document.getElementById("live-bg-hex");

  function resetLive() {
    if (!elFontSize) return; // live UI not present
    elFontSize.textContent = "—";
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
