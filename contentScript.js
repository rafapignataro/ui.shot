let highlightedElement = null;
let isPopupOpen = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.popupOpen === undefined) return;

  if (request.popupOpen) {
    isPopupOpen = true;
    return;
  }

  isPopupOpen = false;

  if (!highlightedElement) return;

  html2canvas(highlightedElement, {
  }).then(canvas => {
    const url = canvas.toDataURL('image/png');

    downloadCanvasImage(url)
  })

  highlightedElement.classList.remove('qc_hightlight');
  highlightedElement = null;
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

document.addEventListener('mouseover', function (e) {
  if (!isPopupOpen) return;

  const closestElement = findClosestElement(e.target, SELECTABLE_TAGS);
  if (closestElement) {
    closestElement.classList.add('qc_highlight');
    highlightedElement = closestElement;
  }
});

document.addEventListener('mouseout', function () {
  if (!isPopupOpen) return;

  if (highlightedElement) {
    highlightedElement.classList.remove('qc_highlight');
    highlightedElement = null;
  }
});

document.addEventListener('click', function () {
  if (!isPopupOpen) return;

  if (highlightedElement) {
    console.log(2, highlightedElement)
    html2canvas(highlightedElement).then(canvas => {
      const url = canvas.toDataURL();

      downloadCanvasImage(url)
    })
  }
});
