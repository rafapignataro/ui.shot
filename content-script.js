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
    endY: 0,
    width: 0,
    height: 0,
    deviceWidth: 0,
    devieHeight: 0
  }
};
const devicePixelRatio = window.devicePixelRatio || 1;

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
      <div id="qc_notifications" class="id="qc_notifications"">
        <div class="qc_notification_item">
          <span>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quo, ipsam quod. Eos aspernatur, nisi a cum quia nihil recusandae minima quisquam totam quas nostrum quos quibusdam soluta debitis praesentium ab!
          </span>
          <button class="qc_button" title="Close notification">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke-width="1.5" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="qc_notification_item">
          <span>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quo, ipsam quod.
          </span>
          <button class="qc_button" title="Close notification">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke-width="1.5" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div id="qc_actions">
        <button id="qc_cancel_button" class="qc_button" title="Cancel">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"  width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="qc_divider"></div>
        <button id="qc_restart_button" class="qc_button" title="Reset selection">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"  width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </button>
        <div class="qc_divider"></div>
        <button id="qc_confirm_button" class="qc_button" title="Confirm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"  width="24" height="24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
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
  const width = 0;
  const height = 0;

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