const { ipcMain } = require("electron");

export function run() {
  ipcMain.handle("get-timestamp", async (event, someArgument) => {
    return Date.now();
  });
}
