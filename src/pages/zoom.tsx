// ズームできる値のリスト(ブラウザのズームと同じ)
const zoomOptions = [
  25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500,
];

let zoomIndex = 7; // 100%

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
      console.log("up");
    } else {
      if (zoomIndex > 0) {
        zoomIndex -= 1;
      }
      console.log("down");
    }
    document.body.style.zoom = zoomOptions[zoomIndex] + "%";
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
    document.body.style.zoom = zoomOptions[zoomIndex] + "%";
  }
}

export { handleWheel, handleKeyDown };
