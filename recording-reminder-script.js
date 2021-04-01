const { dialog, BrowserWindow } = require("electron");

const skipWindows = [];
const windowState = {};
const MONITORING_INTERVAL = 5000;
const MIN_ELAPSED = 20000;

function getWindowState(w) {
  if (!windowState["state-" + w.id.toString()]) {
    windowState["state-" + w.id.toString()] = { elapsed: 0 };
  }

  return windowState["state-" + w.id.toString()];
}

async function monitorMeetings() {
  const meetingWindows = BrowserWindow.getAllWindows().filter((w) => {
    let latestHistory = w.webContents.history.slice(-1)[0];
    return latestHistory && latestHistory.indexOf("entityType=calls") >= 0;
  });

  for (let w of meetingWindows) {
    if (skipWindows.indexOf(w.id) >= 0) continue;

    const windowState = getWindowState(w);

    const meetingStarted = await w.webContents.executeJavaScript(
      "document.querySelector('#recording-indicator-custom') !== null"
    );

    if (!meetingStarted) continue;
    else {
      windowState.elapsed += MONITORING_INTERVAL;
      if (windowState.elapsed < MIN_ELAPSED) continue;
    }

    const recordingStarted = await w.webContents.executeJavaScript(
      "document.querySelector('#recording-indicator-custom').childElementCount > 0"
    );

    if (recordingStarted) {
      skipWindows.push(w.id);
      continue;
    }

    const result = await dialog.showMessageBox(w, {
      message: "Do you want to start recording?",
      buttons: ["Yes", "No", "Snooze"],
    });

    if (result.response === 1) {
      skipWindows.push(w.id);
    } else if (result.response === 0) {
      w.webContents.executeJavaScript(`
        document.querySelector('#callingButtons-showMoreBtn').click(); 
        setTimeout(() => {
          document.querySelector('#recording-button').click();
        }, 100);
      `);
      skipWindows.push(w.id);
    } else if (result.response === 2) {
      windowState.elapsed = 0;
    }
  }
  scheduleMonitorTask();
}

function scheduleMonitorTask() {
  setTimeout(async () => await monitorMeetings(), MONITORING_INTERVAL);
}

scheduleMonitorTask();
