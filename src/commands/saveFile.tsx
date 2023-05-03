import { ICommand, commands } from "@uiw/react-md-editor";
import { invoke } from "@tauri-apps/api/tauri";
import { save } from "@tauri-apps/api/dialog";

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
  icon: <span id="titlebar-file">Save File</span>,
  execute: (state: commands.ExecuteState) => {
    save({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All", extensions: ["*"] },
      ],
    }).then((path: string | null) => {
      if (path == null) return;

      invoke("set_path", { path: path }).then(() => {
        invoke("write_file", { contents: state.text }).then(() => {
          // タイトルバーのファイル名を更新するためにリロードする
          // 本当はもっといい方法があるはず
          window.location.reload();
        });
      });
    });
  },
};
