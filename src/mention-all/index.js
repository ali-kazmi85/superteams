import Dexie from "dexie";
//import hotkeys from "hotkeys-js";

function pasteHtmlAtCaret(html, selectPastedContent) {
  var sel, range;
  if (window.getSelection) {
    // IE9 and non-IE
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.deleteContents();

      // Range.createContextualFragment() would be useful here but is
      // only relatively recently standardized and is not supported in
      // some browsers (IE9, for one)
      var el = document.createElement("div");
      el.innerHTML = html;
      var frag = document.createDocumentFragment(),
        node,
        lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      var firstNode = frag.firstChild;
      range.insertNode(frag);

      // Preserve the selection
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        if (selectPastedContent) {
          range.setStartBefore(firstNode);
        } else {
          range.collapse(true);
        }
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  } else if ((sel = document.selection) && sel.type != "Control") {
    // IE < 9
    var originalRange = sel.createRange();
    originalRange.collapse(true);
    sel.createRange().pasteHTML(html);
    if (selectPastedContent) {
      range = sel.createRange();
      range.setEndPoint("StartToStart", originalRange);
      range.select();
    }
  }
}

(async () => {
  // alert("first alert");
  // let dbNames = await Dexie.getDatabaseNames();

  // alert(JSON.stringify(dbNames));

  let teamsDb;
  let accountId;

  // hotkeys("alt+a", async function () {
  //   try {
  //     console.log("hotkey running");
  //     const markup = await getMarkup();
  //     pasteHtmlAtCaret(markup, false);
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });

  function getCurrentConversationId() {
    const result = window.location.href.match(
      /conversations\/(?<conversationId>.+)\?ctx=chat/
    );
    return result?.groups?.conversationId;
  }

  async function getDb() {
    if (teamsDb) return teamsDb;
    const result = /skypexspaces-(?<mri>[\da-zA-Z]{8}-([\da-zA-Z]{4}-){3}[\da-zA-Z]{12})/.exec(
      (await Dexie.getDatabaseNames()).join(", ")
    );

    let dbName = result[0];
    accountId = result.groups.mri;
    teamsDb = await new Dexie(dbName).open();
    return teamsDb;
  }

  async function getConversation() {
    const teamsDb = await getDb();
    return (
      await teamsDb
        .table("conversations")
        .where("id")
        .equals(getCurrentConversationId())
        .toArray()
    )[0];
  }

  async function getMembers() {
    const conversation = await getConversation();
    return conversation?.members;
  }

  async function getMemberDetail(id) {
    const teamsDb = await getDb();
    return (await teamsDb.table("people").where("mri").equals(id).toArray())[0];
  }

  async function getMarkup() {
    const members = await getMembers();

    const mentions = [];
    for (const m of members) {
      if (m.id.indexOf(accountId) >= 0) continue;
      const memberDetail = await getMemberDetail(m.id);
      mentions.push(
        createMention({ mri: m.id, name: memberDetail.displayName })
      );
    }

    return mentions.join(", ");
  }

  function createMention({ mri, name }) {
    return `<span data-itemprops="{&quot;mri&quot;:&quot;${mri}&quot;,&quot;mentionType&quot;:&quot;person&quot;,&quot;memberCount&quot;:0}" itemscope="" itemtype="http://schema.skype.com/Mention">${name}</span>`;
  }

  function addMentionAllShortcut() {
    const editor = document.querySelector(".cke_wysiwyg_div");
    if (!editor.hasAttribute("data-hasmentionall")) {
      editor.setAttribute("data-hasmentionall", "true");
      editor.addEventListener("keyup", async (e) => {
        if (e.ctrlKey && e.altKey && e.code === "KeyA") {
          const composePlaceholder = document.querySelector(
            ".ts-text-watermark"
          );
          composePlaceholder.style.display = "none";
          const markup = await getMarkup();
          pasteHtmlAtCaret(markup, false);
          const composerParent = document.querySelector(".cke_contents");
          composerParent.style.height =
            Math.min(editor.firstChild.offsetHeight + 40, 149) + "px";
        }
      });
    }
  }

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
                addMentionAllShortcut();
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

    addMentionAllShortcut();
    initializeDOMChangeListener(observeTarget);
  }, 4000);

  window.getCurrentConversationId = getCurrentConversationId;
  window.getDb = getDb;
  window.Dexie = Dexie;
  window.getMarkup = getMarkup;
  window.pasteHtmlAtCaret = pasteHtmlAtCaret;
})();
