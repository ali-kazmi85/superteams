#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const getPort = require("get-port");
const CDP = require("chrome-remote-interface");
const { program } = require("commander");

program.option("-e, --enable <flags...>", "enable experimental features");

program.parse(process.argv);
const options = program.opts();

let port, nodePort, chatClient;

const replyScript = fs.readFileSync(
  path.join(__dirname, "extensions", "reply-injector", "index.js"),
  {
    encoding: "utf-8",
  }
);

const recordingReminderScript = fs.readFileSync(
  path.join(__dirname, "extensions", "recording-reminder", "index.js"),
  {
    encoding: "utf-8",
  }
);

const mentionAllScript = fs.readFileSync(
  path.join(__dirname, "extensions", "mention-all", "index.js"),
  {
    encoding: "utf-8",
  }
);

async function sleep(durationMs) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), durationMs);
  });
}

async function findChatWindow() {
  let windowFound = false;

  while (!windowFound) {
    let response;
    try {
      response = await CDP.List({ host: "localhost", port });
    } catch {}

    if (response) {
      console.log({ response });
      for (const win of response) {
        if (win.url.indexOf("/conversations/") >= 0) {
          console.log("window found");
          return win;
        }
      }
    }

    console.log("windows not found. waiting...");
    await sleep(5000);
  }
}

function createEvalExpression(expression) {
  return {
    allowUnsafeEvalBlockedByCSP: false,
    awaitPromise: false,
    expression,
    generatePreview: true,
    includeCommandLineAPI: true,
    objectGroup: "console",
    replMode: true,
    returnByValue: false,
    silent: false,
    userGesture: true,
  };
}

async function runProcess(cmdString, workingDirectory) {
  return new Promise((resolve, reject) => {
    let opts = {};
    if (workingDirectory) {
      opts = { cwd: workingDirectory };
    }
    exec(cmdString, opts, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function ensureWindowsProcess() {
  //kill existing process
  try {
    await runProcess("taskkill /f /im Teams.exe");
  } catch {}

  //get teams path
  const teamsPath = path.join(
    process.env.LOCALAPPDATA,
    "Microsoft",
    "Teams",
    "current",
    "Teams.exe"
  );

  //launch process
  const cmd = `${teamsPath} --inspect=${nodePort} --remote-debugging-port=${port}`;
  console.log({ cmd });
  runProcess(cmd, path.dirname(cmd));
}

async function ensureMacProcess() {
  //kill existing process
  try {
    await runProcess("killall Teams");
  } catch {}

  //get teams path
  const teamsPath = "/Applications/Microsoft Teams.app/Contents/MacOS/Teams";

  //launch process
  const cmd = `${teamsPath} --inspect=${nodePort} --remote-debugging-port=${port}`;
  console.log({ cmd });
  await runProcess(cmd, path.dirname(cmd));
}

async function ensureLinuxProcess() {
  //kill existing process
  try {
    await runProcess("killall -9 teams");
  } catch {}

  //get teams path
  const teamsPath = "/usr/bin/teams";

  //launch process
  const cmd = `${teamsPath} --inspect=${nodePort} --remote-debugging-port=${port}`;
  console.log({ cmd });
  await runProcess(cmd, path.dirname(cmd));
}

(async () => {
  port = await getPort();
  nodePort = await getPort();

  if (os.platform() === "win32") {
    await ensureWindowsProcess();
  } else if (os.platform() === "darwin") {
    await ensureMacProcess();
  } else if (os.platform() === "linux") {
    await ensureLinuxProcess();
  } else {
    console.warn(
      `unsupported os ${os.platform()}. only compatible with windows, mac and linux. exiting...`
    );
    process.exit();
  }

  if (options.enable && options.enable.indexOf("recording-reminder") >= 0) {
    console.log("enabling recording-reminder");
    try {
      const payload = createEvalExpression(recordingReminderScript);
      let client = await CDP({ host: "localhost", port: nodePort });

      await client.Runtime.evaluate(payload);
    } catch (e) {
      console.log("error while injecting recording reminder script", e);
    }
  }

  const chatWindow = await findChatWindow();

  if (options.enable && options.enable.indexOf("reply") >= 0) {
    console.log("enabling reply-to-message");
    try {
      const replyPayload = createEvalExpression(replyScript);
      chatClient = await CDP({ host: "localhost", port, target: chatWindow });
      await chatClient.Runtime.evaluate(replyPayload);
    } catch (e) {
      console.log("error while injecting reply-to-message script", e);
    }
  }

  if (options.enable && options.enable.indexOf("mention-all") >= 0) {
    console.log("enabling mention-all");
    try {
      const mentionAllPayload = createEvalExpression(mentionAllScript);
      chatClient = await CDP({ host: "localhost", port, target: chatWindow });
      await chatClient.Runtime.evaluate(mentionAllPayload);
    } catch (e) {
      console.log("error while injecting mention-all script", e);
    }
  }

  process.exit();
})();
