console.log("Background.js is loaded");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  if (request.action === "getVideoInfo") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        sendResponse({ error: "No active tab" });
        return;
      }
      const activeTab = tabs[0];
      console.log("Sending message to content script in tab:", activeTab.id);
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: "getVideoInfo" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error in sendMessage:", chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log("Received response from content script:", response);
            sendResponse(response);
          }
        }
      );
    });
    return true; // Indicates that the response is sent asynchronously
  }
});
