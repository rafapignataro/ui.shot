// CONSTANTS
const SELECTABLE_TAGS = ['DIV', 'SECTION', 'MAIN', 'HEADER', 'NAV', 'FOOTER'];
const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;

// LETS
let hoverElement = null;
let selectedElement = null;
let selectedElementCoords = null;

chrome.runtime.onMessage.addListener((request) => {
  if (!request.event) return;

  switch (request.event) {
    case 'START_APP':
      init();
      break;
    case 'TAB_SCREENSHOT':
      handleScreenshotEvent(request.data);
      break;
    default:
      break;
  }
});

function init() {
  const menu = document.createElement('div');
  menu.id = 'ui_shot_menu';

  const cancelButton = document.createElement('button');
  cancelButton.id = 'ui_shot_cancel_button';
  cancelButton.className = 'ui_shot_button';
  cancelButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `

  const confirmButton = document.createElement('button');
  confirmButton.id = 'ui_shot_confirm_button';
  confirmButton.className = 'ui_shot_button';
  confirmButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  `

  confirmButton.addEventListener('click', async () => {
    if (!selectedElement || !selectedElementCoords) return;

    chrome.runtime.sendMessage({ event: 'REQUEST_SCREENSHOT' });
  })

  menu.appendChild(cancelButton);
  menu.appendChild(confirmButton);

  document.body.appendChild(menu);

  document.body.style.cursor = 'pointer';

  cancelButton.addEventListener('click', () => {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleMouseClick);

    document.body.removeChild(menu);
    hoverElement = null;
  });

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleMouseClick);
}

// Browser Events
function handleMouseOver(event) {
  const { target } = event;

  if (!target) return;

  const menu = document.getElementById('ui_shot_menu');

  if (!menu) return;

  if (target === menu || menu.contains(target)) return;

  const element = findClosestElement(target, SELECTABLE_TAGS);

  if (!element) return;

  if (hoverElement) hoverElement.classList.remove('ui_shot_highlight');

  element.classList.add('ui_shot_highlight');

  hoverElement = element;
}

function handleMouseOut(event) {
  const { target } = event;

  if (!target) return;

  target.classList.remove('ui_shot_highlight');
}

function handleMouseClick(event) {
  const { target } = event;

  if (!target) return;

  if (!hoverElement) return;

  const menu = document.getElementById('ui_shot_menu');

  if (!menu) return;

  if (target === menu || menu.contains(target)) return;

  if (selectedElement) selectedElement.classList.remove('ui_shot_highlight_selected');

  selectedElement = hoverElement;

  selectedElement.classList.add('ui_shot_highlight_selected');

  const eltCoords = selectedElement.getBoundingClientRect();

  console.log('eltCoords', eltCoords)

  selectedElementCoords = {
    x: eltCoords.left,
    y: eltCoords.top,
    width: eltCoords.width,
    height: eltCoords.height
  }

  console.log('selectedElementCoords', selectedElementCoords)
}

// Service Work Events
async function handleScreenshotEvent({ screenshotUrl }) {
  console.log({ selectedElement, selectedElementCoords });

  if (!selectedElement || !selectedElementCoords) return;

  const { x, y, width, height } = selectedElementCoords;
  console.log('crop area', selectedElementCoords)

  const croppedImage = await cropImage(screenshotUrl, { x, y, width, height });

  chrome.runtime.sendMessage({
    event: 'CROP_IMAGE',
    data: {
      image: croppedImage,
      html: selectedElement.innerHTML
    }
  });
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

function downloadImage(url) {
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `qc_${new Date().getTime(0)}`;
  downloadLink.click();
}

async function cropImage(image, { x, y, width, height }) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = image;

      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = width * DEVICE_PIXEL_RATIO;
        canvas.height = height * DEVICE_PIXEL_RATIO;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(
          img,
          x * DEVICE_PIXEL_RATIO,
          y * DEVICE_PIXEL_RATIO,
          canvas.width,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const croppedImage = canvas.toDataURL('image/png');

        resolve(croppedImage);
      }
    } catch (err) {
      reject(err);
    }
  });
}