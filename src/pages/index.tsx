import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { commands, PreviewType } from "@uiw/react-md-editor";
import * as zoom from "./zoom";
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

function App() {
  const [value, setValue] = useState("**Hello world!!!**");
  const [preview, setPreview] = useState<PreviewType>("live");
  const [hiddenToolbar, setHiddenToolbar] = useState(false);

  if (process.browser) {
    window.onblur = () => {
      setHiddenToolbar(true);
      setPreview("preview");
    };

    window.onfocus = () => {
      setHiddenToolbar(false);
      setPreview("edit");
    };
  }

  return (
    <div>
      <MDEditor
        value={value}
        onChange={setValue}
        fullscreen={true}
        preview={preview}
        hideToolbar={hiddenToolbar}
        // commands で欲しいコマンドを指定するとエラーになるため、フィルターで除外する
        // なぜか list 系のコマンドは除外できない
        commandsFilter={(cmd) => {
          if (
            /(bold|italic|title|link|quote|code|codeblock|image|divider|unorderedListCommand|orderedListCommand|checkedListCommand|fullscreen)/.test(
              cmd.name
            )
          ) {
            return false;
          }
          return cmd;
        }}
        onWheel={zoom.handleWheel}
        onKeyDown={zoom.handleKeyDown}
        className="w-md-editor-fullscreen" // 常にフルスクリーンにする
      />
    </div>
  );
}

export default App;
