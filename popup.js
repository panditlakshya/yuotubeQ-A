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

      console.log("Video info:", { response });
      fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, transcript: response }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data.answer, "response answer");
          answerDiv.textContent = data.answer;
        })
        .catch((error) => {
          console.error("Error:", error);
          answerDiv.textContent =
            "An error occurred while processing your request.";
        });
    });
  });
});
