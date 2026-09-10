use serde::Serialize;
use sysinfo::System;

#[derive(Debug, Serialize)]
struct SystemInfo {
  system: String,
  cpu: String,
  total_memory: String,
}

#[tauri::command]
fn system_info() -> SystemInfo {
  let mut system = System::new_all();
  system.refresh_all();

  let name = System::name().unwrap_or_else(|| std::env::consts::OS.to_string());
  let version = System::os_version().unwrap_or_default();
  let system_name = if version.is_empty() { name } else { format!("{name} {version}") };
  let cpu = system.cpus().first()
    .map(|processor| processor.brand().trim().to_string())
    .filter(|brand| !brand.is_empty())
    .unwrap_or_else(|| "Unknown CPU".to_string());
  let total_memory = format!("{:.2}GB", system.total_memory() as f64 / 1024.0_f64.powi(3));

  SystemInfo { system: format!("{system_name} {}", std::env::consts::ARCH), cpu, total_memory }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![system_info])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
