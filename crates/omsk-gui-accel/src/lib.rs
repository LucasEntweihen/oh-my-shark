use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

/// Default directories skipped during fast workspace tree scanning.
const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "out",
    "target",
    ".next",
    ".turbo",
    ".cache",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorkspaceEntry {
    pub path: String,
    pub is_dir: bool,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionHeader {
    pub id: String,
    pub title: Option<String>,
    pub line_count: usize,
}

/// Fast workspace directory scanner that skips heavy build/vendor directories.
pub fn scan_workspace(root: &Path, max_entries: usize) -> Vec<WorkspaceEntry> {
    let mut results = Vec::with_capacity(max_entries.min(256));
    let mut stack: Vec<PathBuf> = vec![root.to_path_buf()];

    while let Some(dir) = stack.pop() {
        let Ok(read_dir) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in read_dir.flatten() {
            if results.len() >= max_entries {
                return results;
            }
            let file_name = entry.file_name();
            let name = file_name.to_string_lossy();
            let Ok(meta) = entry.metadata() else {
                continue;
            };
            let is_dir = meta.is_dir();
            if is_dir && IGNORED_DIRS.contains(&name.as_ref()) {
                continue;
            }
            let full_path = entry.path();
            if let Ok(rel) = full_path.strip_prefix(root) {
                results.push(WorkspaceEntry {
                    path: rel.to_string_lossy().replace('\\', "/"),
                    is_dir,
                    size_bytes: if is_dir { 0 } else { meta.len() },
                });
            }
            if is_dir {
                stack.push(full_path);
            }
        }
    }
    results
}

/// Extracts session header metadata from a JSONL file without parsing the entire file.
pub fn read_session_header(path: &Path) -> Option<SessionHeader> {
    let file = File::open(path).ok()?;
    let reader = BufReader::new(file);
    let mut line_count = 0usize;
    let mut title: Option<String> = None;

    for line in reader.lines().map_while(Result::ok) {
        line_count += 1;
        if title.is_none() && line_count <= 8 {
            if let Some(idx) = line.find("\"title\":\"") {
                let rest = &line[idx + 9..];
                if let Some(end) = rest.find('"') {
                    title = Some(rest[..end].to_string());
                }
            }
        }
    }

    let id = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    Some(SessionHeader {
        id,
        title,
        line_count,
    })
}

/// Pre-computes a procedural wave height row for the Ocean Shark Aquarium.
pub fn compute_wave_row(cols: usize, elapsed: f32, amplitude: f32) -> Vec<f32> {
    let mut out = Vec::with_capacity(cols);
    for c in 0..cols {
        let phase = (c as f32) * 0.18 + elapsed * 1.4;
        out.push(phase.sin() * amplitude);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wave_row_matches_cols_and_bounds() {
        let row = compute_wave_row(64, 1.5, 2.0);
        assert_eq!(row.len(), 64);
        assert!(row.iter().all(|v| v.abs() <= 2.0001));
    }

    #[test]
    fn scan_workspace_skips_ignored_dirs() {
        let entries = scan_workspace(Path::new("."), 50);
        assert!(!entries.iter().any(|e| e.path.starts_with("target/")));
    }
}
