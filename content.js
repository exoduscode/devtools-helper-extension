function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return "";
  const r = parseInt(result[0]).toString(16).padStart(2, "0");
  const g = parseInt(result[1]).toString(16).padStart(2, "0");
  const b = parseInt(result[2]).toString(16).padStart(2, "0");
  let a = result[3] !== undefined ? parseFloat(result[3]) : 1;
  if (a === 1) return `#${r}${g}${b}`;
  return `#${r}${g}${b}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

// --- State and UI Management ---
let inspectionState = {
  isActive: false,
  tooltip: null,
  colorBlockText: null,
  colorBlockBg: null,
  infoText: null,
};

function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0,0,0,0.8)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "6px 8px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.zIndex = 9999;
  tooltip.style.fontSize = "12px";
  tooltip.style.fontFamily = "monospace";
  tooltip.style.whiteSpace = "pre-line";
  tooltip.style.display = "flex";
  tooltip.style.flexDirection = "column";
  tooltip.style.gap = "4px";

  const colorBlockText = document.createElement("div");
  colorBlockText.style.height = "16px";
  colorBlockText.style.width = "100%";
  colorBlockText.style.borderRadius = "3px";

  const colorBlockBg = document.createElement("div");
  colorBlockBg.style.height = "16px";
  colorBlockBg.style.width = "100%";
  colorBlockBg.style.borderRadius = "3px";

  tooltip.appendChild(colorBlockText);
  tooltip.appendChild(colorBlockBg);

  const infoText = document.createElement("div");
  tooltip.appendChild(infoText);

  document.body.appendChild(tooltip);

  // Store elements in state
  inspectionState.tooltip = tooltip;
  inspectionState.colorBlockText = colorBlockText;
  inspectionState.colorBlockBg = colorBlockBg;
  inspectionState.infoText = infoText;
}

function getVisibleBackground(el) {
  let current = el;
  while (current && current !== document.documentElement) {
    const bg = getComputedStyle(current).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    current = current.parentElement;
  }
  return getComputedStyle(document.body).backgroundColor || "rgb(255,255,255)";
}

// --- Event Handlers ---
let lastSample = null;
let clickTimeout = null;
const minInterval = 100; // ms for throttling
let lastSent = 0;

function onMouseMove(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || !inspectionState.tooltip) return;

  const style = getComputedStyle(el);
  const textColor = style.color;
  const bgColor = getVisibleBackground(el);
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const remSize =
    (parseFloat(style.fontSize) / rootFontSize).toFixed(2) + "rem";

  inspectionState.colorBlockText.style.backgroundColor = textColor;
  inspectionState.colorBlockBg.style.backgroundColor = bgColor;
  inspectionState.infoText.textContent =
    `Fonte: ${style.fontSize} (${remSize})\n` +
    `Peso: ${style.fontWeight}\n` +
    `Texto: ${textColor} | ${rgbToHex(textColor)}\n` +
    `Background: ${bgColor} | ${rgbToHex(bgColor)}`;

  lastSample = {
    fontSize: style.fontSize,
    fontRem: remSize,
    fontWeight: style.fontWeight,
    textColor,
    textHex: rgbToHex(textColor),
    bgColor,
    bgHex: rgbToHex(bgColor),
  };

  const now = Date.now();
  if (now - lastSent >= minInterval) {
    lastSent = now;
    try {
      chrome.runtime.sendMessage({ action: "inspect-update", ...lastSample });
    } catch (_) {}
  }

  inspectionState.tooltip.style.top = e.clientY + 20 + "px";
  inspectionState.tooltip.style.left = e.clientX + 20 + "px";
}

function onKeyDown(e) {
  if (e.key === "Escape") stopInspection();
}

function onClick(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  if (clickTimeout) clearTimeout(clickTimeout);
  clickTimeout = setTimeout(() => {
    stopInspection("freeze");
  }, 250);
}

function onDblClick(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  if (clickTimeout) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
  }
  stopInspection("end");
}

// --- Main Functions ---
function startInspection() {
  if (inspectionState.isActive) return;
  inspectionState.isActive = true;

  document.body.style.cursor = "crosshair";
  createTooltip();

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("dblclick", onDblClick, true);
}

function stopInspection(reason = "end") {
  if (!inspectionState.isActive) return;
  inspectionState.isActive = false;

  document.body.style.cursor = "default";

  document.removeEventListener("mousemove", onMouseMove, true);
  document.removeEventListener("keydown", onKeyDown, true);
  document.removeEventListener("click", onClick, true);
  document.removeEventListener("dblclick", onDblClick, true);

  if (inspectionState.tooltip) {
    inspectionState.tooltip.remove();
    inspectionState.tooltip = null;
  }

  try {
    if (reason === "freeze" && lastSample) {
      chrome.runtime.sendMessage({ action: "inspect-freeze", ...lastSample });
    } else {
      chrome.runtime.sendMessage({ action: "inspect-end" });
    }
  } catch (_) {}

  // Ensure global state is updated
  chrome.storage.local.set({ isDetecting: false });
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggle-css-detect") {
    if (msg.isDetecting) {
      startInspection();
    } else {
      stopInspection();
    }
  }

  if (msg.action === "find-colors") {
    const colors = new Set();
    const elements = document.getElementsByTagName('*');
    const colorProperties = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor'];

    for (let i = 0; i < elements.length; i++) {
        const style = window.getComputedStyle(elements[i]);
        colorProperties.forEach(prop => {
            const color = style.getPropertyValue(prop);
            if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
                colors.add(color);
            }
        });
    }

    chrome.runtime.sendMessage({ action: 'color-results', colors: Array.from(colors) });
  }
});
