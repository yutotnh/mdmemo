import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { confirm } from "@tauri-apps/api/dialog";
import * as os from "@tauri-apps/api/os";
import { ICommand } from "@uiw/react-md-editor";
import { hash, date } from "../commit_info.json";

/**
 * ISO 8601形式の日付文字列から現在時刻との大雑把な人間用の差分を返す
 *
 * @param dateString ISO 8601形式の日付文字列
 * @returns 現在時刻との大雑把な差分
 */
function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = month * 12;
  const century = year * 100; // 絶対に使われないけど一応

  const unitOfTime = [
    {
      unit: "second",
      value: 1,
    },
    {
      unit: "minute",
      value: minute,
    },
    {
      unit: "hour",
      value: hour,
    },
    {
      unit: "day",
      value: day,
    },
    {
      unit: "week",
      value: week,
    },
    {
      unit: "month",
      value: month,
    },
    {
      unit: "year",
      value: year,
    },
    {
      unit: "century",
      value: century,
    },
  ];

  // centuryより小さい単位で最初に一致したものを返す
  for (let i = 0; i < unitOfTime.length - 1; i++) {
    if (unitOfTime[i + 1].value < diff) {
      continue;
    }

    const unit = unitOfTime[i];
    const diffOfUnit = Math.floor(diff / unit.value);

    if (diffOfUnit < 1) {
      continue;
    }

    if (diffOfUnit == 1) {
      return "1 " + unit.unit + " ago";
    }

    return diffOfUnit + " " + unit.unit + "s ago";
  }

  // centuryより大きい場合はcenturyを返す
  const diffOfCentury = Math.floor(diff / century);
  if (diffOfCentury == 1) {
    return "1 century ago";
  }

  return diffOfCentury + " centuries ago";
}

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
      const timeAgo = getTimeAgo(commitDate);

      const tauriVersion = await getTauriVersion();

      const osInfo = {
        type: await os.type(),
        arch: await os.arch(),
        version: await os.version(),
      };

      const clipbordText =
        `Version: ${appVersion}\n` +
        `Commit: ${commitHash}\n` +
        `Date: ${commitDate}\n` +
        `Tauri: ${tauriVersion}\n` +
        `OS: ${osInfo.type} ${osInfo.arch} ${osInfo.version}`;

      let text =
        `Version: ${appVersion}\n` +
        `Commit: ${commitHash}\n` +
        `Date: ${commitDate} (${timeAgo})\n` +
        `Tauri: ${tauriVersion}\n` +
        `OS: ${osInfo.type} ${osInfo.arch} ${osInfo.version}`;

      // Windowsの場合はアプリ名を先頭に追加する(2行目は見栄えのため空行にする)
      if (osInfo.type === "Windows_NT") {
        text = `${appName}\n\n` + text;
      }

      // 以下のようなダイアログにしたいので、標準のダイアログの配置から変更する(Ok/Cancelのボタンを入れ替える)
      // - 左のボタンを押したらクリップボードに表示内容をコピーする
      //   - コピーする文字列にWindows限定のアプリ名は含めない
      //   - コピーしたらダイアログを閉じる(これは目的ではなくて、ダイアログの仕様)
      // - 右のボタンを押したらダイアログを閉じる
      confirm(text, {
        type: "info",
        okLabel: "Copy",
        cancelLabel: "OK",
      }).then(() => {
        /// コピーする文字列にWindows限定のアプリ名は含めない
        navigator.clipboard.writeText(clipbordText);
      });
    };

    printAbout();
  },
};
