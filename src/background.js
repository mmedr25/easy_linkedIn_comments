console.log("Background script loaded!");
// src/api/ollama.ts
var generatePrePromptString = (prePrompts) => {
    if (!prePrompts.length) {
      return "";
    }
    const newPrePrompts = prePrompts.map((item) => {
      return item.trim().replace(/\.$/, "");
    });
    return newPrePrompts.join(".");
};
  
var generatePrompt = (prompt, prePrompts) => {
    const prePromptsString = generatePrePromptString(prePrompts);
    return `System:${prePromptsString} User:${prompt}`;
};

let abortController; // Keep a reference to the current AbortController


var apiUrl = "http://localhost:11434";
var singleResponse = async (prompt) => {
    const url = `${apiUrl}/api/generate`;
    // const prompt = "je commence un nouveau projet";
    const prePrompts = ["You are a helpful assistant.", "you are a developper", "You will reply to a linkedIn comment in a way that is friendly, helpful and funny."];
    
     // Abort any ongoing request before starting a new one
     if (abortController) {
        abortController.abort();
    }

    // Create a new AbortController
    abortController = new AbortController();

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        signal: abortController.signal, // Attach the signal
        body: JSON.stringify({
            prompt: generatePrompt(prompt, prePrompts),
            model: "llama3.2-vision",
            stream: false,
            options: {
                max_tokens: 100,
                temperature: 0.7,
                top_p: 0.9
            }
        })
    });

    return await response?.json();
};
  
var multiResponse = async (prompt) => {
    const responses = [];
    
    for (let i = 0; i < 1; i++) {
      responses.push(singleResponse(prompt));
    }

    return await Promise.allSettled(responses);
  };
  

  
  
chrome.browserAction.onClicked.addListener(() => {
    // Open the configuration page in a new tab
    console.log("sdfsa saffasd sfadfasdf")
    chrome.tabs.create({ url: chrome.runtime.getURL("src/popup.html") });
});


  
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ollama-request') {
        // Handle the specific message type
        console.log("Message received:", message);
        multiResponse(message.payload.prompt)
            .then((data) => {
                console.log("data", data)
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("Error:", error);
                sendResponse({ success: false, error: error.message });
            });
        // Perform some asynchronous task

        return true; // Keeps the message channel open for async response
    }

    if (message.type === 'abort-fetch') {
        // Abort the ongoing request if any
        if (abortController) {
            abortController.abort();
            console.log("Fetch request aborted.");
            sendResponse({ success: true, message: "Fetch aborted." });
        } else {
            sendResponse({ success: false, error: "No fetch request to abort." });
        }
        return true; // Keeps the message channel open for async response
        
    }
});
