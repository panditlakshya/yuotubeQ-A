document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup DOM loaded");
  const questionInput = document.getElementById("question");
  const submitButton = document.getElementById("submit");
  const answerDiv = document.getElementById("answer");
  const messageBoxDiv = document.getElementById("message-box");
  const credentialsContainer = document.getElementById("credentials-container");
  const chatbotContainer = document.getElementById("chatbot-container");
  const apiTokenInput = document.getElementById("apiToken");
  const saveButton = document.getElementById("saveButton");
  const removeApiTokenButton = document.getElementById("remove-api-token");

  chrome.storage.sync.get("gptApiToken", function (data) {
    if (data.gptApiToken) {
      showChatbot(data.gptApiToken);
    } else {
      showCredentialsInput();
    }
  });

  saveButton.addEventListener("click", async function () {
    const apiToken = apiTokenInput.value;
    if (apiToken) {
      try {
        const encryptedToken = await encryptApiToken(apiToken);

        chrome.storage.sync.set({ gptApiToken: encryptedToken }, function () {
          console.log("API token saved");
          showChatbot(apiToken);
        });
      } catch (error) {
        console.error("Encryption failed:", error);
        alert("Failed to encrypt and save API token");
      }
    } else {
      alert("Please enter a valid API token");
    }
  });

  removeApiTokenButton.addEventListener("click", function () {
    chrome.storage.sync.remove("gptApiToken", function () {
      console.log("API token cleared");
      showCredentialsInput();
      apiTokenInput.value = "";
    });
  });

  function showCredentialsInput() {
    credentialsContainer.classList.remove("hidden");
    chatbotContainer.classList.add("hidden");
  }

  function showChatbot(apiToken) {
    credentialsContainer.classList.add("hidden");
    chatbotContainer.classList.remove("hidden");
    // Initialize chatbot with apiToken if needed
  }

  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `mb-2 p-2 rounded ${
      isUser ? "bg-blue-100 text-right" : "bg-gray-200"
    }`;
    messageDiv.textContent = content;
    messageBoxDiv.appendChild(messageDiv);
    messageBoxDiv.scrollTop = messageBoxDiv.scrollHeight;
  }

  function sendEncryptedTokenToBackend(question, response) {
    chrome.storage.sync.get("gptApiToken", function (data) {
      if (data.gptApiToken) {
        fetch("http://localhost:3000/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            transcript: response,
            token: data.gptApiToken,
          }),
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
              error.message ??
                "An error occurred while processing your request."
            );
          });
      } else {
        console.error("No encrypted token found");
      }
    });
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

      sendEncryptedTokenToBackend(question, response);
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
