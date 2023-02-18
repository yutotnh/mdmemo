#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Window;

#[tauri::command]
fn close_window(window: Window) {
    window.close().unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![close_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
