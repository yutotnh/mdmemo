import { invoke } from "@tauri-apps/api/tauri";

// ズームできる値のリスト(ブラウザのズームと同じ)
const zoomOptions = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5,
  3.0, 4.0, 5.0,
];

let zoomIndex = 7; // 1.00

/**
 * Ctrl + ホイールでフォントサイズを変更
 * @param e React.WheelEvent<HTMLDivElement>
 */
async function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
  if (e.ctrlKey) {
    // className='w-md-editor-content' の font-size を取得
    if (e.deltaY < 0) {
      if (zoomIndex < zoomOptions.length - 1) {
        zoomIndex += 1;
      }
    } else {
      if (zoomIndex > 0) {
        zoomIndex -= 1;
      }
    }

    invoke("zoom_window", { factor: zoomOptions[zoomIndex] });
  }
}

/**
 * Ctrl + Plus/Minus でフォントサイズを変更
 * @param e React.KeyboardEvent<HTMLDivElement>
 */
async function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.ctrlKey) {
    if (e.key === "+") {
      if (zoomIndex < zoomOptions.length - 1) {
        zoomIndex += 1;
      }
    } else if (e.key === "-") {
      if (zoomIndex > 0) {
        zoomIndex -= 1;
      }
    }

    invoke("zoom_window", { factor: zoomOptions[zoomIndex] });
  }
}

export { handleWheel, handleKeyDown };
