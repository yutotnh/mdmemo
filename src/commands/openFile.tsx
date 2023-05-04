import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { ICommand } from "@uiw/react-md-editor";
import { useSetRecoilState } from "recoil";
import { contentsState } from "../App";
import { fileNameState, filePathState } from "./fileInfo";
import { basename } from "@tauri-apps/api/path";
import { getName } from "@tauri-apps/api/app";
import { appWindow } from "@tauri-apps/api/window";

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
        if (path == null) return;

        invoke("set_path", { path: path }).then(() => {
          invoke("read_file").then((contents) => {
            if (typeof contents == "string") {
              setContents(contents);

              // 編集中のファイルが変わったので、ファイルパスを更新する
              setFilePath(path as string);

              basename(path as string).then((basename) => {
                if (typeof basename != "string") return;

                setFileName(basename);

                getName().then((name) => {
                  appWindow.setTitle(`${basename} - ${name}`);
                });
              });
            }
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
