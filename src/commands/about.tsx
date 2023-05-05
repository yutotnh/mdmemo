import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { confirm } from "@tauri-apps/api/dialog";
import * as os from "@tauri-apps/api/os";
import { ICommand } from "@uiw/react-md-editor";
import { hash, date } from "../commit_info.json";

/**
 * アプリの情報を表示するコマンド
 */
export const about: ICommand = {
  name: "about",
  keyCommand: "about",
  buttonProps: {
    "aria-label": "About",
    title: "About",
  },
  icon: <span id="titlebar-about">About</span>,
  execute: () => {
    const printAbout = async () => {
      const appName = await getName();
      const appVersion = await getVersion();

      const commitHash = hash as string;
      const commitDate = date as string;

      const tauriVersion = await getTauriVersion();
      const osInfo = {
        type: await os.type(),
        arch: await os.arch(),
        version: await os.version(),
      };

      const text = `${appName}\n\nVersion: ${appVersion}\nCommit\n: ${commitHash}\nDate: ${commitDate}\nTauri: ${tauriVersion}\nOS: ${osInfo.type} ${osInfo.arch} ${osInfo.version}`;

      // 以下のようなダイアログにしたいので、標準のダイアログの配置から変更する(Ok/Cancelのボタンを入れ替える)
      // - 左のボタンを押したらクリップボードに表示内容をコピーする
      //   - コピーしたらダイアログを閉じる(これは目的ではなくて、ダイアログの仕様)
      // - 右のボタンを押したらダイアログを閉じる
      confirm(text, {
        title: "mdmemo",
        type: "info",
        okLabel: "Copy",
        cancelLabel: "OK",
      }).then(() => {
        navigator.clipboard.writeText(text);
      });
    };

    printAbout();
  },
};
