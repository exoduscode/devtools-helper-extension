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
    const themeSelect = document.getElementById("theme-select");

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
      const { userLang = 'en', isDetecting, userTheme = 'system' } = await chrome.storage.local.get(["userLang", "isDetecting", "userTheme"]);
      langSelect.value = userLang;
      themeSelect.value = userTheme;
      
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

    themeSelect.addEventListener("change", async () => {
        const selectedTheme = themeSelect.value;
        await themeManager.setTheme(selectedTheme);
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

    // --- Clipboard Helper using execCommand (as per MDN docs) ---
    const copyToClipboard = (text, statusMessageKey) => {
        const ta = document.createElement('textarea');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showStatus(statusMessageKey, 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(ta);
    };

    // --- Click to Copy for Live Inspection ---
    document.querySelectorAll('.copyable').forEach(el => {
        el.addEventListener('click', () => {
            if (el.textContent && el.textContent !== '—') {
                copyToClipboard(el.textContent, 'statusValueCopied');
            }
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

    const findColorsBtn = document.getElementById('btn-find-colors');
    const colorResultsDiv = document.getElementById('color-results');

    findColorsBtn.addEventListener('click', () => {
        findColorsBtn.disabled = true;
        findColorsBtn.textContent = 'Finding...';
        chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, { action: 'find-colors' });
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (!msg || !msg.action) return;

        switch (msg.action) {
            case "inspect-update":
                applyLive(msg);
                break;
            case "inspect-freeze":
                applyLive(msg);
                showStatus("statusValuesFrozen", 'success');
                break;
            case "inspect-end":
                resetLive();
                showStatus("statusInspectionFinished", 'success');
                break;
            case 'color-results':
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
                    rgbValue.title = translator.getMessage('copyTooltip');
                    rgbValue.addEventListener('click', () => copyToClipboard(rgb, 'statusColorCopied'));

                    const hexValue = document.createElement('div');
                    hexValue.className = 'color-value';
                    hexValue.textContent = hex;
                    hexValue.title = translator.getMessage('copyTooltip');
                    hexValue.addEventListener('click', () => copyToClipboard(hex, 'statusColorCopied'));

                    details.appendChild(rgbValue);
                    details.appendChild(hexValue);
                    item.appendChild(swatch);
                    item.appendChild(details);
                    colorResultsDiv.appendChild(item);
                });
                break;
        }
    });
  });
}
