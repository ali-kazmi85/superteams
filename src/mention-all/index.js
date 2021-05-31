import Dexie from "dexie";

(async () => {
  let teamsDb;
  let accountId;

  function getCurrentConversationId() {
    const result = window.location.href.match(
      /conversations\/(?<conversationId>.+)\?ctx=chat/
    );
    return result?.groups?.conversationId;
  }

  async function getDb() {
    if (teamsDb) return teamsDb;
    const result =
      /skypexspaces-(?<mri>[\da-zA-Z]{8}-([\da-zA-Z]{4}-){3}[\da-zA-Z]{12})/.exec(
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

    const markup = mentions.join("&nbsp;") + "&nbsp;";

    return markup;
  }

  function createMention({ mri, name }) {
    return `<span data-itemprops="{&quot;mri&quot;:&quot;${mri}&quot;,&quot;mentionType&quot;:&quot;person&quot;,&quot;memberCount&quot;:0}" itemscope="" itemtype="http://schema.skype.com/Mention">${name}</span>`;
  }

  function hideMessageBanner() {
    var style = document.createElement("style");
    style.id = "hideMessageBannerCss";
    style.innerHTML = `
      .new-message-banner {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  function restoreMessageBanner() {
    const styleTag = document.head.querySelector("#hideMessageBannerCss");
    if (styleTag) styleTag.remove();
  }

  function addKeyDownEvent(editor) {
    if (!editor) editor = document.querySelector(".cke_wysiwyg_div");
    if (!editor) return;
    if (!editor.hasAttribute("data-hasmentionall")) {
      editor.setAttribute("data-hasmentionall", "true");
      editor.addEventListener("keydown", (e) => {
        if (e.code === "Enter" && !e.shiftKey) {
          const messageHtml = editor.innerHTML;
          editor.innerHTML = "";
          hideMessageBanner();
          setTimeout(async () => {
            const markup = await getMarkup();
            editor.innerHTML = messageHtml.replace(/(#all)\b/i, markup);
            document.getElementById("send-message-button").click();
            restoreMessageBanner();
          }, 0);
        }
      });
    }
  }

  function addMouseDownEvent(btnSend) {
    if (!btnSend) btnSend = document.getElementById("send-message-button");
    if (!btnSend) return;
    let editor =
      btnSend.offsetParent.offsetParent.querySelector(".cke_wysiwyg_div");
    if (!btnSend.hasAttribute("data-hasmentionall")) {
      btnSend.setAttribute("data-hasmentionall", "true");

      btnSend.addEventListener("pointerdown", (e) => {
        if (e.button === 0) {
          const messageHtml = editor.innerHTML;
          editor.innerHTML = "";
          hideMessageBanner();
          setTimeout(async () => {
            const markup = await getMarkup();
            editor.innerHTML = messageHtml.replace(/(#all)\b/i, markup);
            restoreMessageBanner();
          }, 0);
        }
      });
    }
  }

  function observeChanges(observeTarget) {
    const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
      characterDataOldValue: false,
      attributeOldValue: false,
    };

    const observer = new MutationObserver((mutations) => {
      mutations?.forEach((m) => {
        Array.from(m.addedNodes)
          ?.filter((n) => n.matches(".cke_wysiwyg_div"))
          .forEach((n) => {
            addKeyDownEvent(n);
          });
        Array.from(m.addedNodes)
          ?.filter((n) => n.matches("#send-message-button"))
          .forEach((n) => {
            addMouseDownEvent(n);
          });
      });
    });
    observer.observe(observeTarget, config);
  }

  addKeyDownEvent();
  addMouseDownEvent();
  observeChanges(document);
})();
