use axum::{
    extract::Json,
    http::{HeaderName, Request, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower::{layer::util::Identity, ServiceBuilder};
use tower_http::{
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
    trace::TraceLayer,
};

use aviation_wx::{decode_message, DecodeOptions, DetailLevel, MessageType};
use aviation_wx_core as core;

const REQUEST_ID_HEADER: HeaderName = HeaderName::from_static("x-request-id");

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Debug, Deserialize)]
struct DecodeRequest {
    message: String,
    #[serde(default = "default_type")]
    r#type: String,
    #[serde(default)]
    output: OutputOptions,
    #[serde(default = "default_lang")]
    lang: String,
    #[serde(default = "default_detail")]
    detail: String,
}

#[derive(Debug, Deserialize, Default)]
struct OutputOptions {
    json: Option<bool>,
    explain: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct BatchDecodeRequest {
    messages: Vec<String>,
    #[serde(default = "default_type")]
    r#type: String,
    #[serde(default)]
    output: OutputOptions,
    #[serde(default = "default_lang")]
    lang: String,
    #[serde(default = "default_detail")]
    detail: String,
}

#[derive(Debug, Serialize)]
struct BatchDecodeResponse {
    results: Vec<aviation_wx::DecodeResponse>,
    errors: Vec<String>,
}

fn default_type() -> String {
    "auto".to_string()
}

fn default_lang() -> String {
    "zh-CN".to_string()
}

fn default_detail() -> String {
    "normal".to_string()
}

fn parse_detail(value: &str) -> DetailLevel {
    match value.to_ascii_lowercase().as_str() {
        "brief" => DetailLevel::Brief,
        "full" => DetailLevel::Full,
        _ => DetailLevel::Normal,
    }
}

fn parse_message_type(value: &str) -> MessageType {
    match value.to_ascii_lowercase().as_str() {
        "auto" => MessageType::Unknown,
        "taf" => MessageType::Taf,
        "metar" => MessageType::Metar,
        "notam" => MessageType::Notam,
        _ => MessageType::Unknown,
    }
}

pub fn build_app() -> Router {
    let request_id = MakeRequestUuid::default();
    let trace_layer = TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
        let request_id = request
            .headers()
            .get("x-request-id")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("-");
        tracing::info_span!(
            "http_request",
            method = %request.method(),
            uri = %request.uri(),
            request_id = %request_id
        )
    });
    Router::new()
        .route("/healthz", get(health))
        .route("/v1/decode", post(decode))
        .route("/v1/decode/batch", post(decode_batch))
        .layer(
            ServiceBuilder::new()
                .layer(auth_layer())
                .layer(rate_limit_layer())
                .layer(SetRequestIdLayer::new(REQUEST_ID_HEADER, request_id))
                .layer(PropagateRequestIdLayer::new(REQUEST_ID_HEADER))
                .layer(trace_layer),
        )
}

fn auth_layer() -> Identity {
    Identity::new()
}

fn rate_limit_layer() -> Identity {
    Identity::new()
}

async fn health() -> impl IntoResponse {
    (StatusCode::OK, Json(HealthResponse { status: "ok" }))
}

async fn decode(Json(payload): Json<DecodeRequest>) -> impl IntoResponse {
    if payload.message.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(aviation_wx::DecodeResponse {
                schema_version: "1.0".to_string(),
                message_type: MessageType::Unknown,
                requested_type: MessageType::Unknown,
                detected_type: MessageType::Unknown,
                final_type: MessageType::Unknown,
                raw: payload.message,
                parsed: None,
                normalized: None,
                explain: None,
                warnings: Vec::new(),
                errors: vec![core::issue("empty_message", "message is empty", None)],
                warnings_legacy: None,
                errors_legacy: Some(vec!["message is empty".to_string()]),
            }),
        );
    }

    let options = DecodeOptions {
        type_hint: parse_message_type(&payload.r#type),
        lang: payload.lang,
        detail: parse_detail(&payload.detail),
        output_json: payload.output.json.unwrap_or(true),
        output_explain: payload.output.explain.unwrap_or(true),
    };

    let response = decode_message(&payload.message, &options);
    tracing::info!(
        warnings = response.warnings.len(),
        errors = response.errors.len(),
        message_type = %response.message_type,
        detected_type = %response.detected_type,
        "decode completed"
    );
    (StatusCode::OK, Json(response))
}

async fn decode_batch(Json(payload): Json<BatchDecodeRequest>) -> impl IntoResponse {
    let mut results = Vec::new();
    let mut errors = Vec::new();

    let options = DecodeOptions {
        type_hint: parse_message_type(&payload.r#type),
        lang: payload.lang,
        detail: parse_detail(&payload.detail),
        output_json: payload.output.json.unwrap_or(true),
        output_explain: payload.output.explain.unwrap_or(true),
    };

    for (idx, message) in payload.messages.iter().enumerate() {
        if message.trim().is_empty() {
            errors.push(format!("messages[{}] is empty", idx));
            results.push(aviation_wx::DecodeResponse {
                schema_version: "1.0".to_string(),
                message_type: MessageType::Unknown,
                requested_type: MessageType::Unknown,
                detected_type: MessageType::Unknown,
                final_type: MessageType::Unknown,
                raw: message.clone(),
                parsed: None,
                normalized: None,
                explain: None,
                warnings: Vec::new(),
                errors: vec![core::issue("empty_message", "message is empty", None)],
                warnings_legacy: None,
                errors_legacy: Some(vec!["message is empty".to_string()]),
            });
            continue;
        }
        let response = decode_message(message, &options);
        tracing::info!(
            warnings = response.warnings.len(),
            errors = response.errors.len(),
            message_type = %response.message_type,
            detected_type = %response.detected_type,
            "decode completed (batch)"
        );
        results.push(response);
    }

    (StatusCode::OK, Json(BatchDecodeResponse { results, errors }))
}

