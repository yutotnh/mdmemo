import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";

/**
 * ウィンドウを閉じるコマンド
 */
export const closeWindow: ICommand = {
  name: "close-window",
  keyCommand: "closeWindow",
  buttonProps: { "aria-label": "Close Window", title: "Close Window" },
  icon: (
    <span id="titlebar-close" style={{ filter: "grayscale(100%)" }}>
      ✕
    </span>
  ),
  execute: () => {
    appWindow.close();
  },
};
