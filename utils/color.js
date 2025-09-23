// A utility class to handle color conversions.
class Color {
  constructor(colorString) {
    this.rgba = this.parseColor(colorString);
  }

  // A robust parser that handles hex, rgb, rgba, and color names.
  parseColor(colorString) {
    // Use a temporary element to let the browser do the heavy lifting.
    const tempEl = document.createElement("div");
    tempEl.style.color = colorString;
    document.body.appendChild(tempEl);

    const computedColor = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    const match = computedColor.match(
      /rgba?\((\d+), (\d+), (\d+)(?:, ([\d\.]+))?\)/
    );
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
      };
    }
    // Fallback for invalid colors
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  toRgb() {
    if (this.rgba.a === 1) {
      return `rgb(${this.rgba.r}, ${this.rgba.g}, ${this.rgba.b})`;
    }
    return `rgba(${this.rgba.r}, ${this.rgba.g}, ${this.rgba.b}, ${this.rgba.a})`;
  }

  toHex() {
    const toHexComponent = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHexComponent(this.rgba.r)}${toHexComponent(
      this.rgba.g
    )}${toHexComponent(this.rgba.b)}`;
  }
}
