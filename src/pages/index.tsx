import { open, save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import "@uiw/react-markdown-preview/markdown.css";
import { MDEditorProps, PreviewType } from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/lib/commands";
import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import * as zoom from "../zoom";

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
  const [content, setContent] = useState<string>("");
  const [preview, setPreview] = useState<PreviewType>("edit");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);

  function overwrite(content: string) {
    invoke("overwritefile", { content: content });
    setContent(content);
  }

  const openfile = {
    name: "openfile",
    keyCommand: "openfile",
    buttonProps: { "aria-label": "File", title: "File" },
    icon: <span id="titlebar-file">open</span>,
    execute: () => {
      open({
        multiple: false,
        directory: false,
      }).then((path) =>
        invoke("open_file", { path: path }).then((file) =>
          setContent(file as string)
        )
      );
    },
  };

  const savefile = {
    name: "savefile",
    keyCommand: "savefile",
    buttonProps: { "aria-label": "File", title: "File" },
    icon: <span id="titlebar-file">save</span>,
    execute: () => {
      save().then((path) => {
        invoke("save_file", { path: path, content: content });
        console.log(path);
      });
    },
  };

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

  useEffect(() => {
    if (process.browser) {
      // リロード時にファイルを読み込む
      invoke("get_file").then((file) => setContent(file as string));
    }
  }, []);

  return (
    <div className="container">
      <MDEditor
        value={content}
        onChange={(content) => overwrite(content)}
        fullscreen={true}
        preview={preview}
        hideToolbar={hiddenToolbar}
        commands={[
          commands.group([openfile, savefile], {
            name: "file",
            groupName: "file",
            icon: <span id="titlebar-title">📂</span>,
            buttonProps: {
              "aria-label": "File",
              title: "File",
            },
          }),
          commands.comment,
          commands.strikethrough,
          commands.hr,
        ]}
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
