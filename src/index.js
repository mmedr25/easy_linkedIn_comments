const easyButtonTemplate = `
    <div class="easy-comment-btn-container">
        <button type="button" class="easy-comment-btn">
            easy button
        </button>
    </div>
`;

const easySuggestionTemplate = `
    <p class="easy-suggestion"></p>
`;

const easyResultTemplate = `
    <div class="easy-comment-popup">
        
        <div class="header">
            <p>suggestions</p>
            <button title="close" class="close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
        <div class="content"></div>
    </div>
`;

const loadingIcon = `
    <svg class="loading-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
`

const easyLoadingTemplate = `
    <div class="easy-state-message-container" title="loading suggestions">
        ${loadingIcon}
    </div>
`
const easyErrorTemplate = `
    <div class="easy-state-message-container" title="error">
        <p>Opps! an error occured</p>
    </div>
`

// please use query selector for linkedin class, ...
const LinkedInSelector = {
    commentField: ".ql-editor p",
    commentSectionText: ".update-components-text",
    commentSectionImg: ".ivm-image-view-model img",
    replySectionText: ".comments-comment-item__main-content",
    commentBox: ".comments-comment-box--cr",
    mainContainer: "main",
}
Object.freeze(LinkedInSelector)


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

const hidePopup = (element) => {
    element.classList.add("hide")
}
const showPopup = (element) => {
    element.classList.remove("hide")
}

const abortFetchMessages = () => {
    chrome.runtime.sendMessage({ type: 'abort-fetch' });
}

const fetchMessages = (prompt, callback) => {
    chrome.runtime.sendMessage(
        { type: 'ollama-request', payload: {prompt} },
        (response) => {
            if (response.success) {
                callback({data: response?.data, success: true})
            } else {
                callback({error: response?.error, success: false})
            }
        }
    );

}

window.addEventListener("beforeunload", () => {
    abortFetchMessages()
});

function easyPopupCloseBtnOnClick (e) {
    const popup = this.closest(".easy-comment-popup")
    hidePopup(popup)
    abortFetchMessages()
}

const parseSuggestion = (suggestion) => {
    return suggestion.replace(/^\"(.*)\"$/, (_, middleContent) => {
        return middleContent;
    });
};

function suggestionOnClick (commentField, suggestionText, popup, event) {
    setTextContent(commentField, suggestionText)
    hidePopup(popup)
}



const addSuggestions = (commentField, popup, result) => {

    removeLoading(popup);
    const popupContent = popup.querySelector(".content");
    
    const error = result?.data[0]?.data?.error || result?.data[0]?.error?.message
    // const hasError = 

    if (!result?.success || error) {
        popupContent.innerHTML = ""
        
        // console.error("coudn't fetch messages", result.error);
        const errorNode = generateHtml(easyErrorTemplate)
        
        error && (errorNode.querySelector("p").innerText = error)

        popupContent.appendChild(errorNode)
        return
    }

    console.log("🚀 ~ addSuggestions ~ result?.data:", result?.data)
    result?.data?.forEach(item => {
        let suggestionText = item?.data?.response;

        if (!suggestionText) return;

        suggestionText = parseSuggestion(suggestionText)

        const suggestionNode = generateHtml(easySuggestionTemplate) 

        suggestionNode.innerText = suggestionText
        
        const eventHandler = suggestionOnClick.bind(this, commentField, suggestionText, popup)
        suggestionNode.addEventListener("click", eventHandler)

        popupContent.appendChild(suggestionNode)

    });
}

const setupPopupCloseBtn = (popup) => {
    const closeButton = popup.querySelector(".close-btn")

    closeButton.addEventListener("click", easyPopupCloseBtnOnClick)
    // closeButton.querySelector("img").src = chrome.runtime.getURL('assets/icons/x.svg');
}

const addLoading = (popup) => {
    const loadingNode = generateHtml(easyLoadingTemplate)
    popup.querySelector(".content").appendChild(loadingNode)
}

const removeLoading = (element) => {

    element?.querySelectorAll(".easy-state-message-container")?.forEach(element => element?.remove()) 

}

const setupPopup = async (popupParentNode, prompt) => {
    let popupNode = popupParentNode?.querySelector(".easy-comment-popup")
    let hasSuggestion = !!popupNode?.querySelector(".content .easy-suggestion")

    removeLoading(popupNode)
    

    if (hasSuggestion) {
        showPopup(popupNode)
        return
    }

    // there are no suggestions, create a new one
    // there might be a popup already open or create it
    if (!popupNode) {
        popupNode = generateHtml(easyResultTemplate)
        setupPopupCloseBtn(popupNode)
        popupParentNode?.appendChild(popupNode)
    } else {
        showPopup(popupNode)
    }

    // loading indicator because no suggestions and we are about to get some
    addLoading(popupNode)

    // add suggestions
    const commentField = popupParentNode?.querySelector(LinkedInSelector.commentField)
    const callback = addSuggestions.bind(this, commentField, popupNode)

    fetchMessages(prompt, callback)
}


async function imageToBase64(url) {
    if (!url) {
        return null;
    }
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

async function easyButtonOnClickHandler(e) {
    const replySection = this.closest(".comments-comment-entity")
    const commentSection = this.closest(".fie-impression-container")

    // if there is a popup and it is opened return
    const currentSection = replySection || commentSection // reply should be first
    const popup = currentSection?.querySelector(".easy-popup-container")
    const isPopupHidden = popup?.classList.contains("hide")
    if (popup && !isPopupHidden) return;

    const commentSectionPrompText = commentSection
        ?.querySelector(LinkedInSelector.commentSectionText)
        ?.innerText

    const imageSrc = commentSection?.querySelector(LinkedInSelector.commentSectionImg)?.src

    // check if it is a reply first. Do not change the order of the if statements
    if (replySection) {
        const prompText = replySection.querySelector(LinkedInSelector.replySectionText)?.innerText

        await setupPopup(replySection, {
            text: prompText,
            moreContext: commentSectionPrompText,
            imgB64: await imageToBase64(imageSrc),
        })
        
        return
    }


    if (commentSection) {
        const popupParent = commentSection.querySelector(LinkedInSelector.commentBox)
        
        await setupPopup(popupParent, {
            text: commentSectionPrompText,
            imgB64: await imageToBase64(imageSrc),
        })
        
        return
    }

}


const observerCallback = (_, __) => {
    const commentSections = document.querySelectorAll(LinkedInSelector.commentBox)

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
    childList: true,
    subtree: true,
};
// Start observing the target node
const observedNode = document.querySelector(LinkedInSelector.mainContainer);
const observer = new MutationObserver(observerCallback);
observer.observe(observedNode, MutationObserverConfig);