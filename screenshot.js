function setScreenshotUrl(url) {
  document.getElementById('target').src = url;
}

chrome.runtime.onMessage.addListener(function (request) {
  console.log(request)
  if (request.event === 'RENDER_SCREENSHOT') {
    setScreenshotUrl(request.data.url);
  }

  if (request.event === 'COMPONENT_HTML') {
    console.log(request.data)

    const html = request.data.choices[0].message.content;
    console.log('RAW HTML', html);
    const processedHtml = html.replace(/^```html|```$/g, '')
    console.log('PROCESSED HTML', processedHtml);

    document.getElementById('qc_component_html').innerHTML = processedHtml;

    return;
  }
});