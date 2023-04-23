#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    io::{Read, Write},
    sync::Mutex,
};

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

/// A file that can be read and written to
pub struct File {
    /// The path of the file
    path: Mutex<String>,

    /// The contents of the file
    contents: Mutex<String>,
}

/// A trait that allows reading and writing to a file
trait FileReadWrite {
    /// Sets the path of the file
    fn path(&self, path: String);

    /// Reads the file
    fn read(&self) -> String;

    /// Writes to the file
    fn write(&self, content: String);
}

impl FileReadWrite for File {
    fn path(&self, path: String) {
        *self.path.lock().unwrap() = path;
    }

    fn read(&self) -> String {
        let file_path = self.path.lock().unwrap();

        if file_path.is_empty() {
            return self.contents.lock().unwrap().clone();
        }

        let mut file = std::fs::File::open(file_path.as_str()).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn write(&self, contents: String) {
        let file_path = self.path.lock().unwrap();

        *self.contents.lock().unwrap() = contents.clone();

        if !file_path.is_empty() {
            let mut file = std::fs::File::create(file_path.as_str()).unwrap();
            file.write_all(contents.as_bytes()).unwrap();
        }
    }
}

/// Commands that can be invoked from JS
pub mod command {
    use tauri::State;

    use super::*;

    /// Opens a file
    #[tauri::command]
    pub fn open_file(path: String, file: State<File>) -> String {
        file.path(path);

        file.read()
    }

    /// Creates a file
    #[tauri::command]
    pub fn create_file(path: String, file: State<File>) {
        file.path(path);
    }

    /// Gets the contents of a file
    #[tauri::command]
    pub fn get_file(file: State<File>) -> String {
        file.read()
    }

    /// Overwrites the contents of a file
    #[tauri::command]
    pub fn overwrite_file(contents: String, file: State<File>) {
        file.write(contents);
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            close_window,
            zoom_window,
            command::open_file,
            command::create_file,
            command::overwrite_file,
            command::get_file
        ])
        .manage(File {
            path: Mutex::new(String::new()),
            contents: Mutex::new(String::new()),
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
