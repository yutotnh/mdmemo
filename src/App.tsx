import { useEffect, useState } from "react";
import { getName } from "@tauri-apps/api/app";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/api/dialog";
import MDEditor, { PreviewType, commands } from "@uiw/react-md-editor";
import "./App.css";
import { remark } from "remark";
import * as zoom from "./zoom";

/**
 * ウィンドウを閉じるコマンド
 */
const closeWindow = {
  name: "close-window",
  keyCommand: "closeWindow",
  buttonProps: { "aria-label": "Close window", title: "Close window" },
  icon: <span id="titlebar-close">✕</span>,
  execute: () => {
    appWindow.close();
  },
};

let isFixedPreview: boolean = false;

/**
 * ファイルを開くコマンド
 *
 * ファイルを開くダイアログを開き、開くファイルのパスを取得する
 *
 * 取得したパスのファイルのテキストを取得し、エディタに表示する
 */
const openfile = {
  name: "openfile",
  keyCommand: "openfile",
  shortcuts: "ctrlcmd+o",
  buttonProps: {
    "aria-label": "Open File (Ctrl+O)",
    title: "Open File (Ctrl+O)",
  },
  icon: <span id="titlebar-file-open">Open File</span>,
  execute: (state: commands.ExecuteState, api: commands.TextAreaTextApi) => {
    isFixedPreview = true;
    open({
      multiple: false,
      directory: false,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All", extensions: ["*"] },
      ],
    }).then((path: string | string[] | null) => {
      if (path == null) {
        isFixedPreview = false;
        return;
      }

      invoke("open_file", { path: path }).then((contents) => {
        if (typeof contents == "string") {
          api.setSelectionRange({ start: 0, end: state.text.length });
          api.replaceSelection(contents);
          api.setSelectionRange({ start: 0, end: 0 });
          isFixedPreview = false;
        }
      });
    });
  },
};

/**
 * テキストをファイルに保存するコマンド
 *
 * ファイルを保存するダイアログを開き、保存先のパスを取得する
 *
 * 取得したパスのファイルにテキストを保存する
 */
const savefile = {
  name: "savefile",
  keyCommand: "savefile",
  shortcuts: "ctrlcmd+shift+s",
  buttonProps: {
    "aria-label": "Save File (Ctrl+Shift+S)",
    title: "Save File (Ctrl+Shift+S)",
  },
  icon: <span id="titlebar-file">Save File</span>,
  execute: (state: commands.ExecuteState) => {
    save({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All", extensions: ["*"] },
      ],
    }).then((path: string | null) => {
      if (path == null) return;
      invoke("create_file", { path: path });
      invoke("overwrite_file", { contents: state.text });
    });
  },
};

/**
 * テキストをフォーマットするコマンド
 */
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

function App() {
  const [contents, setContents] = useState<string>("");
  const [preview, setPreview] = useState<PreviewType>("edit");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);
  const [fileName, setFileName] = useState("Untitled ●");
  const [filePath, setFilePath] = useState("");

  /**
   * ファイルの中身を保存する
   * @param contents ファイルの中身
   */
  function overwrite(contents: string) {
    invoke("overwrite_file", { contents: contents });
    setContents(contents);
  }

  /**
   * ファイル名とパスを表示するコマンド
   */
  const filename = {
    name: "file name",
    keyCommand: "file name",
    buttonProps: {
      title: `${filePath}`,
    },
    icon: <span id="titlebar-file-name">{fileName}</span>,
  };

  window.onblur = () => {
    if (isFixedPreview) return;

    setPreview("preview");
  };

  window.onfocus = () => {
    if (isFixedPreview) return;

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

  useEffect(() => {
    // リロード時にファイルを読み込む
    invoke("get_file").then((file) => setContents(file as string));
  }, []);

  useEffect(() => {
    // タイトルバーのファイル名とウィンドウのタイトルを更新する
    // ウィンドウのタイトルは "ファイル名 - アプリ名" とする
    invoke("get_path")
      .then((response) => {
        setFilePath(response as string);

        basename(response as string).then((basename) => {
          setFileName(basename);

          getName().then((name) => {
            appWindow.setTitle(`${basename} - ${name}`);
          });
        });
      })
      .catch(() => {
        // VSCodeのように、タイトルバーのファイル名の後ろに●をつけ、
        // ウィンドウのタイトルは "● Untitled - アプリ名" とする
        setFileName("Untitled ●");
        setFilePath("");

        getName().then((name) => {
          appWindow.setTitle(`●  Untitled - ${name}`);
        });
      });
  }, [contents]);

  return (
    <div className="container">
      <MDEditor
        value={contents}
        onChange={(contents) => overwrite(contents as string)}
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
          filename,
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
