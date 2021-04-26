import * as React from "react";

export default function App() {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.6)",
        position: "absolute",
        bottom: "0px",
        right: "0px",
      }}
    >
      <h1>Hello World</h1>
      <button onClick={() => alert("test")}>Test</button>
    </div>
  );
}
