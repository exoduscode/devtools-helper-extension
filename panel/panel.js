// Distinguish between devtools bootstrap context and actual panel instance
const isPanel = new URLSearchParams(location.search).get("isPanel") === "1";

if (!isPanel) {
  // We are in the devtools_page context. Create the visible panel and exit.
  chrome.devtools.panels.create(
    "DevTools Helper", // This name is not dynamic, it's the panel title
    "assets/icon128.png",
    "panel/panel.html?isPanel=1",
    () => {}
  );
} else {
  // We are in the actual panel. Wire up UI.
  document.addEventListener("DOMContentLoaded", async () => {
    const pickFontBtn = document.getElementById("btn-pick-font");
    const langSelect = document.getElementById("lang-select");

    // --- UI Update Functions ---
    const updateButtonText = () => {
      const baseText = translator.getMessage("detectCSSTitle");
      const onLabel = translator.getMessage("labelOn");
      const offLabel = translator.getMessage("labelOff");
      const isDetecting = pickFontBtn.classList.contains('active');
      const icon = '🔤';

      if (isDetecting) {
        pickFontBtn.innerHTML = `${icon} ${baseText} <span style="color: #a5d6a7;">${onLabel}</span>`;
      } else {
        pickFontBtn.innerHTML = `${icon} ${baseText} <span style="color: #ef9a9a;">${offLabel}</span>`;
      }
    };

    const showStatus = (messageKey, type = "success", isKey = true) => {
        const statusEl = document.getElementById("status");
        if (!statusEl) return;
        statusEl.textContent = isKey ? translator.getMessage(messageKey) : messageKey;
        statusEl.style.color = type === "error" ? "#d32f2f" : "#2e7d32";
        setTimeout(() => { statusEl.textContent = ""; }, 3000);
    };

    // --- Initialization ---
    const setInitialState = async () => {
      const { userLang = 'en', isDetecting } = await chrome.storage.local.get(["userLang", "isDetecting"]);
      langSelect.value = userLang;
      
      await translator.load(userLang);
      translator.apply();

      if (isDetecting) pickFontBtn.classList.add("active");
      updateButtonText();
    };

    await setInitialState();

    // --- Event Listeners ---

    langSelect.addEventListener("change", async () => {
      const selectedLang = langSelect.value;
      await chrome.storage.local.set({ userLang: selectedLang });
      // Must reload the panel for all i18n changes to apply in devtools
      window.location.reload();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.isDetecting) {
        pickFontBtn.classList.toggle('active', changes.isDetecting.newValue);
        updateButtonText();
      }
    });

    pickFontBtn.addEventListener("click", async () => {
      const { isDetecting } = await chrome.storage.local.get("isDetecting");
      const newIsDetecting = !isDetecting;
      await chrome.storage.local.set({ isDetecting: newIsDetecting });
      chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
        action: "toggle-css-detect",
        isDetecting: newIsDetecting,
      });
    });

    // ... other button listeners ...
    document.getElementById("btn-clear-session").addEventListener("click", () => {
        chrome.devtools.inspectedWindow.eval("sessionStorage.clear()", (result, isException) => {
            showStatus(isException ? "statusSessionError" : "statusSessionCleared", isException ? 'error' : 'success');
        });
    });

    document.getElementById("btn-clear-local").addEventListener("click", () => {
        chrome.devtools.inspectedWindow.eval("localStorage.clear()", (result, isException) => {
            showStatus(isException ? "statusLocalError" : "statusLocalCleared", isException ? 'error' : 'success');
        });
    });

    document.getElementById("btn-clear-cookies").addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "clear-cookies" }, (response) => {
            showStatus(response && response.success ? "statusCookiesCleared" : "statusCookiesError", response && response.success ? 'success' : 'error');
        });
    });

    // --- Live Inspection Listeners ---
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
        if (!elFontSize) return; // UI not present
        elFontSize.textContent = "—";
        elFontRem.textContent = "—";
        elFontWeight.textContent = "—";
        elTextSw.style.background = "transparent";
        elTextRGBA.textContent = "—";
        elTextHEX.textContent = "—";
        elBgSw.style.background = "transparent";
        elBgRGBA.textContent = "—";
        elBgHEX.textContent = "—";
    }

    function applyLive(data) {
        if (!data) return;
        if (elFontSize && data.fontSize) elFontSize.textContent = data.fontSize;
        if (elFontRem && data.fontRem) elFontRem.textContent = `(${data.fontRem})`;
        if (elFontWeight && data.fontWeight) elFontWeight.textContent = data.fontWeight;
        if (elTextSw && data.textColor) elTextSw.style.background = data.textColor;
        if (elTextRGBA && data.textColor) elTextRGBA.textContent = data.textColor;
        if (elTextHEX && data.textHex) elTextHEX.textContent = data.textHex;
        if (elBgSw && data.bgColor) elBgSw.style.background = data.bgColor;
        if (elBgRGBA && data.bgColor) elBgRGBA.textContent = data.bgColor;
        if (elBgHEX && data.bgHex) elBgHEX.textContent = data.bgHex;
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (!msg || !msg.action) return;
        if (msg.action === "inspect-update") applyLive(msg);
        if (msg.action === "inspect-freeze") {
            applyLive(msg);
            showStatus("statusValuesFrozen", 'success');
        }
        if (msg.action === "inspect-end") {
            resetLive();
            showStatus("statusInspectionFinished", 'success');
        }
    });
  });
}
