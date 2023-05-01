import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import * as os from "@tauri-apps/api/os";
import { message } from "@tauri-apps/api/dialog";
import { ICommand } from "@uiw/react-md-editor";

/**
 * アプリの情報を表示するコマンド
 */
export const about: ICommand = {
  name: "version",
  keyCommand: "version",
  buttonProps: {
    "aria-label": "Version",
    title: "Version",
  },
  icon: <span id="titlebar-about"> About </span>,
  execute: () => {
    const printAbout = async () => {
      const appName = await getName();
      const appVersion = await getVersion();
      const tauriVersion = await getTauriVersion();
      const osInfo = {
        type: await os.type(),
        arch: await os.arch(),
        version: await os.version(),
      };

      message(
        `${appName}\nVersion: ${appVersion}\nTauri: ${tauriVersion}\nOS: ${osInfo.type} ${osInfo.arch} ${osInfo.version}`,
        "About"
      );
    };

    printAbout();
  },
};
