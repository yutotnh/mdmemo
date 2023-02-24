#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    io::{Read, Write},
    sync::Mutex,
};
use tauri::State;

#[tauri::command]
fn close_window(window: tauri::Window) {
    window.close().unwrap();
}

#[tauri::command]
fn zoom_window(window: tauri::Window, factor: f64) {
    let _ = window.with_webview(move |webview| {
        #[cfg(target_os = "linux")]
        {
            // see https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/struct.WebView.html
            // and https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/trait.WebViewExt.html
            use webkit2gtk::traits::WebViewExt;
            webview.inner().set_zoom_level(factor);
        }

        #[cfg(windows)]
        unsafe {
            // see https://docs.rs/webview2-com/0.19.1/webview2_com/Microsoft/Web/WebView2/Win32/struct.ICoreWebView2Controller.html
            webview.controller().SetZoomFactor(factor).unwrap();
        }

        #[cfg(target_os = "macos")]
        unsafe {
            use objc::{msg_send, sel, sel_impl};
            let () = msg_send![webview.inner(), setPageZoom: factor];
        }
    });
}

struct Path(Mutex<String>);

#[tauri::command]
fn openfile(path: String, state_path: State<Path>) -> String {
    let mut file_path = state_path.0.lock().unwrap();

    *file_path = path.clone();

    let mut file = std::fs::File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}

#[tauri::command]
fn savefile(path: String, content: String, state_path: State<Path>) {
    let mut file_path = state_path.0.lock().unwrap();
    *file_path = path.clone();

    let mut file = std::fs::File::create(path).unwrap();
    file.write_all(content.as_bytes()).unwrap();
}

#[tauri::command]
fn getfile(path: State<Path>) -> String {
    if path.0.lock().unwrap().as_str().is_empty() {
        return "".to_string();
    }

    let mut file = std::fs::File::open(path.0.lock().unwrap().as_str()).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}

#[tauri::command]
fn overwritefile(path: State<Path>, content: String) {
    if path.0.lock().unwrap().as_str().is_empty() {
        return;
    }

    let mut file = std::fs::File::create(path.0.lock().unwrap().as_str()).unwrap();
    file.write_all(content.as_bytes()).unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close_window,
            zoom_window,
            openfile,
            savefile,
            overwritefile,
            getfile
        ])
        .manage(Path(Mutex::new(String::new())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
