# teams-reply-injector

This addon adds a reply button to messages in your chats on Desktop Teams.

If you have Node installed, you can simply run it via npx.

`npx superteams --enable reply mention-all recording-reminder`

This works by connecting to Teams over Chrome DevTools Protocol (https://chromedevtools.github.io/devtools-protocol/) and injecting a script which creates a MutationObserver to dynamically add a Reply link to all the message elements in the Chat window.

Supports windows, mac and linux.

Critical reviews along with pull requests are most welcome!
