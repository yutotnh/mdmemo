import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { ICommand, commands } from "@uiw/react-md-editor";

export let isFileOpen: boolean = false;

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
  buttonProps: {
    "aria-label": "Open File (Ctrl+O)",
    title: "Open File (Ctrl+O)",
  },
  icon: <span id="titlebar-file-open">Open File</span>,
  execute: (state: commands.ExecuteState, api: commands.TextAreaTextApi) => {
    isFileOpen = true;
    open({
      multiple: false,
      directory: false,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All", extensions: ["*"] },
      ],
    }).then((path: string | string[] | null) => {
      if (path == null) {
        isFileOpen = false;
        return;
      }

      invoke("open_file", { path: path }).then((contents) => {
        if (typeof contents == "string") {
          api.setSelectionRange({ start: 0, end: state.text.length });
          api.replaceSelection(contents);
          api.setSelectionRange({ start: 0, end: 0 });
          isFileOpen = false;
        }
      });
    });
  },
};
