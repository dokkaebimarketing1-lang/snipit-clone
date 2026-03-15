// Service worker for Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("Snipit extension installed");
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup();
  }
  return true;
});
