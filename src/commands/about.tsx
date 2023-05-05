import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import * as os from "@tauri-apps/api/os";
import { confirm } from "@tauri-apps/api/dialog";
import { ICommand } from "@uiw/react-md-editor";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/api/fs";

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

      const resourcePath = await resolveResource("../commit_info.json");
      const commitInfo = await readTextFile(resourcePath);
      const commitHash = JSON.parse(commitInfo).commit_hash;
      const commitDate = JSON.parse(commitInfo).commit_date;

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
