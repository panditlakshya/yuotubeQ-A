document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup DOM loaded");
  const questionInput = document.getElementById("question");
  const submitButton = document.getElementById("submit");
  const answerDiv = document.getElementById("answer");
  const messageBoxDiv = document.getElementById("message-box");

  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `mb-2 p-2 rounded ${
      isUser ? "bg-blue-100 text-right" : "bg-gray-200"
    }`;
    messageDiv.textContent = content;
    messageBoxDiv.appendChild(messageDiv);
    messageBoxDiv.scrollTop = messageBoxDiv.scrollHeight;
  }

  submitButton.addEventListener("click", () => {
    const question = questionInput.value;
    addMessage(question, true);
    questionInput.value = "";
    addMessage("Thinking...");

    chrome.runtime.sendMessage({ action: "getVideoInfo" }, (response) => {
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
          messageBoxDiv.removeChild(messageBoxDiv.lastChild); // Remove "Thinking..." message
          addMessage(data.answer);
        })
        .catch((error) => {
          console.error("Error:", error);
          messageBoxDiv.removeChild(messageBoxDiv.lastChild); // Remove "Thinking..." message
          addMessage(
            error.message ?? "An error occurred while processing your request."
          );
        });
    });
  });

  questionInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      submitButton.click();
    }
  });
  addMessage(
    "Hello! I'm here to help you with questions about the YouTube video you're watching. What would you like to know?"
  );
});
