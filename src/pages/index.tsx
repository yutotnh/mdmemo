import { invoke } from "@tauri-apps/api/tauri";
import "@uiw/react-markdown-preview/markdown.css";
import { MDEditorProps, PreviewType } from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/lib/commands";
import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";
import { useState } from "react";
import * as zoom from "./zoom";
const MDEditor = dynamic<MDEditorProps>(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

const closeWindow = {
  name: "close-window",
  keyCommand: "closeWindow",
  buttonProps: { "aria-label": "Close window", title: "Close window" },
  icon: <span id="titlebar-close">✕</span>,
  execute: () => {
    if (process.browser) {
      invoke("close_window");
    }
  },
};

function App() {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<PreviewType>("edit");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);

  if (process.browser) {
    window.onblur = () => {
      setPreview("preview");
    };

    window.onfocus = () => {
      setPreview("edit");
    };

    window.addEventListener("mouseover", () => {
      setHiddenToolbar(false);

      // ツールバーをドラッグ可能にする
      let toolbar = document.querySelector(".w-md-editor-toolbar");
      toolbar?.setAttribute("data-tauri-drag-region", "");
    });

    window.addEventListener("mouseout", () => {
      setHiddenToolbar(true);
    });
  }

  return (
    <div className="container">
      <MDEditor
        value={value}
        onChange={setValue}
        fullscreen={true}
        preview={preview}
        hideToolbar={hiddenToolbar}
        commands={[commands.comment, commands.strikethrough, commands.hr]}
        extraCommands={[
          commands.codeLive,
          commands.codeEdit,
          commands.codePreview,
          closeWindow,
        ]}
        onWheel={zoom.handleWheel}
        onKeyDown={zoom.handleKeyDown}
        className="w-md-editor-fullscreen" // 常にフルスクリーンにする
      />
    </div>
  );
}

export default App;
