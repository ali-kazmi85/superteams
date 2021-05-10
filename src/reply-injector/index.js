(() => {
  function createElementFromHTML(htmlString) {
    var div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  function updateUrlParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf("?") !== -1 ? "&" : "?";
    if (uri.match(re)) {
      uri = uri.replace(re, "$1" + key + "=" + value + "$2");
    } else {
      uri = uri + separator + key + "=" + value;
    }
    return uri;
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

        if (threadBody) {
          if (threadBodyTopRow) {
            if (!threadBodyTopRow.hasAttribute("data-hasquote")) {
              const quoteMessageButton = document.createElement("button");
              quoteMessageButton.classList.add(
                "teams-custom-quote-message-button"
              );
              Object.assign(quoteMessageButton.style, quoteMessageButtonStyles);
              threadBodyTopRow.appendChild(quoteMessageButton);
              threadBodyTopRow.setAttribute("data-hasquote", "true");
              quoteMessageButton.addEventListener(
                "click",
                quoteMessageButtonClickHandler
              );
            }

            if (!threadBodyTopRow.hasAttribute("data-hasgoto")) {
              const replyQuote = threadBody.querySelector(
                "blockquote[itemtype='http://schema.skype.com/Reply']"
              );

              if (replyQuote && replyQuote.hasAttribute("itemid")) {
                replyQuote.addEventListener("click", (event) => {
                  const messageId = event.currentTarget.getAttribute("itemid");
                  const resetUrl = updateUrlParameter(
                    window.location.href,
                    "messageId",
                    ""
                  );
                  const messageUrl = updateUrlParameter(
                    window.location.href,
                    "messageId",
                    messageId
                  );
                  window.location.href = resetUrl;
                  window.location.href = messageUrl;
                });
                threadBodyTopRow.setAttribute("data-hasgoto", "true");
              }
            }
          }
        }
      });
    }
  }

  function extractMri(str) {
    let findGuid = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;
    let results = findGuid.exec(str);

    if (results != null) return str.substr(0, results.index) + results[0];
    else return null;
  }

  function quoteMessageButtonClickHandler(event) {
    removeActiveQuote();
    const messageContentNodeClone = event.target.offsetParent
      .querySelector('[data-tid="messageBodyContent"]')
      .cloneNode(true);
    const quote = messageContentNodeClone.querySelector(
      "blockquote[itemtype='http://schema.skype.com/Reply']"
    );

    if (quote) quote.remove();

    const messageText = messageContentNodeClone.innerText;
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
    const mri = extractMri(
      event.target.offsetParent.offsetParent.offsetParent.offsetParent
        .offsetParent.dataset.scrollId
    );

    const quoteEl = createElementFromHTML(`
        <blockquote itemscope itemtype="http://schema.skype.com/Reply" itemid="${messageId}">
          <strong itemprop="mri" itemid="${mri}">${messageSenderName}</strong>
          <span itemprop="time" itemid="${messageId}"></span>
          <p itemprop="preview">
            ${messageText}
          </p>
        </blockquote>
      `);
    quoteEl.addEventListener("click", () => {
      removeActiveQuote();
    });
    const composeTextarea = document.querySelector(".cke_wysiwyg_div");
    const composePlaceholder = document.querySelector(".ts-text-watermark");
    composePlaceholder.style.display = "none";
    composeTextarea.insertBefore(quoteEl, composeTextarea.firstChild);

    const composerParent = document.querySelector(".cke_contents");
    composerParent.style.height = quoteEl.offsetHeight + 40 + "px";
  }

  function removeActiveQuote() {
    const activeQuote = document
      .querySelector(".cke_wysiwyg_div")
      .querySelector("blockquote");
    if (activeQuote) {
      activeQuote.remove();
    }

    if (!document.querySelector(".cke_wysiwyg_div").innerText.trim()) {
      const compose = document.querySelector(".cke_wysiwyg_div");
      const composeParent = document.querySelector(".cke_contents");
      const composePlaceholder = document.querySelector(".ts-text-watermark");

      compose.innerHTML = "<div> <br> </div>";
      composePlaceholder.style.display = "block";
      composeParent.style.height = "33px";
    }
  }

  function appendCustomStyles() {
    const head = document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    const declarations = document.createTextNode(`
      .teams-custom-quote-message-button { height: 16px; width: 16px; opacity: 0.3; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAFo9M/3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGlSURBVChTnZOxSwJRHMfvpogwaAgaogNFCM+93LolG9qabhCCECeHJhe3hrZaHHNwTHD1D7ghx5YjBIMLRUIHl/OSjvO9vr93Ty/xiugDX97v+/v93k/fe5yyhHOeoiV0QIV4NpsNXSaTQQc/CB2A2ZVhDKheQE/SKkqhUGCqqjKENOdQJBE80jqdTgORIJDMQ01pI5C8TKVSYsRC9XodaX5EdQHMfqlUomQT2oZuarUa63Q60dHiQOOGDP8AY8yT4TqDweAzn6dD8FOZinAch866PIGu6ywIgleqCXzff8MiiosbI00mExdryHw+78qfUKFjbHpPJBLkDdmCLZw/y1AAfwV1pY0HDXcyXAWFE5og7d/BpvPxeDyrVCoM8frD/gSazX6/76fTaXEDyWSSNxoN1mq1eK/Xo2Ev0DW0Ge74BpJOuVxe3vNvMgyDjUajD+w5g49AQqPHKRaL4h1yuRz3PI+5rsuGwyG3LItVq1WuaZoYZJom/SsLos8nAok9vJndbrdj7wC5Lejetm0aSD0PsrQKCjuQLm0sqN9CM2n/i6J8AYR+NYM1RnyMAAAAAElFTkSuQmCC') !important; background-size: 16px 16px !important; }
      .teams-custom-quote-message-button:hover { opacity: 1; }
      .ts-message-thread-body .message-body-top-row .top-row-text-container { justify-content: space-between; }
      blockquote[itemtype='http://schema.skype.com/Reply'] { cursor: pointer; }
      .cke_wysiwyg_div blockquote[itemtype='http://schema.skype.com/Reply'] { cursor: default; pointer-events: none; }
      .cke_wysiwyg_div blockquote[itemtype='http://schema.skype.com/Reply']:before { content: 'x'; font-weight: bold; pointer-events: all; cursor: pointer; position: absolute; right: 20px; top: 10px; }
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
    "border-radius": "2px",
    outline: "none",
    border: "none",
    cursor: "pointer",
    background: "transparent",
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
