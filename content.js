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
    console.log('🎨 Starting color detection...');
    
    // First, let's check if our test page elements exist
    console.log('🔍 Checking if test elements exist:');
    const expectedClasses = ['rgba-text', 'rgba-background', 'rgba-border', 'rgba-shadow', 'text-shadow', 'multiple-rgba', 'solid-colors'];
    expectedClasses.forEach(className => {
      const element = document.querySelector('.' + className);
      console.log(`  .${className}: ${element ? '✅ Found' : '❌ Not found'}`);
    });
    
    const colors = new Set();
    const elements = document.getElementsByTagName('*');
    const colorProperties = [
      'color', 
      'background-color', 
      'border-color', 
      'border-top-color', 
      'border-right-color', 
      'border-bottom-color', 
      'border-left-color', 
      'outline-color',
      'box-shadow',
      'text-shadow',
      'border-block-start-color',
      'border-block-end-color',
      'border-inline-start-color',
      'border-inline-end-color'
    ];

    console.log(`📊 Scanning ${elements.length} elements for colors...`);
    
    // Debug: Check specific elements we expect to have RGBA colors
    const testClasses = ['rgba-text', 'rgba-background', 'rgba-border', 'rgba-shadow', 'text-shadow', 'multiple-rgba'];
    testClasses.forEach(className => {
      const element = document.querySelector('.' + className);
      if (element) {
        const style = window.getComputedStyle(element);
        console.log(`🎯 Checking .${className}:`);
        console.log(`  - color: "${style.color}"`);
        console.log(`  - backgroundColor: "${style.backgroundColor}"`);
        console.log(`  - borderColor: "${style.borderColor}"`);
        console.log(`  - borderLeftColor: "${style.borderLeftColor}"`);
        console.log(`  - borderRightColor: "${style.borderRightColor}"`);
        console.log(`  - boxShadow: "${style.boxShadow}"`);
        console.log(`  - textShadow: "${style.textShadow}"`);
      } else {
        console.log(`❌ Element with class .${className} not found`);
      }
    });
    
    // Also check body element specifically
    const bodyStyle = window.getComputedStyle(document.body);
    console.log(`🎯 Body element:`);
    console.log(`  - backgroundColor: "${bodyStyle.backgroundColor}"`);

    // Helper function to extract colors from complex values like box-shadow
    function extractColorsFromValue(value) {
      const foundColors = [];
      // Match rgb(), rgba(), hsl(), hsla(), and hex colors
      const colorRegex = /(rgba?\s*\([^)]+\)|hsla?\s*\([^)]+\)|#[0-9a-fA-F]{3,8})/gi;
      let match;
      while ((match = colorRegex.exec(value)) !== null) {
        foundColors.push(match[1].trim());
      }
      return foundColors;
    }

    let elementCount = 0;
    let colorCount = 0;

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const style = window.getComputedStyle(element);
        let elementHasColors = false;
        
        // Debug: log which properties we're checking for this element
        if (i < 5) { // Only log for first few elements to avoid spam
            console.log(`🔧 Checking element ${i} for properties:`, colorProperties);
        }
        
        colorProperties.forEach(prop => {
            const value = style.getPropertyValue(prop);
            
            // Debug: log ALL property values for specific elements, even filtered ones
            if (element.className && (element.className.includes('rgba-background') || element.className.includes('rgba-border') || element.className.includes('rgba-shadow'))) {
                console.log(`🔧 ${element.className} - ${prop}: "${value}" (filtered: ${!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'none' || value === 'initial' || value === 'inherit'})`);
            }
            
            if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)' && value !== 'none' && value !== 'initial' && value !== 'inherit') {
                
                // Log ALL color values for debugging (not just rgb/rgba)
                console.log(`🔍 Element ${i} (${element.tagName}${element.className ? '.' + element.className : ''}): ${prop} = "${value}"`);
                elementHasColors = true;
                
                if (prop === 'box-shadow' || prop === 'text-shadow') {
                    // Extract colors from shadow values
                    const shadowColors = extractColorsFromValue(value);
                    if (shadowColors.length > 0) {
                        console.log(`  🌟 Found ${shadowColors.length} shadow colors:`, shadowColors);
                        shadowColors.forEach(color => {
                            if (color && color.trim()) {
                                colors.add(color.trim());
                                colorCount++;
                            }
                        });
                    }
                } else {
                    // Regular color property - also check if it contains multiple colors
                    const extractedColors = extractColorsFromValue(value);
                    if (extractedColors.length > 0) {
                        console.log(`  ✨ Extracted ${extractedColors.length} colors from ${prop}:`, extractedColors);
                        extractedColors.forEach(color => {
                            colors.add(color.trim());
                            colorCount++;
                        });
                    } else {
                        // Add the raw value as a color
                        colors.add(value.trim());
                        colorCount++;
                    }
                }
            }
        });
        
        if (elementHasColors) {
            elementCount++;
        }
    }
    
    console.log(`📈 Found colors in ${elementCount} elements, total color instances: ${colorCount}`);

    // Filter out invalid colors and ensure we have valid RGB/RGBA values
    const validColors = Array.from(colors).filter(color => {
      // Skip obviously invalid values
      if (!color || color.length < 3) return false;
      
      // Test if the color is valid by trying to parse it
      try {
        const testEl = document.createElement('div');
        testEl.style.backgroundColor = color; // Use backgroundColor for better compatibility
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl).backgroundColor;
        document.body.removeChild(testEl);
        
        // Debug the validation process
        console.log(`🧪 Testing color "${color}" -> computed: "${computed}"`);
        
        // Check if the computed color is valid and not transparent
        const isValid = computed && 
                       computed !== 'rgba(0, 0, 0, 0)' && 
                       computed !== 'transparent' &&
                       computed !== 'initial' &&
                       computed !== 'inherit';
        
        if (!isValid) {
          console.log(`❌ Color "${color}" failed validation (computed: "${computed}")`);
        } else {
          console.log(`✅ Color "${color}" passed validation`);
        }
        
        return isValid;
      } catch (e) {
        console.log(`💥 Error testing color "${color}":`, e);
        return false;
      }
    });

    // Debug logging to see what colors were found
    console.log('🎯 Total unique colors found:', colors.size);
    console.log('🎯 All colors before filtering:', Array.from(colors));
    console.log('✅ Valid colors after filtering:', validColors.length);
    console.log('✅ Final valid colors:', validColors);
    
    // Check specifically for RGBA colors
    const rgbaColors = validColors.filter(color => color.includes('rgba'));
    const rgbColors = validColors.filter(color => color.includes('rgb') && !color.includes('rgba'));
    console.log(`🔴 RGBA colors found: ${rgbaColors.length}`, rgbaColors);
    console.log(`🔵 RGB colors found: ${rgbColors.length}`, rgbColors);
    
    chrome.runtime.sendMessage({ action: 'color-results', colors: validColors });
  }
});
