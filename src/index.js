
  






const easyButtonTemplate = `
    <div class="easy-comment-btn-container">
        <button type="button" class="easy-comment-btn">
            easy button
        </button>
    </div>
`;

const easySuggestionTemplate = `
    <p class="easy-suggestion">
        {suggestion}
    </p>
`;

const easyResultTemplate = `
    <div class="easy-comment-popup">
        
        <div class="header">
            <p>suggestions</p>
            <button title="close" class="close-btn">
                <img alt="close button" width="24" height="24"/>
            </button>
        </div>
        <div class="content">
        </div>
    </div>
`;

const generateHtml = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.firstChild;
};

const setTextContent = (element, newText) => {
    // remove the existing node
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.remove();
        }
    }
    
    // No existing text node, create a new one
    element.append(document.createTextNode(newText));
}

const hideResult = (element) => {
    element.style.display = "none"
}
const showResult = (element) => {
    element.style.display = "block"
}

const abortFetchMessages = () => {
    chrome.runtime.sendMessage({ type: 'abort-fetch' }, (response) => {
        if (response.success) {
            console.log("Fetch aborted:", response.message);
        } else {
            console.error("Error aborting fetch:", response.error);
        }
    });
}

const fetchMessages = (prompt, callback) => {
    chrome.runtime.sendMessage(
        { type: 'ollama-request', payload: {prompt} },
        (response) => {
            if (response.success) {
                callback({data: response?.data, success: true})
            } else {
                callback({success: false})
            }
        }
    );

}

window.addEventListener("beforeunload", () => {
    abortFetchMessages()
});

function easyPopupCloseBtnOnClick (e) {
    const parentNode = this.closest(".easy-comment-popup")
    hideResult(parentNode)
    abortFetchMessages()
}

const addSuggestionsCallback = (commentField, resultSection, result) => {
    if (!result.success) {
        console.error("coudn't fetch messages");
        return
    }
    result?.data?.forEach(data => {
        let textSuggestion = data?.value?.response;

        if (!textSuggestion) return;

        textSuggestion = textSuggestion.slice(1, -1)

        const suggestionHtml = generateHtml(easySuggestionTemplate) 

        suggestionHtml.innerText = textSuggestion

        suggestionHtml.addEventListener("click", () => {
            setTextContent(commentField, textSuggestion)
            hideResult(resultSection)
        })

        resultSection?.querySelector(".content").appendChild(suggestionHtml)

    });
}

function easyButtonOnClickHandler(e) {
    const replySection = this.closest(".comments-comment-entity")    
    let resultSection = replySection?.querySelector(".easy-comment-popup")
    const hasSuggestion = !!resultSection?.querySelector(".content .easy-suggestion")
    
    if (hasSuggestion) {
        showResult(resultSection)
        return
    }
    resultSection = generateHtml(easyResultTemplate)
    const closeButton = resultSection.querySelector(".close-btn")
        
    closeButton.addEventListener("click", easyPopupCloseBtnOnClick)
    closeButton.querySelector("img").src = chrome.runtime.getURL('assets/icons/x.svg');
    console.log("closeButton img", closeButton.querySelector("img"))
    replySection?.appendChild(resultSection)

    const commentField = replySection?.querySelector(".ql-editor p")
    const prompText = replySection?.querySelector(".comments-comment-item__main-content")?.innerText
    
    const callback = addSuggestionsCallback.bind(this, commentField, resultSection)

    fetchMessages(prompText, callback)
//     this.closest(".fie-impression-container")

}


const observerCallback = (_, __) => {
    const commentSections = document.getElementsByClassName("comments-comment-box--cr")

    for (const commentSection of commentSections) {
        if (!commentSection.getElementsByClassName("easy-comment-btn-container").length) {
            const easyButtonContainer = generateHtml(easyButtonTemplate)
            
            easyButtonContainer
                .getElementsByTagName("button")[0]
                .addEventListener("click", easyButtonOnClickHandler)
            
            commentSection.appendChild(easyButtonContainer)
        }
    }
};


// observer configuration
const MutationObserverConfig = {
    attributes: false,
    childList: true,
    subtree: true,
};
// Start observing the target node
const observedNode = document.querySelector("main");
const observer = new MutationObserver(observerCallback);
observer.observe(observedNode, MutationObserverConfig);