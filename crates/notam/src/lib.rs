use aviation_wx_core::{ finalize_issues, issue_from_legacy,
    DecodeResponse, DetailLevel, MessageType, NotamNormalized, NotamParsed,
};
use regex::Regex;

pub fn parse_notam(raw: &str) -> (NotamParsed, Vec<String>) {
    let mut warnings = Vec::new();
    let normalized_raw = raw.replace("\r\n", "\n").replace('\r', "\n");
    let raw_lines: Vec<String> = normalized_raw
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect();

    let upper = normalized_raw.to_ascii_uppercase();
    let tag_re = Regex::new(r"(Q\)|A\)|B\)|C\)|D\)|E\)|F\)|G\))").unwrap();
    let mut positions: Vec<(usize, String)> = tag_re
        .find_iter(&upper)
        .map(|m| (m.start(), m.as_str().to_string()))
        .collect();
    positions.sort_by_key(|(pos, _)| *pos);

    let mut q_line = None;
    let mut a = None;
    let mut b = None;
    let mut c = None;
    let mut d = None;
    let mut e = None;
    let mut f = None;
    let mut g = None;

    if positions.is_empty() {
        warnings.push("No NOTAM tags found; parsed as raw lines.".to_string());
    }

    for idx in 0..positions.len() {
        let (start, tag) = &positions[idx];
        let tag_len = tag.len();
        let end = if idx + 1 < positions.len() {
            positions[idx + 1].0
        } else {
            upper.len()
        };
        let content = normalized_raw
            .get(start + tag_len..end)
            .unwrap_or("")
            .trim()
            .to_string();
        match tag.as_str() {
            "Q)" => q_line = if content.is_empty() { None } else { Some(content) },
            "A)" => a = if content.is_empty() { None } else { Some(content) },
            "B)" => b = if content.is_empty() { None } else { Some(content) },
            "C)" => c = if content.is_empty() { None } else { Some(content) },
            "D)" => d = if content.is_empty() { None } else { Some(content) },
            "E)" => e = if content.is_empty() { None } else { Some(content) },
            "F)" => f = if content.is_empty() { None } else { Some(content) },
            "G)" => g = if content.is_empty() { None } else { Some(content) },
            _ => {}
        }
    }

    (
        NotamParsed {
            q_line,
            a,
            b,
            c,
            d,
            e,
            f,
            g,
            raw_lines,
        },
        warnings,
    )
}

pub fn normalize_notam(parsed: &NotamParsed) -> NotamNormalized {
    NotamNormalized {
        q_line: parsed.q_line.clone(),
        a: parsed.a.clone(),
        b: parsed.b.clone(),
        c: parsed.c.clone(),
        d: parsed.d.clone(),
        e: parsed.e.clone(),
        f: parsed.f.clone(),
        g: parsed.g.clone(),
    }
}

pub fn translate_notam(normalized: &NotamNormalized, detail: DetailLevel, lang: &str) -> String {
    if lang != "zh-CN" {
        return "Translation only supports zh-CN for now.".to_string();
    }

    let mut parts = Vec::new();
    if let Some(a) = &normalized.a {
        parts.push(format!("地点 {}", a));
    }
    if let Some(b) = &normalized.b {
        parts.push(format!("生效 {}", b));
    }
    if let Some(c) = &normalized.c {
        parts.push(format!("终止 {}", c));
    }
    if let Some(e) = &normalized.e {
        parts.push(format!("内容 {}", e));
    }
    if detail == DetailLevel::Full {
        if let Some(q) = &normalized.q_line {
            parts.push(format!("Q 行 {}", q));
        }
        if let Some(d) = &normalized.d {
            parts.push(format!("D {}", d));
        }
        if let Some(f) = &normalized.f {
            parts.push(format!("F {}", f));
        }
        if let Some(g) = &normalized.g {
            parts.push(format!("G {}", g));
        }
    }

    if parts.is_empty() {
        "未提取到常见 NOTAM 字段。".to_string()
    } else {
        parts.join("，")
    }
}

pub fn decode_notam(raw: &str, detail: DetailLevel, lang: &str) -> DecodeResponse {
    let (parsed, warnings_legacy_raw) = parse_notam(raw);
    let normalized = normalize_notam(&parsed);
    let explain = translate_notam(&normalized, detail, lang);

    let mut warnings: Vec<aviation_wx_core::Issue> =
        warnings_legacy_raw.iter().map(|item| issue_from_legacy(item)).collect();
    let mut errors = Vec::new();
    let (warnings_legacy, errors_legacy) = finalize_issues(&mut warnings, &mut errors);

    DecodeResponse {
        schema_version: "1.0".to_string(),
        message_type: MessageType::Notam,
        requested_type: MessageType::Notam,
        detected_type: MessageType::Notam,
        final_type: MessageType::Notam,
        raw: raw.trim().to_string(),
        parsed: Some(aviation_wx_core::ParsedMessage::Notam(parsed)),
        normalized: Some(aviation_wx_core::NormalizedMessage::Notam(normalized)),
        explain: Some(explain),
        warnings,
        errors,
        warnings_legacy,
        errors_legacy,
    }
}

