import { ICommand } from "@uiw/react-md-editor";
import { TauriEvent, emit } from "@tauri-apps/api/event";

/**
 * ウィンドウを閉じるコマンド
 */
export const closeWindow: ICommand = {
  name: "close-window",
  keyCommand: "closeWindow",
  render: (command, disabled, executeCommand) => {
    return (
      <button
        id="titlebar-close"
        area-label="Close Window"
        title="Close Window"
        disabled={disabled}
        onClick={() => {
          executeCommand(command);

          // ファイルに保存されていない時に、ウィンドウを閉じるかどうかを確認する
          // 確認処理は共通化しているので、共通部分で処理をするためにイベントを発火させる
          emit(TauriEvent.WINDOW_CLOSE_REQUESTED);
        }}
        style={{ filter: "grayscale(100%)" }}
      >
        ✕
      </button>
    );
  },
};
