use aviation_wx_core::{ finalize_issues, issue, issue_from_legacy,
    parse, CloudLayer, DecodeResponse, DetailLevel, MessageType, MetarNormalized, MetarParsed,
    Pressure, Rvr, TemperaturePair, Visibility,
};
use regex::Regex;

pub fn parse_metar(raw: &str) -> (MetarParsed, Vec<String>) {
    let mut warnings = Vec::new();
    let tokens: Vec<String> = raw
        .replace('\n', " ")
        .replace('\r', " ")
        .split_whitespace()
        .map(|s| s.trim().to_string())
        .collect();

    let mut station = None;
    let mut issue_time = None;
    let mut wind = None;
    let mut wind_variation = None;
    let mut rvr = Vec::new();
    let mut visibility = None;
    let mut weather = Vec::new();
    let mut clouds = Vec::new();
    let mut temperature = None;
    let mut pressure_qnh = None;
    let mut altimeter = None;
    let mut pressure = None;
    let mut trend = None;
    let mut rmk_raw = None;
    let mut rmk_tokens = Vec::new();
    let mut raw_tokens = Vec::new();

    let mut idx = 0;
    if tokens.get(0).map(|t| t.as_str()) == Some("METAR") || tokens.get(0).map(|t| t.as_str()) == Some("SPECI") {
        idx += 1;
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

    let weather_re = Regex::new(r"^(\+|\-|VC)?[A-Z]{2,6}$").unwrap();
    let rvr_re = Regex::new(r"^R(?P<runway>\d{2}[LCR]?)/(?P<base>\d{4})(?:V(?P<vary>\d{4}))?(?P<trend>[UDN])?$")
        .unwrap();

    while idx < tokens.len() {
        let token = tokens[idx].clone();
        if token == "CAVOK" {
            visibility = Some(Visibility {
                distance: 10000,
                unit: "M".to_string(),
                raw: token.clone(),
            });
            idx += 1;
            continue;
        }

        if parse::parse_wind(&token).is_ok() {
            let (_, parsed) = parse::parse_wind(&token).unwrap();
            wind = Some(parsed);
            idx += 1;
            continue;
        }

        if parse::parse_wind_variation(&token).is_ok() {
            let (_, (from_deg, to_deg)) = parse::parse_wind_variation(&token).unwrap();
            wind_variation = Some(aviation_wx_core::WindVariation { from_deg, to_deg });
            idx += 1;
            continue;
        }

        if let Some(caps) = rvr_re.captures(&token) {
            let runway = caps.name("runway").map(|m| m.as_str()).unwrap_or("").to_string();
            let vis_m = caps
                .name("base")
                .and_then(|m| m.as_str().parse::<u16>().ok())
                .unwrap_or(0);
            let vis_vary_m = caps
                .name("vary")
                .and_then(|m| m.as_str().parse::<u16>().ok());
            let tendency = match caps.name("trend").map(|m| m.as_str()) {
                Some("U") => "up",
                Some("D") => "down",
                Some("N") => "no_change",
                _ => "unknown",
            }
            .to_string();
            rvr.push(Rvr {
                runway,
                vis_m,
                vis_vary_m,
                tendency,
            });
            idx += 1;
            continue;
        }

        if parse::parse_visibility_meters(&token).is_ok() {
            let (_, parsed) = parse::parse_visibility_meters(&token).unwrap();
            visibility = Some(parsed);
            idx += 1;
            continue;
        }

        if parse::parse_visibility_sm(&token).is_ok() {
            let (_, parsed) = parse::parse_visibility_sm(&token).unwrap();
            visibility = Some(parsed);
            idx += 1;
            continue;
        }

        if parse::parse_cloud_layer(&token).is_ok() {
            let (_, (amount, height, cloud_type)) = parse::parse_cloud_layer(&token).unwrap();
            clouds.push(CloudLayer {
                amount,
                height_ft: height,
                cloud_type,
                raw: token.clone(),
            });
            idx += 1;
            continue;
        }

        if parse::parse_temperature_pair(&token).is_ok() {
            let (_, (temp, dew)) = parse::parse_temperature_pair(&token).unwrap();
            temperature = Some(TemperaturePair {
                temperature_c: temp,
                dewpoint_c: dew,
            });
            idx += 1;
            continue;
        }

        if parse::parse_pressure_qnh(&token).is_ok() {
            let (_, value) = parse::parse_pressure_qnh(&token).unwrap();
            let qnh = Pressure {
                value,
                unit: "hPa".to_string(),
            };
            pressure_qnh = Some(qnh.clone());
            pressure = Some(qnh);
            idx += 1;
            continue;
        }

        if parse::parse_pressure_altimeter(&token).is_ok() {
            let (_, value) = parse::parse_pressure_altimeter(&token).unwrap();
            let alt = Pressure {
                value,
                unit: "inHg*100".to_string(),
            };
            altimeter = Some(alt.clone());
            if pressure.is_none() {
                pressure = Some(alt);
            }
            idx += 1;
            continue;
        }

        if token == "NOSIG" || token == "BECMG" || token == "TEMPO" {
            trend = Some(token.clone());
            idx += 1;
            continue;
        }

        if token == "RMK" {
            if idx + 1 < tokens.len() {
                let tail = tokens[idx + 1..].to_vec();
                rmk_raw = Some(tail.join(" "));
                rmk_tokens = tail;
            } else {
                rmk_raw = Some(String::new());
            }
            break;
        }

        if weather_re.is_match(&token) {
            weather.push(token.clone());
            idx += 1;
            continue;
        }

        if token == "=" {
            idx += 1;
            continue;
        }

        raw_tokens.push(token.clone());
        warnings.push(format!("Unrecognized token: {}", token));
        idx += 1;
    }

    (
        MetarParsed {
            station,
            issue_time,
            wind,
            wind_variation,
            rvr,
            pressure_qnh,
            altimeter,
            visibility,
            weather,
            clouds,
            temperature,
            pressure,
            rmk_raw,
            rmk_tokens,
            trend,
            raw_tokens,
        },
        warnings,
    )
}

pub fn normalize_metar(parsed: &MetarParsed) -> MetarNormalized {
    let pressure_hpa_int = parsed
        .pressure_qnh
        .as_ref()
        .and_then(|p| if p.unit == "hPa" { Some(p.value) } else { None });
    let pressure_inhg = parsed
        .altimeter
        .as_ref()
        .and_then(|p| if p.unit == "inHg*100" { Some(aviation_wx_core::altimeter_to_inhg(p.value)) } else { None });
    let pressure_hpa = if let Some(value) = pressure_hpa_int {
        Some(value as f32)
    } else if let Some(inhg) = pressure_inhg {
        Some(aviation_wx_core::inhg_to_hpa(inhg))
    } else {
        None
    };

    MetarNormalized {
        station: parsed.station.clone(),
        issue_time: parsed.issue_time.clone(),
        wind: parsed.wind.as_ref().map(aviation_wx_core::normalize_wind),
        wind_variation: parsed.wind_variation.clone(),
        rvr: parsed.rvr.clone(),
        visibility_m: parsed.visibility.as_ref().and_then(aviation_wx_core::visibility_to_meters),
        weather: parsed.weather.clone(),
        clouds: parsed.clouds.clone(),
        temperature: parsed.temperature.clone(),
        pressure_hpa,
        pressure_inhg,
        pressure_hpa_int,
        rmk_raw: parsed.rmk_raw.clone(),
        rmk_tokens: parsed.rmk_tokens.clone(),
        trend: parsed.trend.clone(),
    }
}

pub fn translate_metar(normalized: &MetarNormalized, detail: DetailLevel, lang: &str) -> String {
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
    if let Some(wind) = &normalized.wind {
        parts.push(format!("风 {}", aviation_wx_core::describe_wind(wind)));
    }
    if let Some(variation) = &normalized.wind_variation {
        parts.push(format!(
            "风向在 {}°-{}° 间波动",
            variation.from_deg, variation.to_deg
        ));
    }
    if let Some(vis) = normalized.visibility_m {
        parts.push(format!("能见度 {}", aviation_wx_core::describe_visibility_meters(vis)));
    }
    if !normalized.rvr.is_empty() {
        let rvr_texts: Vec<String> = normalized
            .rvr
            .iter()
            .map(|item| {
                let base = if let Some(vary) = item.vis_vary_m {
                    format!("{}-{}m", item.vis_m, vary)
                } else {
                    format!("{}m", item.vis_m)
                };
                let mut text = format!("跑道 {} RVR 约 {}", item.runway, base);
                match item.tendency.as_str() {
                    "up" => text.push_str("（趋势上升）"),
                    "down" => text.push_str("（趋势下降）"),
                    "no_change" => text.push_str("（趋势不变）"),
                    _ => {}
                }
                text
            })
            .collect();
        parts.push(rvr_texts.join("；"));
    }
    if !normalized.weather.is_empty() {
        parts.push(format!("天气 {}", normalized.weather.join(" ")));
    }
    if !normalized.clouds.is_empty() {
        parts.push(format!("云 {}", aviation_wx_core::describe_clouds(&normalized.clouds)));
    }
    if let Some(temp) = &normalized.temperature {
        parts.push(format!("气温 {}°C 露点 {}°C", temp.temperature_c, temp.dewpoint_c));
    }
    if let Some(hpa) = normalized.pressure_hpa {
        let mut pressure_text = if normalized.pressure_hpa_int.is_some() {
            format!("气压（QNH）≈ {:.1} hPa", hpa)
        } else {
            format!("气压（Altimeter）≈ {:.1} hPa", hpa)
        };
        if normalized.pressure_hpa_int.is_some() && normalized.pressure_inhg.is_some() {
            let alt_hpa = aviation_wx_core::inhg_to_hpa(normalized.pressure_inhg.unwrap_or_default());
            pressure_text.push_str(&format!("（Altimeter ≈ {:.1} hPa）", alt_hpa));
        }
        parts.push(pressure_text);
    }
    if detail != DetailLevel::Brief {
        if let Some(raw) = &normalized.rmk_raw {
            let truncated = truncate_text(raw, 120);
            parts.push(format!("备注（RMK）：{}", truncated));
        }
    }

    let mut text = parts.join("，");
    if detail != DetailLevel::Brief {
        if let Some(trend) = &normalized.trend {
            text.push_str("。趋势：");
            text.push_str(trend);
        }
    }

    text
}

fn truncate_text(value: &str, max_chars: usize) -> String {
    let mut result = String::new();
    for (idx, ch) in value.chars().enumerate() {
        if idx >= max_chars {
            result.push_str("...");
            return result;
        }
        result.push(ch);
    }
    result
}

pub fn decode_metar(raw: &str, detail: DetailLevel, lang: &str) -> DecodeResponse {
    let (parsed, warnings_legacy_raw) = parse_metar(raw);
    let normalized = normalize_metar(&parsed);
    let explain = translate_metar(&normalized, detail, lang);

    let mut warnings: Vec<aviation_wx_core::Issue> =
        warnings_legacy_raw.iter().map(|item| issue_from_legacy(item)).collect();
    if parsed.pressure_qnh.is_some() && parsed.altimeter.is_some() {
        warnings.push(issue(
            "pressure_conflict",
            "Both QNH and altimeter present; using QNH as primary pressure.",
            None,
        ));
    }

    let mut errors = Vec::new();
    let (warnings_legacy, errors_legacy) = finalize_issues(&mut warnings, &mut errors);

    DecodeResponse {
        schema_version: "1.0".to_string(),
        message_type: MessageType::Metar,
        requested_type: MessageType::Metar,
        detected_type: MessageType::Metar,
        final_type: MessageType::Metar,
        raw: raw.trim().to_string(),
        parsed: Some(aviation_wx_core::ParsedMessage::Metar(parsed)),
        normalized: Some(aviation_wx_core::NormalizedMessage::Metar(normalized)),
        explain: Some(explain),
        warnings,
        errors,
        warnings_legacy,
        errors_legacy,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(left: f32, right: f32, eps: f32) -> bool {
        (left - right).abs() <= eps
    }

    #[test]
    fn altimeter_conversion() {
        let raw = "METAR KSFO 011156Z 28012KT 10SM FEW015 BKN030 12/08 A2992";
        let (parsed, _) = parse_metar(raw);
        let normalized = normalize_metar(&parsed);
        let inhg = normalized.pressure_inhg.expect("pressure_inhg");
        let hpa = normalized.pressure_hpa.expect("pressure_hpa");
        assert!(approx_eq(inhg, 29.92, 0.01));
        assert!(approx_eq(hpa, 1013.2, 0.1));
    }

    #[test]
    fn rvr_parsing_single() {
        let raw = "METAR RJTT 011200Z 04005KT 1200 R34L/0600U OVC005 12/11 Q1006";
        let (parsed, _) = parse_metar(raw);
        assert_eq!(parsed.rvr.len(), 1);
        let rvr = &parsed.rvr[0];
        assert_eq!(rvr.runway, "34L");
        assert_eq!(rvr.vis_m, 600);
        assert_eq!(rvr.vis_vary_m, None);
        assert_eq!(rvr.tendency, "up");
    }

    #[test]
    fn rvr_parsing_vary() {
        let raw = "METAR ZSPD 011200Z 02006MPS 2000 R16/0800V1200D OVC008 03/M01 Q1012";
        let (parsed, _) = parse_metar(raw);
        assert_eq!(parsed.rvr.len(), 1);
        let rvr = &parsed.rvr[0];
        assert_eq!(rvr.runway, "16");
        assert_eq!(rvr.vis_m, 800);
        assert_eq!(rvr.vis_vary_m, Some(1200));
        assert_eq!(rvr.tendency, "down");
    }
}

