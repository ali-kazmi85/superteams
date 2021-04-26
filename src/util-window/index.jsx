import * as React from "react";
import * as Browser from "react-dom";
import App from "./App";

(() => {
  const appContainer = document.createElement("div");
  document.body.appendChild(appContainer);
  Browser.render(<App />, appContainer);
})();
