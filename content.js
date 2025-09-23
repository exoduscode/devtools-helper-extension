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

function getVisibleBackground(el) {
  let current = el;
  while (current && current !== document.documentElement) {
    const bg = getComputedStyle(current).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    current = current.parentElement;
  }
  return getComputedStyle(document.body).backgroundColor || "rgb(255,255,255)";
}

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
  return { tooltip, colorBlockText, colorBlockBg, infoText };
}

function startTooltipInspect(mode) {
  const { tooltip, colorBlockText, colorBlockBg, infoText } = createTooltip();

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;

    const style = getComputedStyle(el);
    const textColor = style.color;
    const bgColor = getVisibleBackground(el);

    colorBlockText.style.backgroundColor = textColor;
    colorBlockBg.style.backgroundColor = bgColor;

    if (mode === "font") {
      infoText.textContent =
        `Fonte: ${style.fontSize}\n` +
        `Texto: ${textColor} | ${rgbToHex(textColor)}\n` +
        `Background: ${bgColor} | ${rgbToHex(bgColor)}`;
    } else if (mode === "bg") {
      infoText.textContent =
        `Background: ${bgColor}\n` +
        `RGB/RGBA: ${bgColor}\nHEX: ${rgbToHex(bgColor)}`;
    }

    tooltip.style.top = e.clientY + 20 + "px";
    tooltip.style.left = e.clientX + 20 + "px";
  }

  function stopInspect() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("click", onClick);
    tooltip.remove();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") stopInspect();
  }

  function onClick() {
    stopInspect();
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onClick);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "pick-font") startTooltipInspect("font");
  if (msg.action === "pick-bg") startTooltipInspect("bg");
});
