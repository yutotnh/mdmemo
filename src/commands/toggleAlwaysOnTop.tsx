import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";

let isAlwaysOnTop: boolean = false;

/**
 * 常に最前面に表示するトグルコマンド
 */
export const toggleAlwaysOnTop: ICommand = {
  name: "toggle-always-on-top",
  keyCommand: "toggleAlwaysOnTop",
  buttonProps: {
    "aria-label": "Toggle always on top",
    title: "Toggle always on top",
  },
  icon: (
    <span
      id="titlebar-toggle-always-on-top"
      style={{ filter: `grayscale(100%)` }}
    >
      📌
    </span>
  ),
  execute: () => {
    isAlwaysOnTop = !isAlwaysOnTop;
    appWindow.setAlwaysOnTop(isAlwaysOnTop);
  },
};
