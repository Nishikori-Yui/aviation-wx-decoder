use aviation_wx::{decode_message, DecodeOptions, DetailLevel, MessageType};

fn default_options() -> DecodeOptions {
    DecodeOptions {
        type_hint: MessageType::Unknown,
        lang: "zh-CN".to_string(),
        detail: DetailLevel::Normal,
        output_json: true,
        output_explain: true,
    }
}

#[test]
fn auto_detects_metar_with_bom() {
    let input = "\u{FEFF}METAR RJTT 011200Z VRB03KT CAVOK 15/10 Q1017";
    let response = decode_message(input, &default_options());
    assert_eq!(response.detected_type, MessageType::Metar);
    assert_eq!(response.final_type, MessageType::Metar);
    assert_eq!(response.message_type, MessageType::Metar);
    assert!(!response.raw.starts_with('\u{FEFF}'));
}

#[test]
fn auto_detects_taf_with_bom() {
    let input = "\u{FEFF}TAF ZBAA 011130Z 0112/0218 06005MPS 9999 FEW020 SCT040";
    let response = decode_message(input, &default_options());
    assert_eq!(response.detected_type, MessageType::Taf);
    assert_eq!(response.final_type, MessageType::Taf);
    assert_eq!(response.message_type, MessageType::Taf);
    assert!(!response.raw.starts_with('\u{FEFF}'));
}

#[test]
fn auto_detects_notam_with_bom() {
    let input =
        "\u{FEFF}A1234/24 NOTAMN Q) ZSHA/QMRLC/IV/NBO/A/000/999/3112N12130E005 A) ZSPD B) 2402010000 C) 2402012359 E) RWY 17L/35R CLSD";
    let response = decode_message(input, &default_options());
    assert_eq!(response.detected_type, MessageType::Notam);
    assert_eq!(response.final_type, MessageType::Notam);
    assert_eq!(response.message_type, MessageType::Notam);
    assert!(!response.raw.starts_with('\u{FEFF}'));
}
