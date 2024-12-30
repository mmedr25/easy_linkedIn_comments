// this is a test to be removed in production
// document.body.style.border = "8px solid green";

const selectLinkedInReplyButtons = () => document.querySelectorAll("main .comments-comment-social-bar__action-group--cr")
let linkedInReplyButtons = selectLinkedInReplyButtons()


const setLinkedInReplyButtons = () => {
    linkedInReplyButtons = selectLinkedInReplyButtons()
}

const getLinkedInReplyButtons = () => {
    return linkedInReplyButtons
}


const template = `
  <button type="button" class="easy-comment-button">
    easy button
  </button>
`;

const templateResult = `
  <div class="easy-comment-popup">
    <p>Title haha</p>
    <div>
      <p>Content</p>
      posted by:
    </div>
  </div>
`;



const closeEasyCommentPopup = (e?: Event) => {
    if (e) {
        const easyCommentPopup = e.target.querySelector(".easy-comment-popup")
    }
    const easyCommentPopup = document.querySelector(".easy-comment-popup")
    easyCommentPopup?.remove()
}


const generateTemplate = (htmlString: string) => {
    // Parse the string into a DOM Document
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

// Extract the content and append it
    return doc.body.firstChild as ChildNode;
}

function easyButtonClickEventHandler(e: Event) {
    // console.log("easy button clicked", generateTemplate(templateResult))
    this
        .closest(".comments-comment-social-bar--cr")
        ?.appendChild(generateTemplate(templateResult))
}

function linkedInReplyButtonClickHandler(e: Event) {
    
    const previousEasyButton = document.querySelector(".easy-comment-button")
    if (previousEasyButton) {
        previousEasyButton.remove()
    }

    const easyButton = generateTemplate(template)

    easyButton?.addEventListener("click", easyButtonClickEventHandler)
    
    this
        .closest(".comments-comment-social-bar--cr")
        ?.appendChild(easyButton)
}

// Callback function to execute when mutations are observed
const feedObserverHandler: MutationCallback = (_, __) => {
    setLinkedInReplyButtons()
    
    const elements = getLinkedInReplyButtons()


    try {
        elements?.forEach(element => {
            // removes the event if it has already been registered
            // this prevents elements triggering thesame events multiple times on a single trigger
            element.removeEventListener("click", linkedInReplyButtonClickHandler)
            element.addEventListener("click", linkedInReplyButtonClickHandler)
        })
        
    } catch (error) {
        console.error("error ele", error)
    }
    // for (const mutation of mutationList) {
    //     if (mutation.type === "childList") {
    //         console.count("childList added or removed.");
    //     }
    //     if (mutation.type === "subtree") {
    //         console.count("subtree added or removed.");
    //     } 
    // }
};


// Options for the observer (which mutations to observe)
const feedsObserverConfig = {
    // attributes: true, 
    childList: true,
    subtree: true 
};

// Create an observer instance linked to the callback function
const feedsObserver = new MutationObserver(feedObserverHandler);

// Select the node that will be observed for mutations
const feedsNode = document.getElementsByTagName("main")[0];

// Start observing the target node for configured mutations
setTimeout(() => {
    feedsObserver.observe(feedsNode, feedsObserverConfig);
}, 300)
