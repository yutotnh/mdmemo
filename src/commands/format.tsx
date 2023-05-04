import { ICommand, commands } from "@uiw/react-md-editor";
import { remark } from "remark";

/**
 * テキストをフォーマットするコマンド
 */
export const format: ICommand = {
  name: "format",
  keyCommand: "format",
  shortcuts: "alt+shift+f",
  buttonProps: {
    "aria-label": "Format Document (Alt+Shift+F)",
    title: "Format Document(Alt+Shift+F)",
  },
  icon: <span id="titlebar-format">Format</span>,
  execute: (state: commands.ExecuteState, api: commands.TextAreaTextApi) => {
    // フォーマット前後でカーソル位置を保持するために、
    // フォーマット前のテキストのカーソル位置にマークをつける
    api.setSelectionRange({
      start: state.selection.end,
      end: state.selection.end,
    });
    let mark = "<!-- CURSOR_POSITION -->";
    let text =
      state.text.slice(0, state.selection.end) +
      mark +
      state.text.slice(state.selection.end);

    // フォーマット前に基づくフォーマット後のカーソル位置を取得
    let cursor = remark().processSync(text).toString().indexOf(mark);

    const formatted = remark().processSync(state.text).toString();
    api.setSelectionRange({ start: 0, end: state.text.length });
    api.replaceSelection(formatted);

    api.setSelectionRange({ start: cursor, end: cursor });
  },
};
