import { watch, watchImmediate } from "tauri-plugin-fs-watch-api";

let stopWatchers: (() => void)[] = [];

/**
 * ファイルの監視をやめるための関数を追加する
 */
export function appendStopWatcher(stopWatcher: () => void) {
    stopWatchers.push(stopWatcher);
}

/**
 * 全ての監視をやめる
 */
export function execAllStopWatcher() {
    stopWatchers.forEach((stopWatcher) => stopWatcher());
}
