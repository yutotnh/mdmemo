import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useEffect, useState } from "react";

const commandStyle = {
  /// リロード時にスタイルが一瞬初期化されるので、目立たないように透明にする
  default: "rgba(0, 0, 0, 0.0)",
  /// テーマに合わせるため水色にする
  active: "#61dafb",
  /// 無効であることを明確に示すためグレースケールにする
  inactive: "",
};

/**
 * 常に最前面に表示するトグルコマンド
 */
export const toggleAlwaysOnTop: ICommand = {
  name: "toggle-always-on-top",
  keyCommand: "toggleAlwaysOnTop",
  render: (command, disabled, executeCommand) => {
    const [isAlwaysOnTopStyle, setIsAlwaysOnTopStyle] = useState(
      commandStyle["default"]
    );

    /**
     * 常に最前面に表示するかどうかに応じてアイコンのスタイルを変更する
     *
     * @param isAlwaysOnTop 常に最前面に表示するかどうか
     */
    function setIconStyle(isAlwaysOnTop: boolean) {
      if (isAlwaysOnTop) {
        setIsAlwaysOnTopStyle(commandStyle["active"]);
      } else {
        setIsAlwaysOnTopStyle(commandStyle["inactive"]);
      }
    }

    /**
     * 常に最前面に表示するかどうかを切り替える
     */
    function toggleAlwaysOnTop() {
      executeCommand(command, command.groupName);
      invoke("get_always_on_top").then((isAlwaysOnTop) => {
        if (typeof isAlwaysOnTop != "boolean") return;

        setIconStyle(!isAlwaysOnTop);
        appWindow.setAlwaysOnTop(!isAlwaysOnTop);
        invoke("set_always_on_top", { isAlwaysOnTop: !isAlwaysOnTop });
      });
    }

    /**
     * キーボードショートカットを処理する
     *
     * @param event キーボードイベント
     */
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        toggleAlwaysOnTop();
      }
    }

    // キーボードショートカットを登録する
    // イベントが重複して登録されないように、useEffect で1度だけ登録する
    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
    }, []);

    invoke("get_always_on_top").then((isAlwaysOnTop) => {
      if (typeof isAlwaysOnTop != "boolean") return;

      setIconStyle(isAlwaysOnTop);
    });

    return (
      <button
        id="titlebar-toggle-always-on-top"
        aria-label="Toggle always on top"
        title="Toggle always on top"
        onClick={toggleAlwaysOnTop}
        disabled={disabled}
        type="button"
        style={{
          color: isAlwaysOnTopStyle,
        }}
      >
        Top
      </button>
    );
  },
};
