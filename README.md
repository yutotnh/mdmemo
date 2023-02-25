<div align="center">

<img src="documents/icon.svg" width="250">

[![CodeQL](https://github.com/yutotnh/mdmemo/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/yutotnh/mdmemo/actions/workflows/github-code-scanning/codeql)
[![test-on-pr](https://github.com/yutotnh/mdmemo/actions/workflows/build-test.yml/badge.svg)](https://github.com/yutotnh/mdmemo/actions/workflows/build-test.yml)

</div>

# MDMemo

Markdown対応の小さなメモ帳

[Tauri](https://tauri.app/) + [react-md-editor](https://uiwjs.github.io/react-md-editor/) を利用しています

## 画面

編集モードとプレビューモードが存在します

ウィンドウがアクティブウィンドウの場合に編集モードになり、非アクティブウィンドウの時にプレビューモードになります

- 編集モード

    <img src="documents/edit.png" alt="Edit image" width="400">

- プレビューモード

    <img src="documents/preview.png" alt="Preview image" width="400">

## Development

リポジトリを持ってきてアプリケーションを起動するまでの流れは以下の通りです

```console
git clone https://github.com/yutotnh/mdmemo.git
cd mdmemo
yarn install
yarn tauri dev
```
