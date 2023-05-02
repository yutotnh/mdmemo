#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod file;

use std::sync::Mutex;

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

/// A file that can be read and written to
struct IsAlwaysOnTop(Mutex<bool>);

#[tauri::command]
fn set_always_on_top(is_always_on_top: bool, state_always_on_top: tauri::State<IsAlwaysOnTop>) {
    *state_always_on_top.0.lock().unwrap() = is_always_on_top;
}

#[tauri::command]
fn get_always_on_top(state_always_on_top: tauri::State<IsAlwaysOnTop>) -> bool {
    *state_always_on_top.0.lock().unwrap()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs_watch::init())
        .invoke_handler(tauri::generate_handler![
            zoom_window,
            set_always_on_top,
            get_always_on_top,
            file::command::set_path,
            file::command::read_file,
            file::command::write_file,
            file::command::get_path,
        ])
        .manage(file::File {
            path: Mutex::new(String::new()),
            contents: Mutex::new(String::new()),
        })
        .manage(IsAlwaysOnTop(Mutex::new(false)))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
