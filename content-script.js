// CONSTANTS
const SELECTABLE_TAGS = ['DIV', 'SECTION', 'MAIN', 'HEADER'];
const RESET_STATE = {
  isOpen: false,
  isSelecting: false,
  isSelected: false,
  selection: {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  }
};
const devicePixelRatio = window.devicePixelRatio || 1;
console.log('devicePixelRatio', devicePixelRatio)
let APP_STATE = { ...RESET_STATE };

chrome.runtime.onMessage.addListener((request) => {
  if (request.event === 'OPEN_APP') {
    startApp();
    return;
  }

  if (request.event === 'SCREENSHOT') {
    cropScreenshot(request.data);
    return;
  }
});

function startApp() {
  const app = document.createElement('div');
  app.id = 'qc_app';

  app.innerHTML = renderUI();

  document.body.appendChild(app);

  APP_STATE.isOpen = true;

  document.addEventListener('mousedown', startCapture);
  document.addEventListener('mousemove', updateCapture);
  document.addEventListener('mouseup', endCapture);
  document.addEventListener('keydown', cancelCapture);

  document.getElementById('qc_cancel_button').addEventListener('click', e => cancelCapture({ key: 'Escape' }));
  document.getElementById('qc_restart_button').addEventListener('click', restartCapture);
  document.getElementById('qc_confirm_button').addEventListener('click', confirmCapture);

  console.log('START APP', APP_STATE)
}

function closeApp() {
  document.removeEventListener('mousedown', startCapture);
  document.removeEventListener('mousemove', updateCapture);
  document.removeEventListener('mouseup', endCapture);
  document.removeEventListener('keydown', cancelCapture);

  document.getElementById('qc_cancel_button').removeEventListener('click', e => cancelCapture({ key: 'Escape' }));
  document.getElementById('qc_restart_button').removeEventListener('click', restartCapture);
  document.getElementById('qc_confirm_button').removeEventListener('click', confirmCapture);

  const app = document.getElementById('qc_app');

  document.body.removeChild(app);
  APP_STATE = { ...RESET_STATE };
}

function renderUI() {
  return `
    <div id="qc_container">
      <div id="qc_capture_area">
        <span id="qc_capture_area_info"></span>
      </div>
      <div id="qc_actions">
        <button id="qc_cancel_button" class="qc_button">CANCEL</button>
        <button id="qc_restart_button" class="qc_button">RESTART</button>
        <button id="qc_confirm_button" class="qc_button">CONFIRM</button>
      </div>
    </div>
  `;
}

function startCapture(event) {
  if (!APP_STATE.isOpen || APP_STATE.isSelected) return;

  console.log('START_CAPTURE')

  APP_STATE.isSelecting = true;

  APP_STATE.selection.startX = event.clientX;
  APP_STATE.selection.startY = event.clientY;

  updateCapture(event);
}

function updateCapture(event) {
  if (!APP_STATE.isOpen || !APP_STATE.isSelecting) return;

  console.log('UPDATING_CAPTURE', APP_STATE.selection)

  const startX = APP_STATE.selection.startX;
  const startY = APP_STATE.selection.startY;
  const endX = event.clientX;
  const endY = event.clientY;

  APP_STATE.selection.endX = endX;
  APP_STATE.selection.endY = endY;

  const captureArea = document.getElementById('qc_capture_area');
  captureArea.style.left = Math.min(startX, endX) + 'px';
  captureArea.style.top = Math.min(startY, endY) + 'px';
  captureArea.style.width = Math.abs(endX - startX) + 'px';
  captureArea.style.height = Math.abs(endY - startY) + 'px';

  const captureAreaInfo = document.getElementById('qc_capture_area_info');
  captureAreaInfo.innerText = `${Math.abs(endX - startX)} x ${Math.abs(endY - startY)}`;
}

function endCapture() {
  if (!APP_STATE.isOpen || !APP_STATE.isSelecting) return;

  console.log('FINISHED_CAPTURE');

  APP_STATE.isSelecting = false;
  APP_STATE.isSelected = true;
}

async function confirmCapture() {
  if (!APP_STATE.isOpen || APP_STATE.isSelecting || !APP_STATE.isSelected) return;

  console.log('CONFIRMED_CAPTURE', APP_STATE.selection);

  const MESSAGE = {
    event: 'COMPONENT_SELECTED',
    data: APP_STATE.selection
  }

  closeApp();

  await new Promise(resolve => setTimeout(resolve, 1000))

  chrome.runtime.sendMessage(MESSAGE);
}

function restartCapture() {
  if (!APP_STATE.isOpen) return;

  APP_STATE.isSelecting = false;
  APP_STATE.isSelected = false;
  APP_STATE.selection = RESET_STATE.selection;

  const captureArea = document.getElementById('qc_capture_area');
  captureArea.style.left = '';
  captureArea.style.top = '';
  captureArea.style.width = '';
  captureArea.style.height = '';

  const captureAreaInfo = document.getElementById('qc_capture_area_info');
  captureAreaInfo.innerText = '';

  console.log('RESTART_CAPTURE');
}

function cancelCapture(event) {
  if (event.key === 'Escape') closeApp();
}

function cropScreenshot(data) {
  console.log('data', data)

  const img = new Image();
  img.src = data.screenshotUrl;

  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = Math.abs(data.endX - data.startX) * devicePixelRatio;
    canvas.height = Math.abs(data.endY - data.startY) * devicePixelRatio;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      img,
      Math.min(data.startX, data.endX) * devicePixelRatio,
      Math.min(data.startY, data.endY) * devicePixelRatio,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImage = canvas.toDataURL('image/png');

    chrome.runtime.sendMessage({ event: 'COMPONENT_SCREENSHOT', data: { url: croppedImage } });
  };
}

// HELPERS
function findClosestElement(element, tags) {
  while (element) {
    if (tags.includes(element.tagName)) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function downloadCanvasImage(url) {
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `qc_${new Date().getTime(0)}`;
  downloadLink.click();
}