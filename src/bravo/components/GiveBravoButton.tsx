import * as React from "react";
import { IIconProps, IContextualMenuProps, Stack, Link } from "@fluentui/react";
import { IconButton } from "@fluentui/react/lib/Button";

export default function () {
  return (
    <IconButton
      iconProps={{ iconName: "Emoji2" }}
      title="Emoji"
      ariaLabel="Emoji"
      onClick={() => {
        alert(
          document
            .querySelector("[data-log-region=LivePersonaCard]")
            .querySelector("[data-log-name=Email]")
            .querySelector("button").title
        );
      }}
    />
  );
}
