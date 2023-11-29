document.addEventListener('DOMContentLoaded', function () {
  console.log(123)
  chrome.runtime.connect({ name: 'popup' });

  chrome.runtime.sendMessage({ popupOpen: true });
});