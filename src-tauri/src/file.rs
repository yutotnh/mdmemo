use std::{
    io::{Read, Write},
    sync::Mutex,
};

/// A file that can be read and written to
pub struct File {
    /// The path of the file
    pub path: Mutex<String>,

    /// The contents of the file
    pub contents: Mutex<String>,
}

/// A trait that allows reading and writing to a file
trait FileReadWrite {
    /// Sets the path of the file
    fn set_path(&self, path: String);

    /// Gets the path of the file
    fn get_path(&self) -> String;

    /// Reads the file
    fn read(&self) -> Result<String, std::io::Error>;

    /// Writes to the file
    fn write(&self, content: String) -> Result<(), std::io::Error>;
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

    /// Creates a file
    #[tauri::command]
    pub fn set_path(path: String, file: State<File>) {
        file.set_path(path);
    }

    /// Opens a file
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

    /// Overwrites the contents of a file
    #[tauri::command]
    pub fn write_file(
        contents: String,
        file: State<File>,
        window: tauri::Window,
    ) -> Result<(), String> {
        match file.write(contents) {
            Ok(_) => Ok(()),
            Err(e) => {
                tauri::api::dialog::message(Some(&window), "Error", e.to_string());
                file.set_path(String::new());
                Err(e.to_string())
            }
        }
    }

    /// Gets the filename of a file
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
