import { appWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { confirm } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api";

// リクエストが重複しないように宣言した変数
// Trueのときは、リクエストが重複している
let isCloseRequest = false;

/**
 *
 * ウィンドウを閉じる時の処理を追加する
 *
 * @returns 空のReact要素
 */
export function Close() {
  /**
   * ウィンドウを閉じる
   *
   * 保存されていない変更がある場合は、保存するかどうかを確認する
   */
  function closeWindow() {
    if (isCloseRequest) return;

    isCloseRequest = true;

    // ファイルの遅延保存機能があるため、ファイルが保存されていない可能性がある
    // そのため、内容を全て保存してからウィンドウを閉じる
    invoke("write_file");

    invoke("get_path")
      // Okで帰ってきたときは、ファイルに保存されているので、そのままウィンドウを閉じる
      .then(() => {
        appWindow.close();
      })
      // Errで帰ってきたときは、ファイルに保存されていないので、保存するかどうかを確認する
      .catch(() => {
        confirm("Do you want to close this window without saving changes?", {
          type: "warning",
          okLabel: "OK",
          cancelLabel: "Cancel",
        })
          .then((confirmed) => {
            if (confirmed) {
              appWindow.close();
            }
          })
          .catch(() => {})
          .finally(() => {
            isCloseRequest = false;
          });
      });
  }

  // ウィンドウを閉じるイベントが発火したら、ウィンドウを閉じる処理を実行するようにする
  useEffect(() => {
    let unListen = (async () => {
      const unListen = await appWindow.onCloseRequested((event) => {
        closeWindow();
        event.preventDefault();
      });
      return unListen;
    })();

    return () => {
      (async () => {
        (await unListen)();
      })();
    };
  }, []);
  return <></>;
}
