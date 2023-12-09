chrome.action.onClicked.addListener(async function (tab) {
  chrome.tabs.sendMessage(tab.id, { event: 'OPEN_APP' });
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.event === 'COMPONENT_SELECTED') {
    const screenshotUrl = await chrome.tabs.captureVisibleTab();

    chrome.tabs.sendMessage(sender.tab.id, { event: 'SCREENSHOT', data: { screenshotUrl } });
  }

  if (request.event === 'COMPONENT_SCREENSHOT') {
    console.log(request)
    const viewTabUrl = chrome.runtime.getURL('screenshot.html');

    let targetId = null;

    chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
      if (tabId != targetId || changedProps.status != 'complete') return;

      chrome.tabs.onUpdated.removeListener(listener);

      console.log(1)
      chrome.tabs.sendMessage(tabId, { event: 'RENDER_SCREENSHOT', data: { image: request.data.image } });
      console.log(2)

      getComponentHtml({ image: request.data.image, html: request.data.html }).then(hmtl => {
        console.log('GENERATED HTML', hmtl)
        chrome.tabs.sendMessage(tabId, { event: 'COMPONENT_HTML', data: { hmtl } });
      })
    });

    const createdTab = await chrome.tabs.create({ url: viewTabUrl });
    targetId = createdTab.id;
  }
});

async function getComponentHtml({ image, html }) {
  try {
    console.log('GETTING COMPONENT V2')

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
                  > Task:
                    - You are receiving an image of a web component and the its HTML.
                    - Your task is to meticulously replicate it with only HTML and TailwindCSS.
                    - You need to replicate the style (size, color, font sizes, radius and any visual aspect) and the HTML structure. 
                    - The HTML with TailwindCSS must match the image provided. Strive for the highest level of precision, ensuring an exact match with the image.
                  
                  > COMPONENT HTML: "${html}"

                  > Steps:
                    - 1. Image description
                      - Describe detailed and precisely the web component image. 
                      - Figure out how the style and the scructure was made.
                      - Store this description to use in the next step.
                    - 2. Generate HTML with TailwindCSS
                      - With the description you generated in the last step ("Image description"), the image provided, and
                      the HTML provided, generate the HTML code of the scructure, and style it with TailwindCSS
                      - If the html provide contains tailwind classes try to see if they work in the task. The html provided is
                      a guide to create the final component that matchs its image
                      - The HTML structure must match precisely the image.
                        - Primarily, try to use html tags like inputs, buttons, tables, selects and the other one other than divs.
                        Use divs when you detect that is just a wrapper or container.
                        - Use the description you generated to try to match the html tags that can match the imagem html structure
                      - The HTML structure must match precisely the image. All the styles aspects must match.
                        - The colors, radius, spacing, alignment, directions and aspects related to that must match.
                        - The responsiveness must match.
                        - Think about using grid or flex the precisely replicate the visual structure of the web component.
                    - 3. Adjustments
                      - Use the src "/default.png" in every img tag you generate.
                  > Output:
                    - It is important you only return the HTML in the response.
                    - Don’t provide any more information other than the generated HTML.
                    - It’s a bad response to have anything other than the generated HTML.
                    - Don’t provide any comments, explanations or anything else related.
                    - Just provide the code
                    - You should not request additional information from the user.
                `
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'low'
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

    const generatedHTML = data.choices[0].message.content;

    return generatedHTML;
  } catch (err) {
    console.log('erro', err)
    return null;
  }
}