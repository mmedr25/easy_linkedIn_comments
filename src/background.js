const generatePrePromptString = (prePrompts) => {
    if (!prePrompts.length) {
      return "";
    }
    const newPrePrompts = prePrompts.map((item) => {
      return item.trim().replace(/\.$/, "");
    });
    return newPrePrompts.join(".");
};
  
const generatePrompt = (prompt, prePrompts) => {
    const prePromptsString = generatePrePromptString(prePrompts);
    return `System:${prePromptsString} User:${prompt}`;
};




const makePreprompts = (customPrepromptArray, prompt) => {
    const prePrompts =  customPrepromptArray;
    
    const defaultPrePrompt = [
        `You are a helpful assistant.`,
        `You will reply to a linkedIn comment or post in a way that is friendly, helpful and funny never otherwise.`,
        `If the text looks encoded or corrupted, try to treat it as a emoji or a gif.`,
        `If an image is send to you use it for more context.`,
        `Don't make your responses too long.`,
    ];

    prePrompts.push(...defaultPrePrompt)

    if (prompt?.moreContext) {
        prePrompts.push(`
            This is some more context for the comment or post if you need it "${prompt?.moreContext}".
        `)
    }

    return prePrompts
}

const apiUrl = "http://localhost:11434";
const singleResponse = async (prompt) => {
    if (!prompt?.text) return null;

    const url = `${apiUrl}/api/generate`;

    const customPrePrompt = ["You are a developper."]
    const prePrompts = makePreprompts(customPrePrompt, prompt)

    let promptImage = {}

    if (prompt?.imgB64) {
        promptImage = {
            image: prompt.imgB64.split(',')[1], // Remove data URI prefix
        }
    }

    const {data} = await fetcher(url, {
        body: JSON.stringify({
            prompt: generatePrompt(prompt?.text, prePrompts),
            ...promptImage,
            model: "llama3.2-vision",
            stream: false,
            options: {
                max_tokens: 100,
                temperature: 0.7,
                top_p: 0.9
            }
        })
    });

    return data
};


let abortController; // Keep a reference to the current AbortController
const fetcher = async (url, options) => {
    // Abort any ongoing request before starting a new one
    if (abortController) {
        abortController.abort();
    }

    // Create a new AbortController
    abortController = new AbortController();

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            signal: abortController.signal,
            ...options,
        });
    
        return {
            error: null,
            data: await response.json(),
        }
        
    } catch (error) {
        console.error("Request Error:", error);
        return {
            error: error,
            data: null,
        }
    }

};


const multiResponse = async (prompt) => {
    const responses = [];
    
    for (let i = 0; i < 1; i++) {
      responses.push(singleResponse(prompt));
    }

    return await Promise.allSettled(responses);
};
  


const openConfigPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/config.html") });
}

chrome.browserAction.onClicked.addListener(() => {
    // Open the configuration page in a new tab
    console.log("sdfsa saffasd sfadfasdf")
    openConfigPage()
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        openConfigPage()
    } else if (details.reason === "update") {
      console.log("Extension updated to a new version.");
    }
});



// somehow can't use async await on the request hmmmm ????....
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ollama-request') {
        // Handle the specific message type
        multiResponse(message.payload.prompt)
            .then((data) => {
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keeps the message channel open for async response
    }

    if (message.type === 'abort-fetch') {
        // Abort the ongoing request if any
        if (abortController) {
            abortController.abort();
            sendResponse({ success: true, message: "Fetch aborted." });
        } else {
            sendResponse({ success: false, error: "No fetch request to abort." });
        }
        return true; // Keeps the message channel open for async response
        
    }
});
