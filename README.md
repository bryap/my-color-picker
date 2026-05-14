# My Color Picker 🎨

A simple, lightweight, and **secure** Chrome extension for web developers and designers to pick colors directly from their browser.

## 🛡️ Why this exists?
I built this because I was frustrated with the color picker extensions in the Chrome Web Store. Many popular options are frequently disabled for containing malware or tracking scripts. This extension is my answer: a simple color picker that does
exactly what you expect. This is open-source, feel free to copy this code and build on this project to meet your needs.

## ✨ Features
- **Slide-out UI:** Modern side panel interface for better multitasking (Chrome 114+).
- **EyeDropper API:** Uses the native browser EyeDropper for high performance and security.
- **Contrast Checker:** Real-time WCAG contrast ratio calculation with WebAIM API integration.
- **Lightness Sliders:** Fine-tune colors to meet accessibility standards.
- **Recommended Palette:** Automatically generates complementary and random accessible color palettes.
- **Copy-to-Clipboard:** One-click copying for Hex and RGB formats.
- **History:** Saves your last 5 selected colors locally.
- **Modern UI:** Clean interface using the Quicksand Google Font.

## 🚀 Installation (Load Unpacked)
Since this is a personal, secure tool, you can load it directly into Chrome:
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the folder containing these files.
Developer mode must be enabled for this extension to be used.

## 🛠️ Tech Stack
- **Manifest V3** (Chrome Extension Standard)
- **Vanilla JavaScript** (EyeDropper API, Chrome Storage)
- **CSS3** (Custom properties, Flexbox)
- **Font Awesome** (Icons)
- **Google Fonts** (Quicksand)

## 📜 License
This project is licensed under the [MIT License](LICENSE).
