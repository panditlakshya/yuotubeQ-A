console.log("Content script loaded");
// alert("YouTube Q&A Content Script Loaded");

function getVideoInfo() {
  const videoTitle =
    document.querySelector("h1.ytd-video-primary-info-renderer")?.textContent ||
    "";
  const videoDescription =
    document.querySelector("#description-text")?.textContent || "";
  console.log("Video info retrieved:", {
    title: videoTitle,
    description: videoDescription,
  });
  return { title: videoTitle, description: videoDescription };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideoInfo") {
    const videoInfo = getVideoInfo();
    console.log("Sending video info back:", videoInfo);
    sendResponse(videoInfo);
  }
});
