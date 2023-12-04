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
                  Your task is to meticulously replicate the visual components, including HTML structure and TailwindCSS 
                  styling, from the provided image. Follow the detailed instructions below for accurate and refined code generation.

                  1. Input:
                  
                  You will receive an image depicting a specific area of a web page.
                  The image represents a visual component that must be replicated in HTML and TailwindCSS.
                  
                  2. Output:
                  
                  Your response should include the generated HTML and TailwindCSS code only, with no additional explanations or text.
                  
                  3. Details to Capture:
                  
                  Examine and identify the HTML components used in the image.
                  Pay close attention to styling details, such as size, borders, border-radius, colors, fonts, and any other visual attributes.
                  Strive for the highest level of precision, ensuring an exact match with the image.
                  
                  4. Comparison and Refinement:
                  
                  After generating the initial code, compare it with the provided image.
                  Make adjustments to enhance the accuracy and alignment of the generated code with the image.
                  Iteratively refine the code by closely inspecting each detail until a 100% match is achieved.
                  
                  5. Assistance:
                  
                  Utilize existing HTML and TailwindCSS templates or components as references to improve the accuracy of your code.
                  Aim for perfection in replicating both the structure and style of the visual component.
                  
                  6. User Interaction:
                  
                  You should not request additional information from the user. Generate the code solely based on the provided image.
                  
                  7. Training Objectives:
                  
                  You should be meticulous in replicating HTML structure and TailwindCSS styling from images.
                  Achieve a high level of precision by iteratively refining the generated code based on image comparisons.
                  
                  8. Remember, your response should consist only of the HTML and TailwindCSS code, and the goal is to achieve a flawless replication of the visual component from the provided image. Strive for precision and accuracy throughout the code generation process.
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