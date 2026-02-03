use aviation_wx_core::{finalize_issues, issue_from_legacy, parse, CloudLayer, DecodeResponse, DetailLevel, MessageType, TafNormalized, TafParsed, TafTrend, TafTrendNormalized, Visibility};
use regex::Regex;

pub fn parse_taf(raw: &str) -> (TafParsed, Vec<String>) {
    let mut warnings = Vec::new();
    let tokens: Vec<String> = raw
        .replace('\n', " ")
        .replace('\r', " ")
        .split_whitespace()
        .map(|s| s.trim().to_string())
        .collect();

    let mut station = None;
    let mut issue_time = None;
    let mut validity = None;
    let mut wind = None;
    let mut visibility = None;
    let mut weather = Vec::new();
    let mut clouds = Vec::new();
    let mut temperatures = Vec::new();
    let mut trends: Vec<TafTrend> = Vec::new();
    let mut raw_tokens: Vec<String> = Vec::new();

    let mut idx = 0;
    if tokens.get(0).map(|t| t.as_str()) == Some("TAF") {
        idx += 1;
        if let Some(token) = tokens.get(idx) {
            if token == "AMD" || token == "COR" || token == "RTD" {
                idx += 1;
            }
        }
    }

    if let Some(token) = tokens.get(idx) {
        if token.len() == 4 && token.chars().all(|c| c.is_ascii_alphabetic()) {
            station = Some(token.to_string());
            idx += 1;
        }
    }

    if let Some(token) = tokens.get(idx) {
        if parse::parse_time_group(token).is_ok() {
            let (_, time) = parse::parse_time_group(token).unwrap();
            issue_time = Some(time);
            idx += 1;
        }
    }

    if let Some(token) = tokens.get(idx) {
        if parse::parse_validity(token).is_ok() {
            let (_, period) = parse::parse_validity(token).unwrap();
            validity = Some(period);
            idx += 1;
        }
    }

    let weather_re = Regex::new(r"^(\+|\-|VC)?[A-Z]{2,6}$").unwrap();

    let mut current_trend: Option<TafTrend> = None;

    while idx < tokens.len() {
        let token = tokens[idx].clone();
        if token == "BECMG" || token == "TEMPO" {
            if let Some(trend) = current_trend.take() {
                trends.push(trend);
            }
            current_trend = Some(TafTrend {
                kind: token.clone(),
                period: None,
                wind: None,
                visibility: None,
                weather: Vec::new(),
                clouds: Vec::new(),
                raw_tokens: Vec::new(),
            });
            idx += 1;
            if let Some(next) = tokens.get(idx) {
                if parse::parse_validity(next).is_ok() {
                    let (_, period) = parse::parse_validity(next).unwrap();
                    if let Some(trend) = current_trend.as_mut() {
                        trend.period = Some(period);
                    }
                    idx += 1;
                }
            }
            continue;
        }

        if token == "CAVOK" {
            let vis = Visibility {
                distance: 10000,
                unit: "M".to_string(),
                raw: token.clone(),
            };
            if let Some(trend) = current_trend.as_mut() {
                trend.visibility = Some(vis);
            } else {
                visibility = Some(vis);
            }
            idx += 1;
            continue;
        }

        if parse::parse_wind(&token).is_ok() {
            let (_, parsed) = parse::parse_wind(&token).unwrap();
            if let Some(trend) = current_trend.as_mut() {
                trend.wind = Some(parsed);
            } else {
                wind = Some(parsed);
            }
            idx += 1;
            continue;
        }

        if parse::parse_visibility_meters(&token).is_ok() {
            let (_, parsed) = parse::parse_visibility_meters(&token).unwrap();
            if let Some(trend) = current_trend.as_mut() {
                trend.visibility = Some(parsed);
            } else {
                visibility = Some(parsed);
            }
            idx += 1;
            continue;
        }

        if parse::parse_cloud_layer(&token).is_ok() {
            let (_, (amount, height, cloud_type)) = parse::parse_cloud_layer(&token).unwrap();
            let layer = CloudLayer {
                amount,
                height_ft: height,
                cloud_type,
                raw: token.clone(),
            };
            if let Some(trend) = current_trend.as_mut() {
                trend.clouds.push(layer);
            } else {
                clouds.push(layer);
            }
            idx += 1;
            continue;
        }

        if token.starts_with("TX") || token.starts_with("TN") {
            temperatures.push(token.clone());
            idx += 1;
            continue;
        }

        if weather_re.is_match(&token) {
            if let Some(trend) = current_trend.as_mut() {
                trend.weather.push(token.clone());
            } else {
                weather.push(token.clone());
            }
            idx += 1;
            continue;
        }

        if token == "=" {
            idx += 1;
            continue;
        }

        if let Some(trend) = current_trend.as_mut() {
            trend.raw_tokens.push(token.clone());
        } else {
            raw_tokens.push(token.clone());
        }
        warnings.push(format!("Unrecognized token: {}", token));
        idx += 1;
    }

    if let Some(trend) = current_trend.take() {
        trends.push(trend);
    }

    (
        TafParsed {
            station,
            issue_time,
            validity,
            wind,
            visibility,
            weather,
            clouds,
            temperatures,
            trends,
            raw_tokens,
        },
        warnings,
    )
}

