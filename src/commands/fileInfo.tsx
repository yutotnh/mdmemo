import { getName } from "@tauri-apps/api/app";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { ICommand } from "@uiw/react-md-editor";
import { useEffect } from "react";
import { atom, useRecoilState } from "recoil";
import { watchImmediate } from "tauri-plugin-fs-watch-api";
import { appendStopWatcher, execAllStopWatcher } from "../watchFile";

export const filePathState = atom({
  key: "filePathState",
  default: "",
});

export const fileNameState = atom({
  key: "fileNameState",
  default: "",
});

/**
 * ファイル名とパスを表示するコマンド
 */
export const fileInfo: ICommand = {
  name: "file-info",
  keyCommand: "fileInfo",

  render: () => {
    const [filePath, setFilePath] = useRecoilState(filePathState);
    const [fileName, setFileName] = useRecoilState(fileNameState);
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
      invoke("get_path")
        .then((response) => {
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
            execAllStopWatcher();
            appendStopWatcher(response);
          });
        })
        // ファイルにアクセスできない場合は何もしない
        .catch(() => {
          // ファイル名をリセットする
          setFileInfo();

          // ファイルの変更を監視しているwatcherを停止する
          execAllStopWatcher();
        });
    }, []);

    setFileInfo();

    return (
      <span
        id="titlebar-file-info"
        aria-label={filePath}
        title={filePath}
        data-tauri-drag-region // メニュバーが狭いため、表示だけする本コマンドをドラッグ可能にする
      >
        {fileName}
      </span>
    );
  },
};
