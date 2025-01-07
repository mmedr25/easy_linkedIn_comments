// abort requests
let abortController = new AbortController();

// preprompts
const defaultPrePrompt = [
    `You are a helpful assistant.`,
    `You will reply to a linkedIn comment or post in a way that is friendly, helpful and funny never otherwise.`,
    `If the text looks encoded or corrupted, try to treat it as a emoji or a gif.`,
    `If an image is send to you use it for more context.`,
    `Don't make your responses too long.`,
];


const generatePrePromptString = (prePrompts) => {
    if (!prePrompts.length) return "";

    const newPrePrompts = prePrompts.map((item) => {
      return item.trim().replace(/\.$/, "");
    });

    return newPrePrompts.join(".");
};


const makePreprompts = (customPrepromptArray, prompt) => {
    const prePrompts =  customPrepromptArray;

    prePrompts.push(...defaultPrePrompt)

    if (prompt?.moreContext) {
        prePrompts.push(`
            This is some more context for the comment or post if you need it "${prompt?.moreContext}".
        `)
    }

    return prePrompts
}


const singleResponse = async (prompt) => {
    const config = getConfig()
    
    const apiUrl = config?.url || "http://localhost:11434";
    if (!prompt?.text) return null;

    const url = `${apiUrl}/api/generate`;
    const customPrePrompt = config?.prePrompts || []
    console.log("🚀 ~ singleResponse ~ customPrePrompt:", customPrePrompt)
    // const customPrePrompt = ["You are a developper."]
    const prePromptList = makePreprompts(customPrePrompt, prompt)
    let promptImage = {}

    if (prompt?.imgB64) {
        promptImage = {
            image: prompt.imgB64.split(',')[1], // Remove data URI prefix
        }
    }

    const {data, error} = await fetcher(url, {
        body: JSON.stringify({
            prompt: prompt.text,
            system: generatePrePromptString(prePromptList),
            ...promptImage,
            model: config?.model || "llama3.2-vision",
            stream: false,
            options: {
                max_tokens: 100,
                temperature: 0.7,
                top_p: 0.9
            }
        })
    });

    return {data, error}
};


const fetcher = async (url, options) => {
    
    if (abortController.signal.aborted) {
        console.log("Signal already aborted. Creating a new controller.");
        abortController = new AbortController(); // Create a fresh controller
    }

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
    const count = getConfig()?.count || 3

    for (let i = 0; i < count; i++) {
      responses.push(singleResponse(prompt));
    }


    return await Promise.all(responses);
};



const openConfigPage = () => {
    // chrome.tabs.create({ url: chrome.runtime.getURL("src/config.html") });
    browser.runtime.openOptionsPage();

}

chrome.browserAction.onClicked.addListener(() => {
    // Open the configuration page in a new tab
    openConfigPage()
});

chrome.runtime.onInstalled.addListener(async (details) => {
    openConfigPage()
    config = (await browser.storage.local.get("config"))?.config
});

let config

const getConfig = () => {
    return config 
}

browser.storage.onChanged.addListener((changes, areaName) => {
    console.log(`Changes in storage area: ${areaName}`);
  
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        let configValue = {...oldValue, ...newValue }
        
        if (!newValue) {
            configValue = {}
        }
        config = configValue
    }

});

// somehow can't use async await on the request hmmmm ????....
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ollama-request') {
        // Handle the specific message type
        multiResponse(message.payload.prompt)
            .then((response) => {

                // console.log("🚀 ~ .then ~ data:", response)
                // const error = response?.error || response?.data?.error
                // if (error) {
                //     sendResponse({ success: false, error: error })
                //     return
                // }

                // console.log("🚀 ~ .then ~ response.data:", response.data)
                sendResponse({ success: true, data: response })
            })
            .catch((error) => {
                sendResponse({ success: false, data: error.message })

 
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

        return true;
    }
});