// DOM Elements - Main Color Picker
const trigger = document.getElementById('eyedropper-trigger');
const hexDisplay = document.getElementById('hex-display');
const rVal = document.getElementById('r-val');
const gVal = document.getElementById('g-val');
const bVal = document.getElementById('b-val');
const slots = document.querySelectorAll('.slot');

// DOM Elements - Contrast Checker
const fgHexInput = document.getElementById('fg-hex');
const bgHexInput = document.getElementById('bg-hex');
const fgNativePicker = document.getElementById('fg-native-picker');
const bgNativePicker = document.getElementById('bg-native-picker');
const fgLightnessSlider = document.getElementById('fg-lightness');
const bgLightnessSlider = document.getElementById('bg-lightness');
const ratioDisplayContainer = document.getElementById('ratio-display-container');
const ratioValue = document.getElementById('ratio-value');
const swapBtn = document.getElementById('swap-colors');

// DOM Elements - Palette
const shuffleBtn = document.getElementById('shuffle-palette');
const paletteSlots = document.querySelectorAll('.palette-slot');
const harmonySelect = document.getElementById('harmony-type');

// --- Main Color Picker Logic ---

trigger.addEventListener('click', async () => {
  const hex = await pickColor();
  if (hex) {
    updateMainDisplay(hex);
    addToHistory(hex);
    // Auto-update contrast foreground
    updateContrastForeground(hex);
  }
});

async function pickColor() {
  if (!window.EyeDropper) {
    alert('Your browser does not support the EyeDropper API');
    return null;
  }
  const eyeDropper = new EyeDropper();
  try {
    const result = await eyeDropper.open();
    return result.sRGBHex;
  } catch (e) {
    return null;
  }
}

