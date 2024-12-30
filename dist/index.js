// src/index.ts
var selectLinkedInReplyButtons = () => document.querySelectorAll("main .comments-comment-social-bar__action-group--cr");
var linkedInReplyButtons = selectLinkedInReplyButtons();
var setLinkedInReplyButtons = () => {
  linkedInReplyButtons = selectLinkedInReplyButtons();
};
var getLinkedInReplyButtons = () => {
  return linkedInReplyButtons;
};
var template = `
  <button type="button" class="easy-comment-button">
    easy button
  </button>
`;
var templateResult = `
  <div class="easy-comment-popup">
    <p>Title haha</p>
    <div>
      <p>Content</p>
      posted by:
    </div>
  </div>
`;
var generateTemplate = (htmlString) => {
  const parser = new DOMParser;
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.firstChild;
};
function easyButtonClickEventHandler(e) {
  this.closest(".comments-comment-social-bar--cr")?.appendChild(generateTemplate(templateResult));
}
function linkedInReplyButtonClickHandler(e) {
  const previousEasyButton = document.querySelector(".easy-comment-button");
  if (previousEasyButton) {
    previousEasyButton.remove();
  }
  const easyButton = generateTemplate(template);
  easyButton?.addEventListener("click", easyButtonClickEventHandler);
  this.closest(".comments-comment-social-bar--cr")?.appendChild(easyButton);
}
var feedObserverHandler = (_, __) => {
  setLinkedInReplyButtons();
  const elements = getLinkedInReplyButtons();
  try {
    elements?.forEach((element) => {
      element.removeEventListener("click", linkedInReplyButtonClickHandler);
      element.addEventListener("click", linkedInReplyButtonClickHandler);
    });
  } catch (error) {
    console.error("error ele", error);
  }
};
var feedsObserverConfig = {
  childList: true,
  subtree: true
};
var feedsObserver = new MutationObserver(feedObserverHandler);
var feedsNode = document.getElementsByTagName("main")[0];
setTimeout(() => {
  feedsObserver.observe(feedsNode, feedsObserverConfig);
}, 300);
