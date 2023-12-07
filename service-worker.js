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

      getComponentHtmlV2(request.data.url).then(data => {
        chrome.tabs.sendMessage(tabId, { event: 'COMPONENT_HTML', data });
      })
    });

    const createdTab = await chrome.tabs.create({ url: viewTabUrl });
    targetId = createdTab.id;
  }
});

// async function getComponentHtml(imageUrl) {
//   try {
//     console.log('GETTING COMPONENT V1')

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer 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',
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: 'gpt-4-vision-preview',
//         messages: [
//           {
//             role: 'user',
//             content: [
//               {
//                 type: 'text',
//                 text: `
//                   Your task is to meticulously replicate the visual components, including HTML structure and TailwindCSS 
//                   styling, from the provided image. Follow the detailed instructions below for accurate and refined code generation.

//                   1. Input:

//                   You will receive an image depicting a specific area of a web page.
//                   The image represents a visual component that must be replicated in HTML and TailwindCSS.

//                   2. Output:

//                   Your response should include the generated HTML and TailwindCSS code only, 
//                   with no additional explanations or text. Dont include comments, no additional info. Just the code. JUST THE CODE.

//                   3. Details to Capture:

//                   Examine and identify the HTML components used in the image.
//                   Pay close attention to styling details, such as size, borders, border-radius, colors, fonts, and any other visual attributes.
//                   Strive for the highest level of precision, ensuring an exact match with the image.

//                   3.1 Images

//                   Every place you detect an image. use the src "/default.png" in the img elements

//                   4. Comparison and Refinement:

//                   After generating the initial code, compare it with the provided image.
//                   Make adjustments to enhance the accuracy and alignment of the generated code with the image.
//                   Iteratively refine the code by closely inspecting each detail until a 100% match is achieved.

//                   5. Assistance:

//                   Utilize existing HTML and TailwindCSS templates or components as references to improve the accuracy of your code.
//                   Aim for perfection in replicating both the structure and style of the visual component.

//                   6. User Interaction:

//                   You should not request additional information from the user. Generate the code solely based on the provided image.

//                   7. Objectives:

//                   You should be meticulous in replicating HTML structure and TailwindCSS styling from images.
//                   Achieve a high level of precision by iteratively refining the generated code based on image comparisons.
//                   Provide only the HTML respected to the component. Dont provide html, head, body tags. Only the html of the component.

//                   8. Remember, your response should consist only of the HTML and TailwindCSS code, and the goal is to achieve a flawless replication of the visual component from the provided image. Strive for precision and accuracy throughout the code generation process.
//                 `
//               },
//               {
//                 type: 'image_url',
//                 image_url: {
//                   url: imageUrl,
//                   detail: 'low'
//                 }
//               }
//             ]
//           }
//         ],
//         max_tokens: 2000
//       })
//     });

//     if (!response.ok) return null;

//     const data = await response.json();

//     return data;
//   } catch (err) {
//     console.log('erro', err)
//     return null;
//   }
// }

async function getComponentHtmlV2(imageUrl) {
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
                    - You are receiving an image of a web component.
                    - Your task is to meticulously replicate it with only HTML and TailwindCSS.
                    - You need to replicate the style (size, color, font sizes, radius and any visual aspect) and the HTML structure. 
                    - The HTML with TailwindCSS must match the image provided. Strive for the highest level of precision, ensuring an exact match with the image.
                  
                  > Steps:
                    - 1. Image description
                      - Describe detailed and precisely the web component image. 
                      - Figure out how the style and the scructure was made.
                      - Store this description to use in the next step.
                      - Discover which html tags the component might be using
                    - 2. Generate HTML with TailwindCSS
                      - With the description you generated in the last step ("Image description") and the image provided,
                      generate the HTML code of the scructure, and style it with TailwindCSS
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
                  url: imageUrl,
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

    return data;
  } catch (err) {
    console.log('erro', err)
    return null;
  }
}

async function getComponentDescription(imageUrl) {
  try {
    console.log('GETTING COMPONENT DESCRIPTION')

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
                  With much precision, describe the image.
                `
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
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

    return data;
  } catch (err) {
    console.log('erro', err)
    return null;
  }
}