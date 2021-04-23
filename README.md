# superteams

This tool extends microsoft teams with additional capabilities

- Reply to a message
- Reminder to record meetings
- Press `Ctrl-Alt-A` while typing a message to automatically mention everybody

If you have Node installed, you can simply run it via npx.

`npx superteams --enable reply mention-all recording-reminder`

If you want to disable an extension just omit the name from the command above.

This works by connecting to Teams over Chrome DevTools Protocol (https://chromedevtools.github.io/devtools-protocol/) and injecting a script which creates a MutationObserver to dynamically add a Reply link to all the message elements in the Chat window.

Supports windows, mac and linux.

Critical reviews along with pull requests are most welcome!
