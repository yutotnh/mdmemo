import { open } from "@tauri-apps/api/shell";
import { ICommand } from "@uiw/react-md-editor";

/**
 * アプリの情報を表示するコマンド
 */
export const sourceCode: ICommand = {
  name: "source-code",
  keyCommand: "sourceCode",
  buttonProps: {
    "aria-label": "Source Code",
    title: "Source Code",
  },
  icon: <span id="titlebar-about">Source Code</span>,
  execute: () => {
    open("https://github.com/yutotnh/mdmemo");
  },
};
