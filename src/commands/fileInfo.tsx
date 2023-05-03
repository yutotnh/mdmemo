import { getName } from "@tauri-apps/api/app";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useEffect, useState } from "react";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { appendStopWatcher } from "../watchFile";

/**
 * ファイル名とパスを表示するコマンド
 */
export const fileInfo: ICommand = {
  name: "file info",
  keyCommand: "fileInfo",

  render: () => {
    const [filePath, setFilePath] = useState("");
    const [fileName, setFileName] = useState("");
    useEffect(() => {
      setFileInfo();
    }, []);

    /**
     * タイトルバーのファイル名とウィンドウのタイトルを更新する
     *
     * ウィンドウのタイトルは "ファイル名 - アプリ名" とする
     */
    function setFileInfo() {
      invoke("get_path")
        .then((response) => {
          setFilePath(response as string);

          basename(response as string).then((basename) => {
            if (typeof basename != "string") return;

            setFileName(basename);

            getName().then((name) => {
              appWindow.setTitle(`${basename} - ${name}`);
            });
          });
        })
        .catch(() => {
          // VSCodeのように、タイトルバーのファイル名の後ろに●をつけ、
          // ウィンドウのタイトルは "● Untitled - アプリ名" とする
          setFileName("Untitled ●");
          setFilePath("");

          getName().then((name) => {
            appWindow.setTitle(`●  Untitled - ${name}`);
          });
        });
    }

    useEffect(() => {
      invoke("get_path").then((response) => {
        // ファイルの変更を監視して、ファイルが変更されたらファイルを読み込む
        watchImmediate(
          [response as string],
          () => {
            invoke("read_file").catch(() => {
              // ファイルにアクセスできない場合はファイル名をリセットする
              setFileInfo();
            });
          },
          {}
        ).then((response) => {
          appendStopWatcher(response);
        });
      });
    }, []);

    setFileInfo();

    return (
      <span id="titlebar-file-path" aria-label={filePath} title={filePath}>
        {fileName}
      </span>
    );
  },
};
