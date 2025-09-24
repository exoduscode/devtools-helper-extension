# DevTools Helper 🛠️

A powerful Chrome extension designed for Frontend and UI/UX Developers to enhance their development workflow with storage management, visual inspection, and color detection tools.

## ✨ Features

### 🧹 **Storage Management**

- **Clear LocalStorage**: Remove all LocalStorage items for the current site
- **Clear SessionStorage**: Remove all SessionStorage items for the current site
- **Clear Cookies**: Remove all cookies for the current site
- One-click cleanup for faster development and testing

### 🎨 **Visual Inspection** (DevTools Panel)

- **Real-time CSS Detection**: Hover over elements to see live CSS properties
- **Font Information**: View font size, weight, and rem values
- **Color Analysis**: See text and background colors with RGB/HEX values
- **Click to Copy**: Copy any CSS value with a single click
- **Freeze Values**: Lock current values for comparison

### 🌈 **Color Detection** (DevTools Panel)

- **Comprehensive Color Scanning**: Find all colors used on the page
- **RGBA Support**: Detect transparent colors from backgrounds, borders, and shadows
- **Smart Categorization**: Separate RGBA and RGB colors with counts
- **4-Column Responsive Grid**: Beautiful layout that adapts to screen size
- **Multiple Formats**: View colors in both RGB and HEX formats
- **Copy to Clipboard**: Click any color value to copy it instantly

### 🌍 **Multi-language Support**

- **5 Languages**: English, Portuguese, Spanish, French, and Chinese
- **Dynamic Translation**: Switch languages without restarting
- **Localized UI**: All interface elements are properly translated

### 🎭 **Theme Support**

- **System Theme**: Automatically match your OS theme
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for long development sessions
- **Persistent Settings**: Your preferences are saved across sessions

## 🚀 Installation

### From Chrome Web Store

_Coming soon - extension will be published to the Chrome Web Store_

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The DevTools Helper icon will appear in your browser toolbar

## 📖 Usage

### Storage Management (Popup)

1. Click the DevTools Helper icon in your browser toolbar
2. Use the storage buttons to clear LocalStorage, SessionStorage, or Cookies
3. Select your preferred language and theme from the dropdowns

### Visual Inspection (DevTools Panel)

1. Open Chrome DevTools (F12)
2. Navigate to the "DevTools Helper" panel
3. Click "Detect CSS in Real-Time" to start inspection
4. Hover over page elements to see live CSS properties
5. Click any value to copy it to your clipboard
6. Click the button again to stop inspection

### Color Detection (DevTools Panel)

1. Open Chrome DevTools (F12)
2. Navigate to the "DevTools Helper" panel
3. Click "Find Colors" to scan the page
4. View all detected colors in a responsive grid
5. See color counts and RGBA/RGB breakdown
6. Click any color value to copy it

## 🏗️ Project Structure

```
devtools-helper-extension/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for extension lifecycle
├── content.js                 # Content script for page interaction
├── popup/                     # Extension popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── panel/                     # DevTools panel interface
│   ├── panel.html
│   ├── panel.js
│   └── panel.css
├── utils/                     # Shared utilities
│   ├── translator.js          # Internationalization system
│   ├── theme.js              # Theme management
│   └── color.js              # Color manipulation utilities
├── _locales/                  # Translation files
│   ├── en/messages.json       # English
│   ├── pt/messages.json       # Portuguese
│   ├── es/messages.json       # Spanish
│   ├── fr/messages.json       # French
│   └── zh/messages.json       # Chinese
└── assets/                    # Extension icons and images
    └── icon128.png
```

## 🔧 Technical Details

### Permissions

- `storage`: Save user preferences (language, theme)
- `scripting`: Inject content scripts for visual inspection
- `tabs`: Access active tab information
- `browsingData`: Clear cookies and browsing data
- `notifications`: Show status notifications
- `clipboardWrite`: Copy values to clipboard

### Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Compatible with Chromium-based Edge
- **Other Browsers**: May work with Chromium-based browsers

### Key Technologies

- **Manifest V3**: Latest Chrome extension standard
- **CSS Grid**: Responsive color layout
- **CSS Custom Properties**: Theme system
- **Chrome DevTools API**: Panel integration
- **Internationalization API**: Multi-language support

## 🎨 Color Detection Algorithm

The extension uses an advanced color detection system that:

1. **Scans All Elements**: Iterates through every DOM element
2. **Checks Multiple Properties**: Analyzes `color`, `background-color`, `border-color`, `box-shadow`, `text-shadow`, and more
3. **Extracts Complex Values**: Parses colors from shadow definitions and multi-value properties
4. **Validates Colors**: Tests each color value for validity using browser APIs
5. **Categorizes Results**: Separates RGBA (transparent) from RGB (solid) colors
6. **Provides Multiple Formats**: Shows both RGB/RGBA and HEX representations

## 🌍 Contributing Translations

To add a new language:

1. Create a new folder in `_locales/` with the language code (e.g., `de` for German)
2. Copy `_locales/en/messages.json` to your new language folder
3. Translate all message values while keeping the keys unchanged
4. Test the extension with your new language

## 🐛 Known Issues

- Color detection may be slower on pages with many elements
- Some CSS properties might not be detected in certain browsers
- Visual inspection requires page reload after enabling/disabling

## 📝 Changelog

### Version 1.0.0

- ✅ Initial release
- ✅ Storage management functionality
- ✅ Visual CSS inspection
- ✅ Comprehensive color detection with RGBA support
- ✅ Multi-language support (5 languages)
- ✅ Theme system (Light/Dark/System)
- ✅ Responsive 4-column color grid
- ✅ Copy-to-clipboard functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Clone the repository
2. Make your changes
3. Test the extension in Chrome Developer Mode
4. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created by [Exoduscode](https://github.com/exoduscode) with ❤️ for the developer community.

## 🙏 Acknowledgments

- Chrome DevTools API documentation
- CSS Color specification
- Internationalization best practices
- Open source community feedback

---

**Happy Coding!** 🚀✨
