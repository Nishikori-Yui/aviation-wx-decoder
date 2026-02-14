use aviation_wx_core as core;

pub use core::*;
pub use aviation_wx_metar::{decode_metar, normalize_metar, parse_metar, translate_metar};
pub use aviation_wx_notam::{decode_notam, normalize_notam, parse_notam, translate_notam};
pub use aviation_wx_taf::{decode_taf, normalize_taf, parse_taf, translate_taf};

#[derive(Debug, Clone)]
pub struct DecodeOptions {
    pub type_hint: core::MessageType,
    pub lang: String,
    pub detail: core::DetailLevel,
    pub output_json: bool,
    pub output_explain: bool,
}

impl Default for DecodeOptions {
    fn default() -> Self {
        Self {
            type_hint: core::MessageType::Unknown,
            lang: "zh-CN".to_string(),
            detail: core::DetailLevel::Normal,
            output_json: true,
            output_explain: true,
        }
    }
}

pub fn decode_message(raw: &str, options: &DecodeOptions) -> core::DecodeResponse {
    let sanitized_raw = raw.trim_start_matches('\u{FEFF}');
    let detected = core::detect_message_type(sanitized_raw);
    let requested = options.type_hint;
    let target = if requested == core::MessageType::Unknown {
        detected
    } else {
        requested
    };

    let mut response = match target {
        core::MessageType::Taf => aviation_wx_taf::decode_taf(sanitized_raw, options.detail, &options.lang),
        core::MessageType::Metar => aviation_wx_metar::decode_metar(sanitized_raw, options.detail, &options.lang),
        core::MessageType::Notam => aviation_wx_notam::decode_notam(sanitized_raw, options.detail, &options.lang),
        core::MessageType::Unknown => core::DecodeResponse {
            schema_version: "1.0".to_string(),
            message_type: core::MessageType::Unknown,
            requested_type: requested,
            detected_type: detected,
            final_type: core::MessageType::Unknown,
            raw: sanitized_raw.trim().to_string(),
            parsed: None,
            normalized: None,
            explain: None,
            warnings: vec![core::issue(
                "type_unknown",
                "Unable to determine message type.",
                None,
            )],
            errors: Vec::new(),
            warnings_legacy: None,
            errors_legacy: None,
        },
    };

    response.requested_type = requested;
    response.detected_type = detected;
    response.final_type = target;
    response.message_type = target;

    if requested != core::MessageType::Unknown && detected != core::MessageType::Unknown && requested != detected {
        response.warnings.push(core::issue(
            "type_mismatch",
            format!(
                "Requested type {} but detected {}. Parsed using requested type.",
                requested, detected
            ),
            None,
        ));
        if options.detail == core::DetailLevel::Full {
            if let Some(explain) = response.explain.as_mut() {
                let note = format!(
                    "提示：请求类型为 {}，检测为 {}，已按请求类型解析。\n",
                    requested, detected
                );
                explain.insert_str(0, &note);
            }
        }
    }

    if !options.output_json {
        response.parsed = None;
        response.normalized = None;
    }
    if !options.output_explain {
        response.explain = None;
    }

    let (warnings_legacy, errors_legacy) =
        core::finalize_issues(&mut response.warnings, &mut response.errors);
    response.warnings_legacy = warnings_legacy;
    response.errors_legacy = errors_legacy;

    response
}

