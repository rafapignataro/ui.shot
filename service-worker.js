chrome.action.onClicked.addListener(async function (tab) {
  console.log(tab)

  chrome.tabs.sendMessage(tab.id, { event: 'START_SELECTION' });
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(request)
  if (request.event === 'COMPONENT_SELECTED') {
    const screenshotUrl = await chrome.tabs.captureVisibleTab();

    chrome.tabs.sendMessage(sender.tab.id, { event: 'SCREENSHOT', data: { screenshotUrl, ...request.data } });
  }

  if (request.event === 'COMPONENT_SCREENSHOT') {
    const viewTabUrl = chrome.runtime.getURL('screenshot.html');

    let targetId = null;

    chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
      if (tabId != targetId || changedProps.status != 'complete') return;

      chrome.tabs.onUpdated.removeListener(listener);

      chrome.tabs.sendMessage(tabId, { event: 'RENDER_SCREENSHOT', data: { url: request.data.url } });
    });

    const createdTab = await chrome.tabs.create({ url: viewTabUrl });
    targetId = createdTab.id;
  }
});