import { open, save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import "@uiw/react-markdown-preview/markdown.css";
import { MDEditorProps, PreviewType } from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/lib/commands";
import "@uiw/react-md-editor/markdown-editor.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { remark } from "remark";
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
    invoke("overwrite_file", { content: content });
    setContent(content);
  }

  const openfile = {
    name: "openfile",
    keyCommand: "openfile",
    shortcuts: "ctrlcmd+o",
    buttonProps: {
      "aria-label": "Open File (Ctrl+O)",
      title: "Open File (Ctrl+O)",
    },
    icon: <span id="titlebar-file-open">Open File</span>,
    execute: () => {
      open({
        multiple: false,
        directory: false,
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "All", extensions: ["*"] },
        ],
      }).then((path) => {
        if (path == null) return;

        invoke("open_file", { path: path }).then((file) =>
          setContent(file as string)
        );
      });
    },
  };

  const savefile = {
    name: "savefile",
    keyCommand: "savefile",
    shortcuts: "ctrlcmd+shift+s",
    buttonProps: {
      "aria-label": "Save File (Ctrl+Shift+S)",
      title: "Save File (Ctrl+Shift+S)",
    },
    icon: <span id="titlebar-file">Save File</span>,
    execute: (state) => {
      save({
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "All", extensions: ["*"] },
        ],
      }).then((path) => {
        if (path == null) return;
        invoke("create_file", { path: path });
        invoke("overwrite_file", { content: state.text });
      });
    },
  };

  const format = {
    name: "format",
    keyCommand: "format",
    shortcuts: "alt+shift+f",
    buttonProps: {
      "aria-label": "Format File (Alt+Shift+F)",
      title: "Format (Alt+Shift+F)",
    },
    icon: <span id="titlebar-format">Format</span>,
    execute: (state: commands.ExecuteState, api: commands.TextAreaTextApi) => {
      // フォーマット前後でカーソル位置を保持するために、
      // フォーマット前のテキストのカーソル位置にマークをつける
      api.setSelectionRange({
        start: state.selection.end,
        end: state.selection.end,
      });
      let mark = "<!-- CURSOR_POSITION -->";
      let text =
        state.text.slice(0, state.selection.end) +
        mark +
        state.text.slice(state.selection.end);

      // フォーマット前に基づくフォーマット後のカーソル位置を取得
      let cursor = remark().processSync(text).toString().indexOf(mark);

      const formatted = remark().processSync(state.text).toString();
      api.setSelectionRange({ start: 0, end: state.text.length });
      api.replaceSelection(formatted);

      api.setSelectionRange({ start: cursor, end: cursor });
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
            icon: (
              <span id="titlebar-title" style={{ filter: "grayscale(100%)" }}>
                📂
              </span>
            ),
            buttonProps: {
              "aria-label": "File",
              title: "File",
            },
          }),
          commands.group(
            [commands.comment, commands.strikethrough, commands.hr, format],
            {
              name: "edit",
              groupName: "edit",
              icon: (
                <span id="titlebar-edit" style={{ filter: "grayscale(100%)" }}>
                  📝
                </span>
              ),
              buttonProps: {
                "aria-label": "Edit",
                title: "Edit",
              },
            }
          ),
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