pub fn normalize_taf(parsed: &TafParsed) -> TafNormalized {
    TafNormalized {
        station: parsed.station.clone(),
        issue_time: parsed.issue_time.clone(),
        validity: parsed.validity.clone(),
        wind: parsed.wind.as_ref().map(aviation_wx_core::normalize_wind),
        visibility_m: parsed.visibility.as_ref().and_then(aviation_wx_core::visibility_to_meters),
        weather: parsed.weather.clone(),
        clouds: parsed.clouds.clone(),
        temperatures: parsed.temperatures.clone(),
        trends: parsed
            .trends
            .iter()
            .map(|trend| TafTrendNormalized {
                kind: trend.kind.clone(),
                period: trend.period.clone(),
                wind: trend.wind.as_ref().map(aviation_wx_core::normalize_wind),
                visibility_m: trend.visibility.as_ref().and_then(aviation_wx_core::visibility_to_meters),
                weather: trend.weather.clone(),
                clouds: trend.clouds.clone(),
            })
            .collect(),
    }
}

pub fn translate_taf(normalized: &TafNormalized, detail: DetailLevel, lang: &str) -> String {
    if lang != "zh-CN" {
        return "Translation only supports zh-CN for now.".to_string();
    }

    let mut parts = Vec::new();
    if let Some(station) = &normalized.station {
        parts.push(format!("台站 {}", station));
    }
    if let Some(time) = &normalized.issue_time {
        parts.push(format!("发布于 {:02} 日 {:02}:{:02}Z", time.day, time.hour, time.minute));
    }
    if let Some(validity) = &normalized.validity {
        parts.push(format!(
            "有效期 {:02} 日 {:02}Z - {:02} 日 {:02}Z",
            validity.from.day, validity.from.hour, validity.to.day, validity.to.hour
        ));
    }

    if let Some(wind) = &normalized.wind {
        parts.push(format!("风 {}", aviation_wx_core::describe_wind(wind)));
    }
    if let Some(vis) = normalized.visibility_m {
        parts.push(format!("能见度 {}", aviation_wx_core::describe_visibility_meters(vis)));
    }
    if !normalized.weather.is_empty() {
        parts.push(format!("天气 {}", normalized.weather.join(" ")));
    }
    if !normalized.clouds.is_empty() {
        parts.push(format!("云 {}", aviation_wx_core::describe_clouds(&normalized.clouds)));
    }

    let mut text = parts.join("，");

    if detail != DetailLevel::Brief && !normalized.trends.is_empty() {
        let mut trend_lines = Vec::new();
        for trend in &normalized.trends {
            let mut line = Vec::new();
            line.push(format!("{}", trend.kind));
            if let Some(period) = &trend.period {
                line.push(format!(
                    "{:02}日{:02}Z-{:02}日{:02}Z",
                    period.from.day, period.from.hour, period.to.day, period.to.hour
                ));
            }
            if let Some(wind) = &trend.wind {
                line.push(format!("风 {}", aviation_wx_core::describe_wind(wind)));
            }
            if let Some(vis) = trend.visibility_m {
                line.push(format!("能见度 {}", aviation_wx_core::describe_visibility_meters(vis)));
            }
            if !trend.weather.is_empty() {
                line.push(format!("天气 {}", trend.weather.join(" ")));
            }
            if !trend.clouds.is_empty() {
                line.push(format!("云 {}", aviation_wx_core::describe_clouds(&trend.clouds)));
            }
            trend_lines.push(line.join("，"));
        }
        if !trend_lines.is_empty() {
            text.push_str("。变化：");
            text.push_str(&trend_lines.join("；"));
        }
    }

    if detail == DetailLevel::Full && !normalized.temperatures.is_empty() {
        text.push_str("。温度组：");
        text.push_str(&normalized.temperatures.join(" "));
    }

    text
}

pub fn decode_taf(raw: &str, detail: DetailLevel, lang: &str) -> DecodeResponse {
    let (parsed, warnings_legacy_raw) = parse_taf(raw);
    let normalized = normalize_taf(&parsed);
    let explain = translate_taf(&normalized, detail, lang);

    let mut warnings: Vec<aviation_wx_core::Issue> =
        warnings_legacy_raw.iter().map(|item| issue_from_legacy(item)).collect();
    let mut errors = Vec::new();
    let (warnings_legacy, errors_legacy) = finalize_issues(&mut warnings, &mut errors);

    DecodeResponse {
        schema_version: "1.0".to_string(),
        message_type: MessageType::Taf,
        requested_type: MessageType::Taf,
        detected_type: MessageType::Taf,
        final_type: MessageType::Taf,
        raw: raw.trim().to_string(),
        parsed: Some(aviation_wx_core::ParsedMessage::Taf(parsed)),
        normalized: Some(aviation_wx_core::NormalizedMessage::Taf(normalized)),
        explain: Some(explain),
        warnings,
        errors,
        warnings_legacy,
        errors_legacy,
    }
}


