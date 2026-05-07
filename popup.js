const trigger = document.getElementById('eyedropper-trigger');
const hexDisplay = document.getElementById('hex-display');
const rVal = document.getElementById('r-val');
const gVal = document.getElementById('g-val');
const bVal = document.getElementById('b-val');
const slots = document.querySelectorAll('.slot');

trigger.addEventListener('click', async () => {
  const eyeDropper = new EyeDropper();
  try {
    const result = await eyeDropper.open();
    updateDisplay(result.sRGBHex);
    addToHistory(result.sRGBHex);
  } catch (e) {}
});

function updateDisplay(hex) {
  hexDisplay.innerText = hex.toUpperCase();
  hexDisplay.style.backgroundColor = hex;
  
  // Update text color for contrast
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  hexDisplay.style.color = (r*0.299 + g*0.587 + b*0.114) > 186 ? '#000' : '#fff';
  
  rVal.innerText = r;
  gVal.innerText = g;
  bVal.innerText = b;
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
    let history = [hex, ...(data.history || [])].slice(0, 5);
    chrome.storage.local.set({ history }, () => renderHistory(history));
  });
}

function renderHistory(history) {
  slots.forEach((slot, i) => {
    if (history[i]) {
      slot.style.backgroundColor = history[i];
      slot.onclick = () => updateDisplay(history[i]);
    }
  });
}

// Initial load
chrome.storage.local.get(['history'], (data) => {
  if (data.history && data.history.length > 0) {
    renderHistory(data.history);
    updateDisplay(data.history[0]);
  }
});