function updateMainDisplay(hex) {
  hexDisplay.innerText = hex.toUpperCase();
  hexDisplay.style.backgroundColor = hex;
  
  const rgb = hexToRgb(hex);
  hexDisplay.style.color = getContrastYIQ(hex);
  
  rVal.innerText = rgb.r;
  gVal.innerText = rgb.g;
  bVal.innerText = rgb.b;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getContrastYIQ(hexcolor) {
  const rgb = hexToRgb(hexcolor);
  const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

document.getElementById('copy-hex').onclick = () => {
  navigator.clipboard.writeText(hexDisplay.innerText);
};

document.getElementById('copy-rgb').onclick = () => {
  const rgbString = `${rVal.innerText}, ${gVal.innerText}, ${bVal.innerText}`;
  navigator.clipboard.writeText(rgbString);
};

function addToHistory(hex) {
  chrome.storage.local.get(['history'], (data) => {
    let history = [hex, ...(data.history || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    chrome.storage.local.set({ history }, () => renderHistory(history));
  });
}

function renderHistory(history) {
  slots.forEach((slot, i) => {
    if (history[i]) {
      slot.style.backgroundColor = history[i];
      slot.onclick = () => {
        updateMainDisplay(history[i]);
        // Update Background to test against current Foreground (Box 1)
        updateContrastBackground(history[i]);
      };
    } else {
      slot.style.backgroundColor = '#eee';
      slot.onclick = null;
    }
  });
}

// --- Contrast Checker Logic ---

fgNativePicker.oninput = (e) => updateContrastForeground(e.target.value);
bgNativePicker.oninput = (e) => updateContrastBackground(e.target.value);

swapBtn.onclick = () => {
  const fg = fgHexInput.value;
  const bg = bgHexInput.value;
  updateContrastForeground(bg);
  updateContrastBackground(fg);
};

fgHexInput.onchange = (e) => {
  let hex = e.target.value;
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (/^#[0-9A-F]{6}$/i.test(hex)) updateContrastForeground(hex);
};

bgHexInput.onchange = (e) => {
  let hex = e.target.value;
  if (!hex.startsWith('#')) hex = '#' + hex;
  if (/^#[0-9A-F]{6}$/i.test(hex)) updateContrastBackground(hex);
};

// State variables to preserve hue/saturation when lightness is 0 or 100
let fgHsl = { h: 0, s: 0, l: 0 };
let bgHsl = { h: 0, s: 0, l: 100 };

fgLightnessSlider.oninput = (e) => {
  fgHsl.l = e.target.value;
  const newHex = hslToHex(fgHsl.h, fgHsl.s, fgHsl.l);
  updateContrastForeground(newHex, false);
};

bgLightnessSlider.oninput = (e) => {
  bgHsl.l = e.target.value;
  const newHex = hslToHex(bgHsl.h, bgHsl.s, bgHsl.l);
  updateContrastBackground(newHex, false);
};

function updateContrastForeground(hex, updateSlider = true) {
  fgHexInput.value = hex.toUpperCase();
  fgNativePicker.value = hex;
  const hsl = hexToHsl(hex);
  
  // If not called from slider, update entire HSL state
  // If called from slider, we preserve H/S and only update L if it's not extreme (to sync)
  if (updateSlider) {
    fgHsl = hsl;
    fgLightnessSlider.value = hsl.l;
  } else {
    // If called from slider, just sync the L in our state in case updateContrastForeground logic changes L
    fgHsl.l = hsl.l; 
  }
  
  updateSliderGradient('fg-lightness', fgHsl.h, fgHsl.s);
  updateContrastRatio();
}

function updateContrastBackground(hex, updateSlider = true) {
  bgHexInput.value = hex.toUpperCase();
  bgNativePicker.value = hex;
  const hsl = hexToHsl(hex);
  
  if (updateSlider) {
    bgHsl = hsl;
    bgLightnessSlider.value = hsl.l;
  } else {
    bgHsl.l = hsl.l;
  }
  
  updateSliderGradient('bg-lightness', bgHsl.h, bgHsl.s);
  updateContrastRatio();
}

function updateSliderGradient(sliderId, h, s) {
  const slider = document.getElementById(sliderId);
  const col1 = hslToHex(h, s, 0);
  const col2 = hslToHex(h, s, 50);
  const col3 = hslToHex(h, s, 100);
  slider.style.background = `linear-gradient(to right, ${col1}, ${col2}, ${col3})`;
}

let contrastTimeout;
function updateContrastRatio() {
  const fg = fgHexInput.value.replace('#', '');
  const bg = bgHexInput.value.replace('#', '');
  
  // Local calculation for instant feedback
  const ratio = calculateLocalContrast(fgHexInput.value, bgHexInput.value);
  displayRatio(ratio);
  
  // API call for "official" WebAIM result (debounced)
  clearTimeout(contrastTimeout);
  contrastTimeout = setTimeout(() => {
    fetchWebAIMContrast(fg, bg);
  }, 500);
  
  if (!isShuffling) updatePalette();
}

function displayRatio(ratio) {
  ratioValue.innerText = `${ratio.toFixed(2)} : 1`;
  
  // Apply live preview colors
  ratioDisplayContainer.style.backgroundColor = bgHexInput.value;
  ratioDisplayContainer.style.color = fgHexInput.value;

  if (ratio >= 4.5) {
    ratioDisplayContainer.classList.add('pass');
  } else {
    ratioDisplayContainer.classList.remove('pass');
  }
}

async function fetchWebAIMContrast(fg, bg) {
  try {
    const response = await fetch(`https://webaim.org/resources/contrastchecker/?fcolor=${fg}&bcolor=${bg}&api`);
    const data = await response.json();
    displayRatio(parseFloat(data.ratio));
  } catch (e) {
    console.error('WebAIM API Error:', e);
  }
}

function calculateLocalContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// --- Palette Logic ---

harmonySelect.onchange = () => updatePalette();

let isShuffling = false;
shuffleBtn.onclick = () => {
  isShuffling = true;
  const newBg = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  updateContrastBackground(newBg);
  
  const randomColors = [];
  for (let i = 0; i < 5; i++) {
    let randomFg;
    let attempts = 0;
    do {
      randomFg = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      attempts++;
    } while (calculateLocalContrast(randomFg, newBg) < 4.5 && attempts < 50);
    randomColors.push(randomFg);
  }
  
  updateContrastForeground(randomColors[0]);
  
  // Fill palette slots with the 5 random colors
  randomColors.forEach((hex, i) => setPaletteSlot(i, hex));
  isShuffling = false;
};

function updatePalette() {
  const fg = fgHexInput.value;
  const bg = bgHexInput.value;
  const harmony = harmonySelect.value;
  
  // First two are FG and BG
  setPaletteSlot(0, fg);
  setPaletteSlot(1, bg);
  
  const hsl = hexToHsl(fg);
  let offsets = [];
  
  switch(harmony) {
    case 'triadic':
      offsets = [120, 240, 180]; 
      break;
    case 'tetradic':
      offsets = [90, 180, 270];
      break;
    case 'analogous':
      offsets = [-30, 30, 60];
      break;
    case 'split':
    default:
      offsets = [150, 210, 180];
      break;
  }
  
  const otherColors = offsets.map(offset => hslToHex((hsl.h + offset) % 360, hsl.s, hsl.l));
  
  otherColors.forEach((hex, i) => {
    let finalHex = hex;
    if (calculateLocalContrast(hex, bg) < 4.5) {
      const cHsl = hexToHsl(hex);
      const darker = hslToHex(cHsl.h, cHsl.s, 10);
      const lighter = hslToHex(cHsl.h, cHsl.s, 90);
      if (calculateLocalContrast(lighter, bg) >= 4.5) finalHex = lighter;
      else if (calculateLocalContrast(darker, bg) >= 4.5) finalHex = darker;
    }
    setPaletteSlot(i + 2, finalHex);
  });
}

function setPaletteSlot(index, hex) {
  const slot = paletteSlots[index];
  slot.style.backgroundColor = hex;
  slot.title = hex.toUpperCase();
  slot.onclick = () => {
    updateMainDisplay(hex);
    // If it's a harmony color (Box 3, 4, or 5), update Background to test against Box 1 (FG)
    if (index >= 2) {
      updateContrastBackground(hex);
    }
  };
}

// --- Helper Functions (HSL/Hex conversion) ---

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

// Initial load
chrome.storage.local.get(['history'], (data) => {
  if (data.history && data.history.length > 0) {
    renderHistory(data.history);
    updateMainDisplay(data.history[0]);
    updateContrastForeground(data.history[0]);
  } else {
    updateMainDisplay('#007BFF');
    updateContrastForeground('#007BFF');
  }
  updateContrastBackground('#FFFFFF');
});
