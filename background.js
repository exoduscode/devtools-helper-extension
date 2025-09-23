chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clear-cookies") {
    chrome.browsingData.remove({ since: 0 }, { cookies: true }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Keep the message channel open for async response
  }
});
