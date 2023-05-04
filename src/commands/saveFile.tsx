import { getName } from "@tauri-apps/api/app";
import { save } from "@tauri-apps/api/dialog";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useRecoilState, useSetRecoilState } from "recoil";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { contentsState } from "../App";
import { appendStopWatcher, execAllStopWatcher } from "../watchFile";
import { fileNameState, filePathState } from "./fileInfo";

/**
 * テキストをファイルに保存するコマンド
 *
 * ファイルを保存するダイアログを開き、保存先のパスを取得する
 *
 * 取得したパスのファイルにテキストを保存する
 */
export const saveFile: ICommand = {
  name: "savefile",
  keyCommand: "savefile",
  shortcuts: "ctrlcmd+shift+s",
  buttonProps: {
    "aria-label": "Save File (Ctrl+Shift+S)",
    title: "Save File (Ctrl+Shift+S)",
  },
  render: (command, disabled, executeCommand) => {
    const [contents, setContents] = useRecoilState(contentsState);
    const setFilePath = useSetRecoilState(filePathState);
    const setFileName = useSetRecoilState(fileNameState);

    function saveFile() {
      save({
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "All", extensions: ["*"] },
        ],
      }).then((path: string | null) => {
        if (path == null) return;

        invoke("set_path", { path: path }).then(() => {
          invoke("write_file", { contents: contents }).then(() => {
            // 編集中のファイルが変わったので、ファイルパスを更新する
            setFilePath(path);

            basename(path).then((basename) => {
              if (typeof basename != "string") return;

              setFileName(basename);

              getName().then((name) => {
                appWindow.setTitle(`${basename} - ${name}`);
              });
            });

            // 既存のファイル監視を停止する
            execAllStopWatcher();

            // ファイル監視を開始する
            watchImmediate(
              [path],
              () => {
                invoke("read_file").then((contents) => {
                  if (typeof contents != "string") return;

                  setContents(contents);
                });
              },
              {}
            ).then((response) => {
              appendStopWatcher(response);
            });
          });
        });
      });
    }

    return (
      <button
        id="titlebar-file-save"
        aria-label="Save File (Ctrl+Shift+S)"
        title="Save File (Ctrl+Shift+S)"
        disabled={disabled}
        onClick={() => {
          executeCommand(command);
          saveFile();
        }}
      >
        Save File
      </button>
    );
  },
};
