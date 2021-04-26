(async () => {
  const { app } = require("electron");
  app.on(
    "certificate-error",
    (event, webContents, url, error, certificate, callback) => {
      if (/https:\/\/localhost/g.test(url)) {
        // Verification logic.
        event.preventDefault();
        callback(true);
      } else {
        callback(false);
      }
    }
  );
})();
