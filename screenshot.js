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

    document.getElementById('qc_component_html').innerHTML = html.substring(8, html.length - 3)
    return;
  }
});