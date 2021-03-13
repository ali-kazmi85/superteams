(() => {
  function updateUrlParameter(uri, key, value) {
    // remove the hash part before operating on the uri
    // var i = uri.indexOf('#');
    // var hash = i === -1 ? ''  : uri.substr(i);
    //      uri = i === -1 ? uri : uri.substr(0, i);

    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf("?") !== -1 ? "&" : "?";
    if (uri.match(re)) {
      uri = uri.replace(re, "$1" + key + "=" + value + "$2");
    } else {
      uri = uri + separator + key + "=" + value;
    }
    return uri; //+ hash;  // finally append the hash as well
  }

  function addQuoteMessage() {
    const threadBodyMediaList = document.querySelectorAll(
      '[data-tid="threadBodyMedia"]'
    );

    if (threadBodyMediaList) {
      threadBodyMediaList.forEach((threadBody) => {
        const threadBodyTopRow = threadBody.querySelector(
          ".top-row-text-container"
        );

        if (threadBody && !threadBodyTopRow.hasAttribute("data-hasquote")) {
          if (threadBodyTopRow) {
            const quoteMessageButton = document.createElement("button");
            quoteMessageButton.classList.add(
              "teams-custom-quote-message-button"
            );
            quoteMessageButton.innerText = "Reply";
            Object.assign(quoteMessageButton.style, quoteMessageButtonStyles);
            threadBodyTopRow.appendChild(quoteMessageButton);
            threadBodyTopRow.setAttribute("data-hasquote", "true");
            quoteMessageButton.addEventListener(
              "click",
              quoteMessageButtonClickHandler
            );
          }
        }
      });
    }
  }

  function quoteMessageButtonClickHandler(event) {
    if (!composeHasActiveQuoteMessage()) {
      const messageText = event.target.offsetParent.querySelector(
        '[data-tid="messageBodyContent"]'
      ).innerText;
      const messageSenderName = event.target.offsetParent.querySelector(
        '[data-tid="threadBodyDisplayName"]'
      ).innerText;
      const messageId = event.target.offsetParent.offsetParent.offsetParent
        .querySelector('[data-tid="threadBodyMedia"]')
        .id.substr(1);
      const messageUrl = updateUrlParameter(
        window.location.href,
        "messageId",
        messageId
      );

      const blockquote = document.createElement("blockquote");
      blockquote.setAttribute("itemtype", "http://schema.skype.com/Reply");

      const topRowParagraph = document.createElement("p");
      blockquote.appendChild(topRowParagraph);

      const topRowParagraphBreak = document.createElement("b");
      topRowParagraphBreak.style.display = "flex";
      topRowParagraphBreak.style.justifyContent = "space-between";
      topRowParagraph.appendChild(topRowParagraphBreak);

      const wrapper = document.createElement("span");
      const nameSpan = document.createElement("span");
      const closeSpan = document.createElement("span");
      wrapper.style.fontSize = "small";
      nameSpan.innerText = messageSenderName.trim();
      closeSpan.style.cursor = "pointer";
      closeSpan.classList.add("teams-custom-quote-message-close");
      closeSpan.addEventListener("click", replyMessageClickHandler);
      const messageLink = document.createElement("a");
      messageLink.href = messageUrl;
      messageLink.title = "Go to original message";
      messageLink.innerText = "💬";
      messageLink.classList.add("teams-custom-quote-message-link");

      wrapper.appendChild(nameSpan);
      wrapper.appendChild(messageLink);
      topRowParagraphBreak.appendChild(wrapper);
      topRowParagraphBreak.appendChild(closeSpan);

      const textPreviewParagraph = document.createElement("p");
      textPreviewParagraph.innerText = messageText;
      blockquote.appendChild(textPreviewParagraph);

      const mainQuoteDiv = document.createElement("div");
      mainQuoteDiv.appendChild(blockquote);

      const composeTextarea = document.querySelector(".cke_wysiwyg_div");
      const composePlaceholder = document.querySelector(".ts-text-watermark");
      composePlaceholder.style.display = "none";
      composeTextarea.insertBefore(mainQuoteDiv, composeTextarea.firstChild);

      const composerParent = document.querySelector(".cke_contents");
      composerParent.style.height = blockquote.offsetHeight + 40 + "px";
    }
  }

  function replyMessageClickHandler() {
    const compose = document.querySelector(".cke_wysiwyg_div");
    const composeParent = document.querySelector(".cke_contents");
    const composePlaceholder = document.querySelector(".ts-text-watermark");

    compose.innerHTML = "<div> <br> </div>";
    composePlaceholder.style.display = "block";
    composeParent.style.height = "33px";
  }

  function composeHasActiveQuoteMessage() {
    return document
      .querySelector(".cke_wysiwyg_div")
      .querySelector("blockquote");
  }

  function appendCustomStyles() {
    const head = document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    const declarations = document.createTextNode(`
      .teams-custom-quote-message-button:hover { color: #a2c0f5 !important; }
      .ts-message-thread-body .message-body-top-row .top-row-text-container { justify-content: space-between; }
      .teams-custom-quote-message-close:hover { opacity: .5 !important; }
      .cke_wysiwyg_div .teams-custom-quote-message-close:before { content: 'x'; }
      .cke_wysiwyg_div .teams-custom-quote-message-link { display: none; }
    `);

    style.type = "text/css";

    if (style.styleSheet) {
      style.styleSheet.cssText = declarations.nodeValue;
    } else {
      style.appendChild(declarations);
    }

    head.appendChild(style);
  }

  const quoteMessageButtonStyles = {
    margin: "0 0 0 2em",
    padding: "0",
    background: "transparent",
    outline: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "cornflowerblue",
    textDecoration: "underline",
  };

  function initializeDOMChangeListener(observeTarget) {
    const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
      characterDataOldValue: false,
      attributeOldValue: false,
    };

    const mutationObserverCallback = function (mutations, observer) {
      if (mutations) {
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes) {
            for (let x = 0; x < mutations[i].addedNodes.length; x++) {
              if (
                mutations[i].addedNodes[x].classList &&
                mutations[i].addedNodes[x].classList.contains("thread-body")
              ) {
                addQuoteMessage();
              }
            }
          }
        }
      }
    };

    const observer = new MutationObserver(mutationObserverCallback);
    observer.observe(observeTarget, config);
    console.log("DOM Mutation Observer init");
  }

  setTimeout(() => {
    const observeTarget = document;

    appendCustomStyles();
    addQuoteMessage();
    initializeDOMChangeListener(observeTarget);
  }, 4000);
})();
