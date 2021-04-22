import Dexie from "dexie";

export default async () => {
  // alert("first alert");
  // let dbNames = await Dexie.getDatabaseNames();

  // alert(JSON.stringify(dbNames));

  function getCurrentConversationId() {
    const result = window.location.href.match(
      /conversations\/(?<conversationId>.+)\?ctx=chat/
    );
    return result?.groups?.conversationId;
  }

  async function getDb() {
    let dbName = /skypexspaces-[\da-zA-Z]{8}-([\da-zA-Z]{4}-){3}[\da-zA-Z]{12}/.exec(
      (await Dexie.getDatabaseNames()).join(", ")
    )[0];

    return await new Dexie(dbName).open();
  }

  async function getConversation(conversationId) {
    return await teamsDb
      .table("conversations")
      .where("id")
      .equals(conversationId)
      .toArray()[0];
  }

  function createMention({ mri, name }) {
    return `<span data-itemprops="{&quot;mri&quot;:&quot;${mri}&quot;,&quot;mentionType&quot;:&quot;person&quot;,&quot;memberCount&quot;:0}" itemscope="" itemtype="http://schema.skype.com/Mention">${name}</span>`;
  }

  window.getConversationId = getConversationId;
  window.getDb = getDb;
  window.Dexie = Dexie;
};
