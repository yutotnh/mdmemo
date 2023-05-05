use std::{
    io::{Read, Write},
    sync::Mutex,
};

/// A file that can be read and written to
pub struct File {
    /// The path of the file
    ///
    /// If this is empty, the file is not saved to disk
    pub path: Mutex<String>,

    /// The contents of the file
    ///
    /// This is only used if the file is not saved to disk
    pub contents: Mutex<String>,
}

/// A trait that allows reading and writing to a file
trait FileReadWrite {
    /// Sets the path of the file
    ///
    /// * `path` - The path of the file
    fn set_path(&self, path: String);

    /// Gets the path of the file
    fn get_path(&self) -> String;

    /// Reads the file
    fn read(&self) -> Result<String, std::io::Error>;

    /// Saves the contents to write to a file
    fn save_contents(&self, contents: String);

    /// Writes to the file
    fn write(&self) -> Result<(), std::io::Error>;
}

impl FileReadWrite for File {
    fn set_path(&self, path: String) {
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

        let mut file = match std::fs::File::open(file_path.as_str()) {
            Ok(file) => file,
            Err(e) => return Err(e),
        };

        let mut contents = String::new();
        match file.read_to_string(&mut contents) {
            Ok(_) => {
                self.save_contents(contents.clone());
                Ok(contents)
            }
            Err(e) => Err(e),
        }
    }

    fn save_contents(&self, contents: String) {
        *self.contents.lock().unwrap() = contents;
    }

    fn write(&self) -> Result<(), std::io::Error> {
        let file_path = self.path.lock().unwrap();

        if !file_path.is_empty() {
            let mut file = match std::fs::File::create(file_path.as_str()) {
                Ok(file) => file,
                Err(e) => return Err(e),
            };

            let contents = self.contents.lock().unwrap();
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

    /// Creates a file
    ///
    /// * `path` - The path of the file
    /// * `file` - The file state
    #[tauri::command]
    pub fn set_path(path: String, file: State<File>) {
        file.set_path(path);
    }

    /// Opens a file
    ///
    /// * `file` - The file state
    /// * `window` - The window to open the file dialog in
    #[tauri::command]
    pub fn read_file(file: State<File>, window: tauri::Window) -> Result<String, String> {
        match file.read() {
            Ok(contents) => Ok(contents),
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.set_path(String::new());
                Err(e.to_string())
            }
        }
    }

    /// Saves the contents to write to a file
    #[tauri::command]
    pub fn save_contents(contents: String, file: State<File>) {
        file.save_contents(contents);
    }

    /// Overwrites the contents of a file
    ///
    /// * `contents` - The contents to write to the file
    /// * `file` - The file state
    /// * `window` - The window to open the file dialog in
    #[tauri::command]
    pub fn write_file(file: State<File>, window: tauri::Window) -> Result<(), String> {
        match file.write() {
            Ok(_) => Ok(()),
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.set_path(String::new());
                Err(e.to_string())
            }
        }
    }

    /// Gets the filename of a file
    ///
    /// * `file` - The file state
    #[tauri::command]
    pub fn get_path(file: State<File>) -> Result<String, String> {
        if file.get_path() == "" {
            return Err(String::new());
        }

        let path = file.get_path();
        let path = std::path::Path::new(&path);

        Ok(path.to_str().unwrap().to_string())
    }
}
