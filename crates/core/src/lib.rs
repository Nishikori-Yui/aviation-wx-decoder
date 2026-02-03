use serde::{Deserialize, Serialize};

pub mod parse;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageType {
    Taf,
    Metar,
    Notam,
    Unknown,
}

impl MessageType {
    pub fn as_str(&self) -> &'static str {
        match self {
            MessageType::Taf => "taf",
            MessageType::Metar => "metar",
            MessageType::Notam => "notam",
            MessageType::Unknown => "unknown",
        }
    }
}

impl std::fmt::Display for MessageType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl std::str::FromStr for MessageType {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_ascii_lowercase().as_str() {
            "taf" => Ok(MessageType::Taf),
            "metar" => Ok(MessageType::Metar),
            "notam" => Ok(MessageType::Notam),
            "auto" => Ok(MessageType::Unknown),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DetailLevel {
    Brief,
    Normal,
    Full,
}

impl Default for DetailLevel {
    fn default() -> Self {
        DetailLevel::Normal
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UtcTime {
    pub day: u8,
    pub hour: u8,
    pub minute: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ValidityPeriod {
    pub from: UtcTime,
    pub to: UtcTime,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Wind {
    pub direction_deg: Option<u16>,
    pub variable: bool,
    pub speed: u16,
    pub gust: Option<u16>,
    pub unit: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WindVariation {
    pub from_deg: u16,
    pub to_deg: u16,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rvr {
    pub runway: String,
    pub vis_m: u16,
    pub vis_vary_m: Option<u16>,
    pub tendency: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Visibility {
    pub distance: u32,
    pub unit: String,
    pub raw: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CloudLayer {
    pub amount: String,
    pub height_ft: Option<u16>,
    pub cloud_type: Option<String>,
    pub raw: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TemperaturePair {
    pub temperature_c: i16,
    pub dewpoint_c: i16,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Pressure {
    pub value: u16,
    pub unit: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct IssueSpan {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Issue {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span: Option<IssueSpan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TafParsed {
    pub station: Option<String>,
    pub issue_time: Option<UtcTime>,
    pub validity: Option<ValidityPeriod>,
    pub wind: Option<Wind>,
    pub visibility: Option<Visibility>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
    pub temperatures: Vec<String>,
    pub trends: Vec<TafTrend>,
    pub raw_tokens: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TafTrend {
    pub kind: String,
    pub period: Option<ValidityPeriod>,
    pub wind: Option<Wind>,
    pub visibility: Option<Visibility>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
    pub raw_tokens: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetarParsed {
    pub station: Option<String>,
    pub issue_time: Option<UtcTime>,
    pub wind: Option<Wind>,
    pub wind_variation: Option<WindVariation>,
    pub rvr: Vec<Rvr>,
    pub pressure_qnh: Option<Pressure>,
    pub altimeter: Option<Pressure>,
    pub visibility: Option<Visibility>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
    pub temperature: Option<TemperaturePair>,
    pub pressure: Option<Pressure>,
    pub rmk_raw: Option<String>,
    pub rmk_tokens: Vec<String>,
    pub trend: Option<String>,
    pub raw_tokens: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotamParsed {
    pub q_line: Option<String>,
    pub a: Option<String>,
    pub b: Option<String>,
    pub c: Option<String>,
    pub d: Option<String>,
    pub e: Option<String>,
    pub f: Option<String>,
    pub g: Option<String>,
    pub raw_lines: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ParsedMessage {
    Taf(TafParsed),
    Metar(MetarParsed),
    Notam(NotamParsed),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TafNormalized {
    pub station: Option<String>,
    pub issue_time: Option<UtcTime>,
    pub validity: Option<ValidityPeriod>,
    pub wind: Option<WindNormalized>,
    pub visibility_m: Option<u32>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
    pub temperatures: Vec<String>,
    pub trends: Vec<TafTrendNormalized>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TafTrendNormalized {
    pub kind: String,
    pub period: Option<ValidityPeriod>,
    pub wind: Option<WindNormalized>,
    pub visibility_m: Option<u32>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetarNormalized {
    pub station: Option<String>,
    pub issue_time: Option<UtcTime>,
    pub wind: Option<WindNormalized>,
    pub wind_variation: Option<WindVariation>,
    pub rvr: Vec<Rvr>,
    pub visibility_m: Option<u32>,
    pub weather: Vec<String>,
    pub clouds: Vec<CloudLayer>,
    pub temperature: Option<TemperaturePair>,
    pub pressure_hpa: Option<f32>,
    pub pressure_inhg: Option<f32>,
    pub pressure_hpa_int: Option<u16>,
    pub rmk_raw: Option<String>,
    pub rmk_tokens: Vec<String>,
    pub trend: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotamNormalized {
    pub q_line: Option<String>,
    pub a: Option<String>,
    pub b: Option<String>,
    pub c: Option<String>,
    pub d: Option<String>,
    pub e: Option<String>,
    pub f: Option<String>,
    pub g: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NormalizedMessage {
    Taf(TafNormalized),
    Metar(MetarNormalized),
    Notam(NotamNormalized),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindNormalized {
    pub direction_deg: Option<u16>,
    pub variable: bool,
    pub speed_kt: u16,
    pub gust_kt: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodeResponse {
    pub schema_version: String,
    #[serde(rename = "type")]
    pub message_type: MessageType,
    pub requested_type: MessageType,
    pub detected_type: MessageType,
    pub final_type: MessageType,
    pub raw: String,
    pub parsed: Option<ParsedMessage>,
    pub normalized: Option<NormalizedMessage>,
    pub explain: Option<String>,
    pub warnings: Vec<Issue>,
    pub errors: Vec<Issue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings_legacy: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors_legacy: Option<Vec<String>>,
}

pub fn detect_message_type(raw: &str) -> MessageType {
    let trimmed = raw.trim_start();
    let upper = trimmed.to_ascii_uppercase();
    if upper.starts_with("TAF ") || upper.starts_with("TAF\n") || upper.starts_with("TAF\r") {
        return MessageType::Taf;
    }
    if upper.starts_with("METAR ") || upper.starts_with("SPECI ") {
        return MessageType::Metar;
    }
    if upper.contains("NOTAM") || upper.contains("Q)") {
        return MessageType::Notam;
    }
    if looks_like_metar(trimmed) {
        return MessageType::Metar;
    }
    MessageType::Unknown
}

fn looks_like_metar(raw: &str) -> bool {
    let mut iter = raw.split_whitespace();
    let first = match iter.next() {
        Some(value) => value,
        None => return false,
    };
    let second = match iter.next() {
        Some(value) => value,
        None => return false,
    };
    if first.len() == 4 && first.chars().all(|c| c.is_ascii_alphabetic()) {
        return second.len() == 7 && second.ends_with('Z') && second[..6].chars().all(|c| c.is_ascii_digit());
    }
    false
}

pub fn normalize_wind(wind: &Wind) -> WindNormalized {
    let speed_kt = match wind.unit.as_str() {
        "MPS" => ((wind.speed as f32) * 1.94384).round() as u16,
        _ => wind.speed,
    };
    let gust_kt = wind.gust.map(|gust| match wind.unit.as_str() {
        "MPS" => ((gust as f32) * 1.94384).round() as u16,
        _ => gust,
    });
    WindNormalized {
        direction_deg: wind.direction_deg,
        variable: wind.variable,
        speed_kt,
        gust_kt,
    }
}

pub fn visibility_to_meters(visibility: &Visibility) -> Option<u32> {
    match visibility.unit.as_str() {
        "M" => {
            if visibility.distance >= 9999 {
                Some(10000)
            } else {
                Some(visibility.distance)
            }
        }
        "SM" => Some((visibility.distance as f32 * 1609.34).round() as u32),
        _ => None,
    }
}

pub fn describe_wind(wind: &WindNormalized) -> String {
    match wind.direction_deg {
        Some(dir) => {
            if let Some(gust) = wind.gust_kt {
                format!("{}° {}kt gust {}kt", dir, wind.speed_kt, gust)
            } else {
                format!("{}° {}kt", dir, wind.speed_kt)
            }
        }
        None => {
            if let Some(gust) = wind.gust_kt {
                format!("VRB {}kt gust {}kt", wind.speed_kt, gust)
            } else {
                format!("VRB {}kt", wind.speed_kt)
            }
        }
    }
}

pub fn describe_visibility_meters(distance_m: u32) -> String {
    if distance_m >= 10000 {
        "10km or more".to_string()
    } else {
        format!("{}m", distance_m)
    }
}

pub fn describe_clouds(clouds: &[CloudLayer]) -> String {
    if clouds.is_empty() {
        return "No significant cloud".to_string();
    }
    let parts: Vec<String> = clouds
        .iter()
        .map(|layer| match layer.height_ft {
            Some(height) => format!("{} {:}ft", layer.amount, height),
            None => layer.amount.clone(),
        })
        .collect();
    parts.join(", ")
}

pub fn altimeter_to_inhg(value: u16) -> f32 {
    (value as f32) / 100.0
}

pub fn inhg_to_hpa(inhg: f32) -> f32 {
    let hpa = inhg * 33.8638866667_f32;
    (hpa * 10.0).round() / 10.0
}

pub fn issue(code: &str, message: impl Into<String>, token: Option<String>) -> Issue {
    Issue {
        code: code.to_string(),
        message: message.into(),
        token,
        span: None,
    }
}

pub fn issue_from_legacy(message: &str) -> Issue {
    let token_prefix = "Unrecognized token: ";
    if message.starts_with(token_prefix) {
        return issue(
            "unknown_token",
            message.to_string(),
            Some(message[token_prefix.len()..].to_string()),
        );
    }
    issue("warning", message.to_string(), None)
}

pub fn sort_issues(issues: &mut Vec<Issue>) {
    issues.sort_by(|a, b| {
        let token_a = a.token.as_deref().unwrap_or("");
        let token_b = b.token.as_deref().unwrap_or("");
        (a.code.as_str(), token_a, a.message.as_str())
            .cmp(&(b.code.as_str(), token_b, b.message.as_str()))
    });
}

pub fn finalize_issues(warnings: &mut Vec<Issue>, errors: &mut Vec<Issue>) -> (Option<Vec<String>>, Option<Vec<String>>) {
    sort_issues(warnings);
    sort_issues(errors);
    let warnings_legacy = if warnings.is_empty() {
        None
    } else {
        Some(warnings.iter().map(|item| item.message.clone()).collect())
    };
    let errors_legacy = if errors.is_empty() {
        None
    } else {
        Some(errors.iter().map(|item| item.message.clone()).collect())
    };
    (warnings_legacy, errors_legacy)
}

