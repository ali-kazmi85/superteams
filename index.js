#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const getPort = require("get-port");
const CDP = require("chrome-remote-interface");
const { program } = require("commander");
const waitOn = require('wait-on');

program.option("-e, --enable <flags...>", "enable experimental features");

program.parse(process.argv);
const options = program.opts();

let port, nodePort;

function getExtensionScript(name) {
  return fs.readFileSync(path.join(__dirname, "extensions", name, "index.js"), {
    encoding: "utf-8",
  });
}

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
    awaitPromise: true,
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
  const cmd = `${teamsPath} --inspect=${nodePort} --remote-debugging-port=${port} --ignore-certificate-errors`;
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

async function injectBrowserScript(script, window) {
  const payload = createEvalExpression(script);
  await waitOn({resources: [`tcp:${port}`]});
  const client = await CDP({ host: "localhost", port, target: window });
  return await client.Runtime.evaluate(payload);
}

async function injectBrowserExtension(extensionName, window) {
  try {
    console.log(`injecting ${extensionName}`);
    const script = getExtensionScript(extensionName);
    const result = await injectBrowserScript(script, window);
    console.log("result: ", result);
  } catch (e) {
    console.log(`error while injecting ${extensionName}`, e);
  }
}

async function injectMainScript(script) {
  const payload = createEvalExpression(script);
  await waitOn({resources: [`tcp:${nodePort}`]});
  let client = await CDP({ host: "localhost", port: nodePort });

  const response = await client.Runtime.evaluate(payload);
  return response;
}

async function injectMainExtension(name, params) {
  console.log("running module: " + name);
  try {
    const modulePath = path.resolve(__dirname, "extensions", name, "index.js");

    const cwdResult = await injectMainScript(`process.cwd()`);

    const relativePath = path
      .relative(cwdResult.result.value, modulePath)
      .replace(/\\/g, "/");

    const runScript = `global.require("${relativePath}").run(${JSON.stringify(
      params
    )})`;
    const result = await injectMainScript(runScript);
    console.log("result: ", result);
  } catch (e) {
    console.log(`error while running module: ${name}`, e);
  }
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
    await injectMainExtension("recording-reminder");
  }

  const chatWindow = await findChatWindow();

  if (options.enable && options.enable.indexOf("reply") >= 0) {
    await injectBrowserExtension("reply-injector", chatWindow);
  }

  if (options.enable && options.enable.indexOf("mention-all") >= 0) {
    await injectBrowserExtension("mention-all", chatWindow);
  }

  process.exit();
})();
