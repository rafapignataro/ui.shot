// 1. User click extension icon
chrome.action.onClicked.addListener(async function (tab) {
  console.log(tab)

  // 2. Send event to content-script.js to enable component selection
  chrome.tabs.sendMessage(tab.id, { event: 'START_SELECTION' });
  // const screenshotUrl = await chrome.tabs.captureVisibleTab();
  // console.log(screenshotUrl)
  // const viewTabUrl = chrome.runtime.getURL('screenshot.html');
  // let targetId = null;

  // chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
  //   // We are waiting for the tab we opened to finish loading.
  //   // Check that the tab's id matches the tab we opened,
  //   // and that the tab is done loading.
  //   if (tabId != targetId || changedProps.status != 'complete') return;

  //   // Passing the above test means this is the event we were waiting for.
  //   // There is nothing we need to do for future onUpdated events, so we
  //   // use removeListner to stop getting called when onUpdated events fire.
  //   chrome.tabs.onUpdated.removeListener(listener);

  //   // Send screenshotUrl to the tab.
  //   chrome.tabs.sendMessage(tabId, { msg: 'screenshot', data: screenshotUrl });
  // });

  // const createdTab = await chrome.tabs.create({ url: viewTabUrl });
  // targetId = createdTab.id;
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