import { CloseRequestedEvent, appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useRecoilValue } from "recoil";
import { contentsState } from "../App";
import { invoke } from "@tauri-apps/api";
import { confirm } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import { TauriEvent, emit } from "@tauri-apps/api/event";

/**
 * ウィンドウを閉じるコマンド
 */
export const closeWindow: ICommand = {
  name: "close-window",
  keyCommand: "closeWindow",
  buttonProps: { "aria-label": "Close Window", title: "Close Window" },
  render: (command, disabled, executeCommand) => {
    return (
      <button
        id="titlebar-close"
        area-aria-label="Close Window"
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
