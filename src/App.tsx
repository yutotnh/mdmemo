import { invoke } from "@tauri-apps/api/tauri";
import MDEditor, { PreviewType, commands } from "@uiw/react-md-editor";
import { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import "./App.css";
import { about } from "./commands/about";
import { closeWindow } from "./commands/closeWindow";
import { fileInfo } from "./commands/fileInfo";
import { format } from "./commands/format";
import { openFile } from "./commands/openFile";
import { saveFile } from "./commands/saveFile";
import { sourceCode } from "./commands/sourceCode";
import { toggleAlwaysOnTop } from "./commands/toggleAlwaysOnTop";
import * as zoom from "./commands/zoom";
import { appendStopWatcher } from "./watchFile";
import { appWindow } from "@tauri-apps/api/window";

export const contentsState = atom({
  key: "contentsState",
  default: "",
});

function App() {
  const [contents, setContents] = useRecoilState(contentsState);
  const [preview, setPreview] = useState<PreviewType>("edit");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  /**
   * ファイルの中身を保存する
   *
   * 直近の入力から1s経過しから保存する
   *
   * @param contents ファイルの中身
   */
  function write(contents: string) {
    if (timerId != null) {
      clearTimeout(timerId);
    }

    setContents(contents);
    invoke("save_contents", { contents: contents });

    setTimerId(
      setTimeout(() => {
        invoke("write_file");
      }, 1000)
    );
  }

  useEffect(() => {
    // リロード時にファイルを読み込む
    invoke("read_file").then((contents) => {
      setContents(contents as string);
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

    // ウィンドウを閉じるイベントが発火したら、ファイルを保存する
    let unListen = (async () => {
      const unListen = await appWindow.onCloseRequested(() => {
        invoke("write_file");
      });
      return unListen;
    })();


    return () => {
      unListen.then((unListen) => unListen());
    };
  }, []);

  return (
    <div className="container">
      <MDEditor
        value={contents}
        onChange={(contents) => {
          write(contents as string);
        }}
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
          commands.group([sourceCode, about], {
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
