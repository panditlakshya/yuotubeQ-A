// document.getElementById("askBtn").addEventListener("click", () => {
//   const question = document.getElementById("question").value;
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     const tab = tabs[0];
//     chrome.tabs.sendMessage(tab.id, { type: "GET_TRANSCRIPT" }, (response) => {
//       if (response && response.transcript) {
//         const transcript = response.transcript;
//         // Send question and transcript to the backend
//         // fetch("http://localhost:5000/ask", {
//         //   method: "POST",
//         //   headers: {
//         //     "Content-Type": "application/json",
//         //   },
//         //   body: JSON.stringify({ question, transcript }),
//         // })
//         //   .then((res) => res.json())
//         //   .then((data) => {
//         //     document.getElementById("response").innerText = data.answer;
//         //   });
//         console.log({ question, transcript });
//       }
//     });
//   });
// });
// // "background": {
// //   "service_worker": "background.js"
// // },

console.log("Popup script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup DOM loaded");
  const questionInput = document.getElementById("question");
  const submitButton = document.getElementById("submit");
  const answerDiv = document.getElementById("answer");

  submitButton.addEventListener("click", () => {
    const question = questionInput.value;
    console.log("Submit button clicked, question:", question);

    chrome.runtime.sendMessage({ action: "getVideoInfo" }, (response) => {
      console.log("Received response in popup:", response);
      if (chrome.runtime.lastError) {
        console.error("Error in sendMessage:", chrome.runtime.lastError);
        answerDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        return;
      }

      if (response.error) {
        console.error("Error in response:", response.error);
        answerDiv.textContent = `Error: ${response.error}`;
        return;
      }

      const { title, description } = response;
      console.log("Video info:", { title, description, response });
      // fetch('http://localhost:5000/ask', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ question, transcript })
      // })
      // .then(res => res.json())
      // .then(data => {
      //   document.getElementById('response').innerText = data.answer;
      // })
      // .catch(error => {
      //   console.error('Error:', error);
      //   document.getElementById('response').innerText = 'An error occurred while processing your request.';
      // });

      const placeholderAnswer = `Question: ${question}\n\nBased on the video "${title}", here's a placeholder answer. In a real implementation, you would send this data to an AI service to generate a relevant response.`;

      answerDiv.textContent = placeholderAnswer;
    });
  });
});
