document.getElementById("askBtn").addEventListener("click", () => {
  const question = document.getElementById("question").value;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { type: "GET_TRANSCRIPT" }, (response) => {
      if (response && response.transcript) {
        const transcript = response.transcript;
        // Send question and transcript to the backend
        fetch("http://localhost:5000/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, transcript }),
        })
          .then((res) => res.json())
          .then((data) => {
            document.getElementById("response").innerText = data.answer;
          });
      }
    });
  });
});
// "background": {
//   "service_worker": "background.js"
// },
