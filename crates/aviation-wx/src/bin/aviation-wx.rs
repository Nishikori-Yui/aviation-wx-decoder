use std::{fs, path::PathBuf};

use aviation_wx::{decode_message, DecodeOptions, DetailLevel, MessageType, NormalizedMessage, ParsedMessage};
use clap::{Parser, ValueEnum};
use serde::Serialize;

#[derive(Debug, Clone, Copy, ValueEnum)]
enum MessageTypeArg {
    Auto,
    Taf,
    Metar,
    Notam,
}

impl From<MessageTypeArg> for MessageType {
    fn from(value: MessageTypeArg) -> Self {
        match value {
            MessageTypeArg::Auto => MessageType::Unknown,
            MessageTypeArg::Taf => MessageType::Taf,
            MessageTypeArg::Metar => MessageType::Metar,
            MessageTypeArg::Notam => MessageType::Notam,
        }
    }
}

#[derive(Debug, Clone, Copy, ValueEnum)]
enum OutputMode {
    WithRaw,
    ParsedOnly,
}

#[derive(Debug, Parser)]
#[command(name = "aviation-wx")]
#[command(about = "Decode aviation weather messages into structured JSON.")]
struct Cli {
    #[arg(value_name = "MESSAGE", conflicts_with_all = ["file", "batch"])]
    message: Option<String>,
    #[arg(long, value_name = "FILE", conflicts_with_all = ["message", "batch"])]
    file: Option<PathBuf>,
    #[arg(long, value_name = "FILE", conflicts_with_all = ["message", "file"])]
    batch: Option<PathBuf>,
    #[arg(long, value_enum, default_value = "auto")]
    r#type: MessageTypeArg,
    #[arg(long, value_enum, default_value = "with-raw")]
    mode: OutputMode,
    #[arg(long, value_name = "FILE")]
    out: Option<PathBuf>,
    #[arg(long)]
    pretty: bool,
}

#[derive(Debug, Serialize)]
struct CliOutput {
    schema_version: String,
    #[serde(rename = "type")]
    message_type: MessageType,
    requested_type: MessageType,
    detected_type: MessageType,
    final_type: MessageType,
    #[serde(skip_serializing_if = "Option::is_none")]
    raw: Option<String>,
    parsed: Option<ParsedMessage>,
    normalized: Option<NormalizedMessage>,
    warnings: Vec<aviation_wx::Issue>,
    errors: Vec<aviation_wx::Issue>,
}

impl CliOutput {
    fn from_response(response: aviation_wx::DecodeResponse, mode: OutputMode) -> Self {
        let raw = match mode {
            OutputMode::WithRaw => Some(response.raw),
            OutputMode::ParsedOnly => None,
        };

        CliOutput {
            schema_version: response.schema_version,
            message_type: response.message_type,
            requested_type: response.requested_type,
            detected_type: response.detected_type,
            final_type: response.final_type,
            raw,
            parsed: response.parsed,
            normalized: response.normalized,
            warnings: response.warnings,
            errors: response.errors,
        }
    }
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let messages = load_messages(&cli)?;

    if messages.is_empty() {
        anyhow::bail!("No messages provided.");
    }

    let options = DecodeOptions {
        type_hint: cli.r#type.into(),
        lang: "en".to_string(),
        detail: DetailLevel::Normal,
        output_json: true,
        output_explain: false,
    };

    let outputs: Vec<CliOutput> = messages
        .iter()
        .map(|message| CliOutput::from_response(decode_message(message, &options), cli.mode))
        .collect();

    let has_errors = outputs.iter().any(|item| !item.errors.is_empty());

    let payload = if cli.batch.is_some() {
        serde_json::to_value(outputs)?
    } else {
        serde_json::to_value(outputs.into_iter().next().unwrap())?
    };

    let rendered = if cli.pretty {
        serde_json::to_string_pretty(&payload)?
    } else {
        serde_json::to_string(&payload)?
    };

    if let Some(path) = cli.out {
        fs::write(path, rendered)?;
    } else {
        println!("{}", rendered);
    }

    if has_errors {
        std::process::exit(2);
    }

    Ok(())
}

fn load_messages(cli: &Cli) -> anyhow::Result<Vec<String>> {
    if let Some(message) = cli.message.as_ref() {
        return Ok(vec![message.trim().to_string()]);
    }

    if let Some(path) = cli.file.as_ref() {
        let content = fs::read_to_string(path)?;
        let trimmed = content.trim();
        if trimmed.is_empty() {
            return Ok(Vec::new());
        }
        return Ok(vec![trimmed.to_string()]);
    }

    if let Some(path) = cli.batch.as_ref() {
        let content = fs::read_to_string(path)?;
        let mut messages = Vec::new();
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            messages.push(trimmed.to_string());
        }
        return Ok(messages);
    }

    Ok(Vec::new())
}
