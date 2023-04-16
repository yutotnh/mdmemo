#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    fs,
    io::{Read, Seek, Write},
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

struct File(Mutex<std::fs::File>);

trait FileReadWrite {
    fn open(&self, path: String);
    fn read(&self) -> String;
    fn write(&self, content: String);
}

impl FileReadWrite for File {
    fn open(&self, path: String) {
        let mut file = self.0.lock().unwrap();
        *file = std::fs::OpenOptions::new()
            .create(true)
            .read(true)
            .write(true)
            .open(path)
            .unwrap();
    }

    fn read(&self) -> String {
        let mut file = self.0.lock().unwrap();

        let mut contents = String::new();
        file.rewind().unwrap();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn write(&self, content: String) {
        let mut file = self.0.lock().unwrap();
        file.set_len(0).unwrap();
        file.rewind().unwrap();
        file.write_all(content.as_bytes()).unwrap();
    }
}

#[tauri::command]
fn open_file(path: String, file: State<File>) -> String {
    file.open(path);

    file.read()
}

#[tauri::command]
fn create_file(path: String, file: State<File>) {
    file.open(path);
}

#[tauri::command]
fn get_file(file: State<File>) -> String {
    file.read()
}

#[tauri::command]
fn overwrite_file(content: String, file: State<File>) {
    file.write(content);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close_window,
            zoom_window,
            open_file,
            create_file,
            overwrite_file,
            get_file
        ])
        .manage(File(Mutex::new(tempfile::tempfile().unwrap())))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
