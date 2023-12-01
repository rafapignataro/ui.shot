let highlightedElement = null;
let isSelecting = false;
let startX, startY, endX, endY;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request)
  if (request.event === 'START_SELECTION') {
    handleStartSelection();
    return;
  }

  if (request.event === 'SCREENSHOT') {
    handleScreenshot(request.data);
    return;
  }
});

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

const SELECTABLE_TAGS = ['DIV', 'SECTION', 'MAIN', 'HEADER']

function handleStartSelection() {
  isSelecting = true;
  console.log('START_SELECTION')
  // Adiciona uma camada semi-transparente sobre a página
  const overlay = document.createElement('div');
  overlay.id = 'qc_overlay';
  overlay.classList.add('qc_component');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9999';
  document.body.appendChild(overlay);

  // Adiciona um elemento para representar a área de recorte
  const captureArea = document.createElement('div');
  captureArea.id = 'qc_capture_area';
  captureArea.classList.add('qc_component');
  captureArea.style.position = 'fixed';
  captureArea.style.border = '2px dashed red';
  captureArea.style.zIndex = '10000';
  document.body.appendChild(captureArea);

  // Adiciona um botão de confirmação
  const confirmButton = document.createElement('button');
  confirmButton.id = 'qc_confirm_button';
  confirmButton.classList.add('qc_component');
  confirmButton.textContent = 'CONFIRM';
  confirmButton.style.position = 'fixed';
  confirmButton.style.bottom = '10px';
  confirmButton.style.left = '50%';
  confirmButton.style.transform = 'translateX(-50%)';
  confirmButton.style.zIndex = '10001';
  confirmButton.style.background = '#fff';
  confirmButton.style.color = '#1d1d1d';
  confirmButton.style.padding = '4px 8px';
  confirmButton.style.borderRadius = '4px';
  document.body.appendChild(confirmButton);

  document.addEventListener('mousedown', startCapture);
  document.addEventListener('mousemove', updateCapture);
  document.addEventListener('mouseup', endCapture);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      cancelCapture();
    }
  })

  confirmButton.addEventListener('click', confirmCapture);
}

function startCapture(event) {
  console.log('START_CAPTURE', isSelecting)
  if (!isSelecting) return;

  startX = event.clientX;
  startY = event.clientY;
  updateCapture(event);
}

function updateCapture(event) {
  if (!isSelecting) return;
  console.log('update_CAPTURE', isSelecting)

  endX = event.clientX;
  endY = event.clientY;

  // Atualiza a posição e o tamanho da área de recorte
  const captureArea = document.getElementById('qc_capture_area');
  captureArea.style.left = Math.min(startX, endX) + 'px';
  captureArea.style.top = Math.min(startY, endY) + 'px';
  captureArea.style.width = Math.abs(endX - startX) + 'px';
  captureArea.style.height = Math.abs(endY - startY) + 'px';
}

function endCapture() {
  console.log('END_CAPTURE', isSelecting)
  if (!isSelecting) return;

  isSelecting = false;
}

function confirmCapture() {
  document.querySelectorAll('.qc_component').forEach(el => el.remove());

  const MESSAGE = {
    event: 'COMPONENT_SELECTED',
    data: {
      startX,
      startY,
      endX,
      endY,
    }
  }

  console.log(MESSAGE)
  // 10. Send captured component to background.js
  chrome.runtime.sendMessage(MESSAGE);

  resetState();
}

function cancelCapture() {
  document.querySelectorAll('.qc_component').forEach(el => el.remove());

  resetState();
}

function resetState() {
  highlightedElement = null;
  isSelecting = false;
  startX = undefined;
  startY = undefined;
  endX = undefined;
  endY = undefined;
}

function handleScreenshot(data) {
  const img = new Image();

  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = Math.abs(data.endX - data.startX);
    canvas.height = Math.abs(data.endY - data.startY);

    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      img,
      Math.min(data.startX, data.endX),
      Math.min(data.startY, data.endY),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImage = canvas.toDataURL('image/png');

    // downloadCanvasImage(croppedImage)
    chrome.runtime.sendMessage({ event: 'COMPONENT_SCREENSHOT', data: { url: croppedImage } });
  };

  img.src = data.screenshotUrl;
}

