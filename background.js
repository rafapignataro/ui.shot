chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.popupOpen === undefined) return;

  console.log('OPEN POPUP')
  isPopupOpen = request.popupOpen;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0].id;
    chrome.tabs.sendMessage(activeTabId, { popupOpen: true });
  });
});

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name !== 'popup') return;

  port.onDisconnect.addListener(function () {
    console.log('CLOSE POPUP')

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      chrome.tabs.sendMessage(activeTabId, { popupOpen: false });
    });
  });
});