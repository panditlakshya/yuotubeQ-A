document.addEventListener("DOMContentLoaded", () => {
  // console.log("Popup DOM loaded");
  const questionInput = document.getElementById("question");
  const submitButton = document.getElementById("submit");
  // const answerDiv = document.getElementById("answer");
  const messageBoxDiv = document.getElementById("message-box");
  const credentialsContainer = document.getElementById("credentials-container");
  const chatbotContainer = document.getElementById("chatbot-container");
  const apiTokenInput = document.getElementById("apiToken");
  const saveButton = document.getElementById("saveButton");
  const removeApiTokenButton = document.getElementById("remove-api-token");
  const warningElement = document.getElementById("warning");

  function isYouTubeVideoPage(url) {
    // YouTube video URLs typically contain "youtube.com/watch"
    return url.includes("youtube.com/watch");
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      if (isYouTubeVideoPage(currentTab.url)) {
        chrome.storage.sync.get("gptApiToken", function (data) {
          if (data.gptApiToken) {
            showChatbot();
          } else {
            showCredentialsInput();
          }
        });
        warningElement.classList.add("hidden");
      } else {
        // credentialsContainer.classList.add("hidden");
        // chatbotContainer.classList.add("hidden");
        warningElement.classList.remove("hidden");
      }
    }
  });

  chrome.storage.sync.get("gptApiToken", function (data) {
    if (data.gptApiToken) {
      showChatbot();
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
          showChatbot();
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

  function showChatbot() {
    credentialsContainer.classList.add("hidden");
    chatbotContainer.classList.remove("hidden");
    // Initialize chatbot with apiToken if needed
  }

  function markdownToHtml(markdown) {
    // First, handle code blocks
    markdown = markdown.replace(/```([\s\S]*?)```/g, function (match, p1) {
      return (
        "<pre><code>" +
        p1.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
        "</code></pre>"
      );
    });

    // Convert headers
    markdown = markdown.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    markdown = markdown.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    markdown = markdown.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Convert bold
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic
    markdown = markdown.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert inline code (after handling code blocks)
    markdown = markdown.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Convert links
    markdown = markdown.replace(
      /\[([^\]]+)\]\(([^\)]+)\)/g,
      '<a href="$2">$1</a>'
    );

    // Convert line breaks
    markdown = markdown.replace(/\n/g, "<br>");

    return markdown;
  }

  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `mb-2 p-2 rounded ${
      isUser ? "bg-blue-100 text-right" : "bg-gray-200"
    }`;

    // Convert markdown to HTML
    const convertedHtml = markdownToHtml(content);
    console.log(convertedHtml, "convertedHtml");

    // Use a temporary div to parse the HTML string
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = convertedHtml;

    // Append all child nodes to the container
    while (tempDiv.firstChild) {
      messageDiv.appendChild(tempDiv.firstChild);
    }

    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("chat-message");
    messageWrapper.appendChild(messageDiv);

    messageBoxDiv.appendChild(messageWrapper);

    messageBoxDiv.scrollTop = messageBoxDiv.scrollHeight;
  }

  function sendEncryptedTokenToBackend(question, response) {
    chrome.storage.sync.get("gptApiToken", function (data) {
      if (data.gptApiToken) {
        fetch(config.API_URL, {
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
        // answerDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        messageBoxDiv.removeChild(messageBoxDiv.lastChild); // Remove "Thinking..." message
        addMessage("Please try reloading the youtube page.");
        return;
      }

      if (response.error) {
        console.error("Error in response:", response.error);
        // answerDiv.textContent = `Error: ${response.error}`;
        messageBoxDiv.removeChild(messageBoxDiv.lastChild); // Remove "Thinking..." message
        // addMessage(`Error: ${response.error}`);
        addMessage(
          "Extension only works for youtube videos. Please open a youtube video and try again."
        );
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
