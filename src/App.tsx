import { invoke } from "@tauri-apps/api/tauri";
import MDEditor, { PreviewType, commands } from "@uiw/react-md-editor";
import { useEffect, useState } from "react";
import "./App.css";
import { about } from "./commands/about";
import { closeWindow } from "./commands/closeWindow";
import { format } from "./commands/format";
import { isFileOpen, openFile } from "./commands/openFile";
import { saveFile } from "./commands/saveFile";
import { toggleAlwaysOnTop } from "./commands/toggleAlwaysOnTop";
import * as zoom from "./commands/zoom";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { appendStopWatcher } from "./watchFile";
import { fileInfo } from "./commands/fileInfo";

function App() {
  const [contents, setContents] = useState("");
  const [preview, setPreview] = useState<PreviewType>("edit");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);

  /**
   * ファイルの中身を保存する
   * @param contents ファイルの中身
   */
  function write(contents: string) {
    invoke("write_file", { contents: contents });
    setContents(contents);
  }

  window.onblur = () => {
    // 開いたファイルの中身が表示されないため、"開く"ダイアログが開かれている場合はプレビューを表示しない
    if (isFileOpen) return;

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

    // ファイル名をドラッグ可能にする
    let filename = document.querySelector("#titlebar-file-name");
    filename?.setAttribute("data-tauri-drag-region", "");
  });

  window.addEventListener("mouseout", () => {
    setHiddenToolbar(true);
  });

  useEffect(() => {
    // リロード時にファイルを読み込む
    invoke("read_file").then((contents) => setContents(contents as string));

    // リロード時にスタイルがリセットされるので、スタイルを再設定する
    invoke("get_always_on_top").then((isAlwaysOnTop) => {
      if (typeof isAlwaysOnTop !== "boolean") return;
    });

    invoke("get_path")
      .then((response) => {
        // ファイルの変更を監視して、ファイルが変更されたらファイルを読み込む
        watchImmediate(
          [response as string],
          () => {
            invoke("read_file").then((contents) =>
              setContents(contents as string)
            );
          },
          {}
        ).then((response) => {
          appendStopWatcher(response);
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <MDEditor
        value={contents}
        onChange={(contents) => write(contents as string)}
        fullscreen={true}
        preview={preview}
        hideToolbar={hiddenToolbar}
        commands={[
          commands.group([openFile, saveFile], {
            name: "file",
            groupName: "file",
            icon: (
              <span id="titlebar-title" style={{ filter: "grayscale(100%)" }}>
                File
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
                  Edit
                </span>
              ),
              buttonProps: {
                "aria-label": "Edit",
                title: "Edit",
              },
            }
          ),
          commands.group([about], {
            name: "Help",
            groupName: "Help",
            icon: (
              <span id="titlebar-help" style={{ filter: "grayscale(100%)" }}>
                Help
              </span>
            ),
            buttonProps: {
              "aria-label": "Help",
              title: "Help",
            },
          }),
          commands.divider,
          fileInfo,
        ]}
        extraCommands={[toggleAlwaysOnTop, closeWindow]}
        onWheel={zoom.handleWheel}
        onKeyDown={zoom.handleKeyDown}
        className="w-md-editor-fullscreen" // 常にフルスクリーンにする
      />
    </div>
  );
}

export default App;
