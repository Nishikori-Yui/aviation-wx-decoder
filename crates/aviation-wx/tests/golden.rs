use std::fs;
use std::path::PathBuf;

use aviation_wx::{decode_message, DecodeOptions, DetailLevel, MessageType};
use serde::Serialize;

fn load_fixtures(subdir: &str) -> Vec<(String, String)> {
    let base = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("tests")
        .join("fixtures")
        .join(subdir);
    let mut entries: Vec<_> = fs::read_dir(base)
        .expect("fixtures dir")
        .filter_map(|entry| entry.ok())
        .collect();
    entries.sort_by_key(|entry| entry.file_name());
    entries
        .into_iter()
        .map(|entry| {
            let name = entry.file_name().to_string_lossy().to_string();
            let content = fs::read_to_string(entry.path()).expect("fixture file");
            (name, content)
        })
        .collect()
}

#[derive(Serialize)]
struct GoldenRecord {
    name: String,
    message_type: MessageType,
    detected_type: MessageType,
    explain: String,
    warnings: Vec<aviation_wx::Issue>,
    errors: Vec<aviation_wx::Issue>,
    has_parsed: bool,
    has_normalized: bool,
}

fn decode_all(subdir: &str, type_hint: MessageType) -> Vec<GoldenRecord> {
    let fixtures = load_fixtures(subdir);
    let options = DecodeOptions {
        type_hint,
        lang: "zh-CN".to_string(),
        detail: DetailLevel::Normal,
        output_json: true,
        output_explain: true,
    };
    fixtures
        .into_iter()
        .map(|(name, content)| {
            let response = decode_message(&content, &options);
            GoldenRecord {
                name,
                message_type: response.message_type,
                detected_type: response.detected_type,
                explain: response.explain.unwrap_or_default(),
                warnings: response.warnings,
                errors: response.errors,
                has_parsed: response.parsed.is_some(),
                has_normalized: response.normalized.is_some(),
            }
        })
        .collect()
}

#[test]
fn golden_taf() {
    let results = decode_all("taf", MessageType::Unknown);
    insta::assert_json_snapshot!("taf_golden", results);
}

#[test]
fn golden_metar() {
    let results = decode_all("metar", MessageType::Unknown);
    insta::assert_json_snapshot!("metar_golden", results);
}

#[test]
fn golden_notam() {
    let results = decode_all("notam", MessageType::Unknown);
    insta::assert_json_snapshot!("notam_golden", results);
}

