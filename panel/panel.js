chrome.devtools.panels.create(
  "EC DevTools Helper",
  "assets/icon128.png",
  "panel/panel.html",
  function (panel) {
    console.log("Painel DevTools Helper adicionado com sucesso!");
  }
);

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

// Clear Cookies - Note: This needs to be handled differently in devtools
document.getElementById("btn-clear-cookies").addEventListener("click", () => {
  // For devtools, we'll send a message to the background script
  chrome.runtime.sendMessage({ action: "clear-cookies" }, (response) => {
    if (response.success) {
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
    (response) => {
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
    (response) => {
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

function showStatus(message, type = "success") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.style.color = type === "error" ? "#d32f2f" : "#2e7d32";

  // Clear status after 3 seconds
  setTimeout(() => {
    statusEl.textContent = "";
  }, 3000);
}
