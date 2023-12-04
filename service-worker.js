chrome.action.onClicked.addListener(async function (tab) {
  chrome.tabs.sendMessage(tab.id, { event: 'OPEN_APP' });
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
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

      getComponentHtml(request.data.url).then(data => {
        chrome.tabs.sendMessage(tabId, { event: 'COMPONENT_HTML', data });
      })
    });

    const createdTab = await chrome.tabs.create({ url: viewTabUrl });
    targetId = createdTab.id;
  }
});

async function getComponentHtml(imageUrl) {
  try {
    console.log('GETTING COMPONENT')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `
                  Provide me the HTML of this screenshot. 
                  Use only HTML and tailwind.css. 
                  Provide me only the code. 
                  Dont return any text besides the code. 
                  Use components from the web to help you build this component.
                  be as faithful as possible to the image, the component must look as similar as possible to the image, texts with the same characteristics, same colors. all details.
                  Dont provide the full page html, only the html that represents the components in the screenshot.
                  Don't include any explanations in your responses.
                `
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) return null;

    const data = await response.json();

    return data;
  } catch (err) {
    console.log('erro', err)
    return null;
  }
}