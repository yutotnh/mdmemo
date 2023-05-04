import { getName } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/api/dialog";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useSetRecoilState } from "recoil";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { contentsState } from "../App";
import { appendStopWatcher, execAllStopWatcher } from "../watchFile";
import { fileNameState, filePathState } from "./fileInfo";

/**
 * ファイルを開くコマンド
 *
 * ファイルを開くダイアログを開き、開くファイルのパスを取得する
 *
 * 取得したパスのファイルのテキストを取得し、エディタに表示する
 */
export const openFile: ICommand = {
  name: "openfile",
  keyCommand: "openfile",
  shortcuts: "ctrlcmd+o",
  render: (command, disabled, executeCommand) => {
    const setContents = useSetRecoilState(contentsState);
    const setFilePath = useSetRecoilState(filePathState);
    const setFileName = useSetRecoilState(fileNameState);

    function openFile() {
      open({
        multiple: false,
        directory: false,
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "All", extensions: ["*"] },
        ],
      }).then((path: string | string[] | null) => {
        if (typeof path != "string") return;

        invoke("set_path", { path: path }).then(() => {
          invoke("read_file").then((contents) => {
            if (typeof contents != "string") return;
            setContents(contents);

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

            // ファイルの変更を監視して、ファイルが変更されたらファイルを読み込む
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
        id="titlebar-file-open"
        aria-label="Open File (Ctrl+O)"
        title="Open File (Ctrl+O)"
        onClick={() => {
          executeCommand(command);

          openFile();
        }}
        disabled={disabled}
        type="button"
      >
        Open File
      </button>
    );
  },
};
