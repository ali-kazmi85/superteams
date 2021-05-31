import * as React from "react";
import { IIconProps, IContextualMenuProps, Stack, Link } from "@fluentui/react";
import { IconButton } from "@fluentui/react/lib/Button";

const { electronSafeIpc } = window;

export default function () {
  const [iconName, setIconName] = React.useState("Medal");
  return (
    <IconButton
      iconProps={{ iconName }}
      styles={{ rootHovered: { backgroundColor: "transparent" } }}
      title="Give Bravo"
      ariaLabel="Give Bravo"
      onMouseOver={() => setIconName("MedalSolid")}
      onMouseLeave={() => setIconName("Medal")}
      onClick={async () => {
        const timestamp = await electronSafeIpc.invoke("get-timestamp");
        alert(
          timestamp +
            " " +
            document
              .querySelector("[data-log-region=LivePersonaCard]")
              .querySelector("[data-log-name=Email]")
              .querySelector("button").title
        );
      }}
    />
  );
}
