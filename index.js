#!/usr/bin/env node

const axios = require("axios").default;
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");

const winToSocket = {};
const port = 31337;
const debuggerUrl = `http://localhost:${port}`;
axios.defaults.baseURL = debuggerUrl;

const script = fs.readFileSync(path.join(__dirname, "script.js"), {
  encoding: "utf-8",
});

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
      response = await axios.get("/json/list");
    } catch {}

    if (response) {
      for (const win of response.data) {
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
    id: 1337,
    method: "Runtime.evaluate",
    params: {
      expression,
      objectGroup: "evalme",
      returnByValue: false,
      userGesture: true,
    },
  };
}

async function initWebSocket(wsUrl) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    ws.once("open", () => {
      resolve(ws);
    });
  });
}

async function getSocketByWindow(window) {
  if (!winToSocket[window.id]) {
    const ws = await initWebSocket(window.webSocketDebuggerUrl);
    winToSocket[window.id] = ws;
  }

  return winToSocket[window.id];
}

async function receiveWsResponse(ws) {
  return new Promise((resolve) => {
    ws.once("message", (data) => {
      resolve(data);
    });
  });
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
    "Update.exe"
  );

  //launch process
  const cmd = `${teamsPath} --processStart Teams.exe --process-start-args --remote-debugging-port=${port}`;
  console.log({ cmd });
  await runProcess(cmd, path.dirname(cmd));
}

async function ensureMacProcess() {
  //kill existing process
  try {
    await runProcess("killall Teams");
  } catch {}

  //get teams path
  const teamsPath = "/Applications/Microsoft Teams.app/Contents/MacOS/Teams";

  //launch process
  const cmd = `${teamsPath} --remote-debugging-port=${port}`;
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
  const cmd = `${teamsPath} --remote-debugging-port=${port}`;
  console.log({ cmd });
  await runProcess(cmd, path.dirname(cmd));
}

(async () => {
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
  const chatWindow = await findChatWindow();
  const payload = createEvalExpression(script);
  const ws = await getSocketByWindow(chatWindow);
  ws.send(JSON.stringify(payload));
  const result = await receiveWsResponse(ws);
  console.log({ result });
  process.exit();
})();
