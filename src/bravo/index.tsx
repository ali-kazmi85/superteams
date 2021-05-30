import * as React from "react";
import * as Browser from "react-dom";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import GiveBravoButton from "./components/GiveBravoButton";

initializeIcons();

function htmlToElement(html: string): Element {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild as Element;
}

(() => {
  function addBravoButton() {
    const cardEl = document.querySelector("[data-log-region=LivePersonaCard]");
    if (!cardEl) return;
    if (!cardEl.hasAttribute("data-bravobuttonadded")) {
      cardEl.setAttribute("data-bravobuttonadded", "true");
      const toolbar = cardEl
        .querySelector("[role=toolbar]")
        .querySelector("[role=list]");
      const container = htmlToElement(`
        <div
        aria-label="Give Bravo"
        role="listitem"
        className="listItemHorizontal-92 itemWrapper-169">
        </div>`);
      toolbar.appendChild(container);
      Browser.render(<GiveBravoButton />, container);
    }
  }

  function observeChanges(observeTarget: Node) {
    const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
      characterDataOldValue: false,
      attributeOldValue: false,
    };

    const observer = new MutationObserver((mutations) => {
      mutations?.forEach((m) => {
        Array.from(m.addedNodes)
          .filter(
            (n) =>
              n instanceof Element && n.matches("[data-log-name=UserInfoBlock]")
          )
          .forEach((n) => {
            addBravoButton();
          });
      });
    });
    observer.observe(observeTarget, config);
  }

  observeChanges(document);
})();
