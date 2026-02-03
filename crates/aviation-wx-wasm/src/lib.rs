use aviation_wx::{decode_message, DecodeOptions, DetailLevel, MessageType};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn decode_json(raw: &str, type_hint: &str) -> Result<String, JsValue> {
    let type_hint = match type_hint.to_ascii_lowercase().as_str() {
        "taf" => MessageType::Taf,
        "metar" => MessageType::Metar,
        "notam" => MessageType::Notam,
        _ => MessageType::Unknown,
    };

    let options = DecodeOptions {
        type_hint,
        lang: "en".to_string(),
        detail: DetailLevel::Normal,
        output_json: true,
        output_explain: false,
    };

    let response = decode_message(raw, &options);
    let json = serde_json::to_string(&response).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(json)
}
