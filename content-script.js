let highlightedElement = null;
let isPopupOpen = true;
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

  isSelecting = true;

  // Adiciona uma camada semi-transparente sobre a página
  const overlay = document.createElement('div');
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
  captureArea.classList.add('qc_component');
  captureArea.style.position = 'fixed';
  captureArea.style.border = '2px dashed #fff';
  captureArea.style.zIndex = '10000';
  document.body.appendChild(captureArea);

  // Adiciona um botão de confirmação
  const confirmButton = document.createElement('button');
  confirmButton.classList.add('qc_component');
  confirmButton.id = 'qc_confirm_button';
  confirmButton.textContent = 'Confirmar';
  confirmButton.style.position = 'fixed';
  confirmButton.style.bottom = '10px';
  confirmButton.style.left = '50%';
  confirmButton.style.transform = 'translateX(-50%)';
  confirmButton.style.zIndex = '10001';
  document.body.appendChild(confirmButton);

  // Adiciona eventos para manipular a seleção da área de recorte
  document.addEventListener('mousedown', startCapture);
  document.addEventListener('mousemove', updateCapture);
  document.addEventListener('mouseup', endCapture);

  confirmButton.addEventListener('click', confirmCapture);

  // document.addEventListener('mouseover', function (e) {
  //   if (!isSelecting) return;

  //   const closestElement = findClosestElement(e.target, SELECTABLE_TAGS);
  //   if (closestElement) {
  //     closestElement.classList.add('qc_highlight');
  //     highlightedElement = closestElement;
  //   }
  // });

  // document.addEventListener('mouseout', function () {
  //   if (!isSelecting) return;

  //   if (highlightedElement) {
  //     highlightedElement.classList.remove('qc_highlight');
  //     highlightedElement = null;
  //   }
  // });

  // document.addEventListener('click', function () {
  //   if (!isSelecting) return;

  //   if (highlightedElement) {
  //     console.log(highlightedElement)
  //   }
  // });
}

function startCapture(event) {
  if (!isSelecting) return;

  startX = event.clientX;
  startY = event.clientY;
  updateCapture(event);
}

function updateCapture(event) {
  if (!isSelecting) return;

  endX = event.clientX;
  endY = event.clientY;

  // Atualiza a posição e o tamanho da área de recorte
  const captureArea = document.querySelector('div[style*="border"]');
  captureArea.style.left = Math.min(startX, endX) + 'px';
  captureArea.style.top = Math.min(startY, endY) + 'px';
  captureArea.style.width = Math.abs(endX - startX) + 'px';
  captureArea.style.height = Math.abs(endY - startY) + 'px';
}

function endCapture() {
  if (!isSelecting) return;

  isSelecting = false;
}

function confirmCapture() {
  isSelecting = false;

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

