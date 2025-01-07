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
    commentBox: ".comments-comment-box--cr",
    replySectionText: ".comments-comment-item__main-content",
    replySection: ".comments-comment-entity",
    article: ".fie-impression-container",
    articleModal: "#artdeco-modal-outlet",
}
Object.freeze(LinkedInSelector)


function easyPopupCloseBtnOnClick (e) {
    const popup = this.closest(".easy-comment-popup")
    hidePopup(popup)
    abortFetchMessages()
}


function suggestionOnClick (commentField, suggestionText, popup, event) {
    setTextContent(commentField, suggestionText)
    hidePopup(popup)
}


const addSuggestions = (commentField, popup, result) => {
    const popupContent = popup.querySelector(".content");
    const firstResult = result?.data?.[0]
    const error = firstResult?.data?.error || firstResult?.error?.message
    
    removeStatusMessages(popup);

    if (!result?.success || error) {
        addErrorStatus(popupContent, error)
        return
    }

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
    popup
        .querySelector(".close-btn")
        .addEventListener("click", easyPopupCloseBtnOnClick)
}


const addLoadingStatus = (popup) => {
    const loadingNode = generateHtml(easyLoadingTemplate)
    popup.querySelector(".content").appendChild(loadingNode)
}

const addErrorStatus = (popupContent, error) => {
    popupContent.innerHTML = ""
        
    const errorNode = generateHtml(easyErrorTemplate)
    
    error && (errorNode.querySelector("p").innerText = error)

    popupContent.appendChild(errorNode)
}


const removeStatusMessages = (popup) => {
    popup
        ?.querySelectorAll(".easy-state-message-container")
        ?.forEach(element => element?.remove()) 
}


const setupPopup = async (popupParentNode, prompt) => {
    let popupNode = popupParentNode?.querySelector(".easy-comment-popup")
    let hasSuggestion = !!popupNode?.querySelector(".content .easy-suggestion")

    removeStatusMessages(popupNode)

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
    addLoadingStatus(popupNode)

    // add suggestions
    const commentField = popupParentNode?.querySelector(LinkedInSelector.commentField)
    const callback = addSuggestions.bind(this, commentField, popupNode)

    fetchMessages(prompt, callback)
}


async function imageToBase64(url) {
    if (!url) return null; 

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
    const replySection = this.closest(LinkedInSelector.replySection)
    const commentSection = this.closest(LinkedInSelector.article) || this.closest(LinkedInSelector.articleModal)

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

    const popupParent = this.closest(LinkedInSelector.commentBox)

    await setupPopup(popupParent, {
        text: commentSectionPrompText,
        imgB64: await imageToBase64(imageSrc),
    })
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
        { 
            type: 'ollama-request', 
            payload: {prompt} 
        },
        (response) => {
            if (response.success) {
                callback({data: response?.data, success: true})
            } else {
                callback({error: response?.error, success: false})
            }
        }
    );
}


const parseSuggestion = (suggestion) => {
    return suggestion.replace(/^\"(.*)\"$/, (_, middleContent) => {
        return middleContent;
    });
};


// observer configuration
const MutationObserverConfig = {
    childList: true,
    subtree: true,
};

// Start observing the target node
const observedNode = document.querySelector("body");
const observer = new MutationObserver(observerCallback);
observer.observe(observedNode, MutationObserverConfig);


window.addEventListener("beforeunload", () => {
    abortFetchMessages()
});