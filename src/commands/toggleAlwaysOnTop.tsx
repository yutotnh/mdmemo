import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";

const commandStyle = {
  /// リロード時にスタイルが一瞬初期化されるので、目立たないように透明にする
  default: "opacity(0%)",
  /// テーマに合わせるため水色にする
  active: "hue-rotate(210deg) brightness( 2.0 )",
  /// 無効であることを明確に示すためグレースケールにする
  inactive: "grayscale(100%)",
};

/**
 * 常に最前面に表示するトグルコマンドのスタイルを設定する
 */
export async function setAlwaysOnTopCommandStyle() {
  invoke("get_always_on_top").then((isAlwaysOnTop) => {
    if (typeof isAlwaysOnTop != "boolean") return;

    if (isAlwaysOnTop) {
      let commands = document.getElementById("titlebar-toggle-always-on-top");

      if (commands == null) return;
      commands.style.filter = commandStyle["active"];

      const parent = document.querySelector(
        '[data-name="toggle-always-on-top"]'
      )?.parentElement;

      parent?.classList.add("active");
    } else {
      let commands = document.getElementById("titlebar-toggle-always-on-top");
      if (commands == null) return;

      commands.style.filter = commandStyle["inactive"];

      const parent = document.querySelector(
        '[data-name="toggle-always-on-top"]'
      )?.parentElement;
      parent?.classList.remove("active");
    }
  });
}

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
      style={{
        filter: commandStyle["default"],
      }}
    >
      📌
    </span>
  ),
  execute: () => {
    invoke("get_always_on_top").then((isAlwaysOnTop) => {
      if (typeof isAlwaysOnTop != "boolean") return;

      appWindow.setAlwaysOnTop(!isAlwaysOnTop);
      invoke("set_always_on_top", { isAlwaysOnTop: !isAlwaysOnTop });
    });
  },
};
