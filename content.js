console.log("Content script loaded");
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
}

async function reteriveTranscript(videoId) {
  const YT_INITIAL_PLAYER_RESPONSE_RE =
    /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
  let player = window.ytInitialPlayerResponse;

  try {
    const response = await fetch("https://www.youtube.com/watch?v=" + videoId);
    const html = await response.text();
    const playerResponse = html.match(YT_INITIAL_PLAYER_RESPONSE_RE);
    if (!playerResponse) {
      console.warn("Unable to parse playerResponse");
      throw new Error("Unable to parse playerResponse");
    }
    player = JSON.parse(playerResponse[1]);
    const metadata = {
      title: player.videoDetails.title,
      duration: player.videoDetails.lengthSeconds,
      author: player.videoDetails.author,
      views: player.videoDetails.viewCount,
    };
    // Get the tracks and sort them by priority
    const tracks =
      player.captions.playerCaptionsTracklistRenderer.captionTracks;
    tracks.sort(compareTracks);

    // Get the transcript
    const transcriptResponse = await fetch(tracks[0].baseUrl + "&fmt=json3");
    const transcriptData = await transcriptResponse.json();
    const parsedTranscript = transcriptData.events
      .filter(function (x) {
        return x.segs;
      })
      .map(function (x) {
        return x.segs
          .map(function (y) {
            return y.utf8;
          })
          .join(" ");
      })
      .join(" ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ");

    const result = { transcript: parsedTranscript, metadata: metadata };
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}

function compareTracks(track1, track2) {
  const langCode1 = track1.languageCode;
  const langCode2 = track2.languageCode;

  if (langCode1 === "en" && langCode2 !== "en") {
    return -1; // English comes first
  } else if (langCode1 !== "en" && langCode2 === "en") {
    return 1; // English comes first
  } else if (track1.kind !== "asr" && track2.kind === "asr") {
    return -1; // Non-ASR comes first
  } else if (track1.kind === "asr" && track2.kind !== "asr") {
    return 1; // Non-ASR comes first
  }

  return 0; // Preserve order if both have same priority
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideoInfo") {
    const videoId = getVideoId();
    if (videoId) {
      reteriveTranscript(videoId)
        .then((transcript) => {
          sendResponse({
            transcript: transcript,
            videoId: videoId,
          });
        })
        .catch((error) => {
          sendResponse({ error: error.toString() });
        });
    } else {
      sendResponse({ error: "Could not get video ID" });
    }
    return true; // Indicates that the response is sent asynchronously
  }
});
