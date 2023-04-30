#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    io::{Read, Write},
    sync::Mutex,
};

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

    /// Gets the path of the file
    fn get_path(&self) -> String;

    /// Reads the file
    fn read(&self) -> Result<String, std::io::Error>;

    /// Writes to the file
    fn write(&self, content: String) -> Result<(), std::io::Error>;
}

impl FileReadWrite for File {
    fn path(&self, path: String) {
        *self.path.lock().unwrap() = path;
    }

    fn get_path(&self) -> String {
        self.path.lock().unwrap().clone()
    }

    fn read(&self) -> Result<String, std::io::Error> {
        let file_path = self.path.lock().unwrap();

        if file_path.is_empty() {
            return Ok(self.contents.lock().unwrap().clone());
        }

        let mut file = std::fs::File::open(file_path.as_str()).unwrap();
        let mut contents = String::new();
        match file.read_to_string(&mut contents) {
            Ok(_) => Ok(contents),
            Err(e) => Err(e),
        }
    }

    fn write(&self, contents: String) -> Result<(), std::io::Error> {
        let file_path = self.path.lock().unwrap();

        *self.contents.lock().unwrap() = contents.clone();

        if !file_path.is_empty() {
            let mut file = match std::fs::File::create(file_path.as_str()) {
                Ok(file) => file,
                Err(e) => return Err(e),
            };

            match file.write_all(contents.as_bytes()) {
                Ok(_) => return Ok(()),
                Err(e) => return Err(e),
            }
        }

        Ok(())
    }
}

/// Commands that can be invoked from JS
pub mod command {
    use tauri::State;

    use super::*;

    /// Opens a file
    #[tauri::command]
    pub fn open_file(path: String, file: State<File>, window: tauri::Window) -> String {
        file.path(path);

        match file.read() {
            Ok(contents) => contents,
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.path(String::new());
                String::new()
            }
        }
    }

    /// Creates a file
    #[tauri::command]
    pub fn create_file(path: String, file: State<File>) {
        file.path(path);
    }

    /// Gets the contents of a file
    #[tauri::command]
    pub fn get_file(file: State<File>, window: tauri::Window) -> String {
        match file.read() {
            Ok(contents) => contents,
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.path(String::new());
                String::new()
            }
        }
    }

    /// Overwrites the contents of a file
    #[tauri::command]
    pub fn overwrite_file(contents: String, file: State<File>, window: tauri::Window) {
        match file.write(contents) {
            Ok(_) => (),
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.path(String::new());
            }
        }
    }

    /// Gets the filename of a file
    #[tauri::command]
    #[warn(clippy::result_unit_err)]
    pub fn get_path(file: State<File>) -> Result<String, String> {
        if file.get_path() == "" {
            return Err(String::new());
        }

        let path = file.get_path();
        let path = std::path::Path::new(&path);

        Ok(path.to_str().unwrap().to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            zoom_window,
            command::open_file,
            command::create_file,
            command::overwrite_file,
            command::get_file,
            command::get_path,
        ])
        .manage(File {
            path: Mutex::new(String::new()),
            contents: Mutex::new(String::new()),
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
