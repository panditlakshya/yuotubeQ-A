chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TRANSCRIPT") {
    // Logic to get the transcript from the YouTube page
    // This can involve querying elements on the page or using YouTube API if available
    const transcript = "Extracted transcript text"; // Placeholder
    sendResponse({ transcript });
  }
});
