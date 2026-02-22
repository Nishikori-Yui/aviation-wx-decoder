# aviation-wx

Decode aviation weather messages (TAF, METAR, NOTAM) into structured JSON.

## Features

- Unified decode entrypoint: `decode_message`
- Auto detection for TAF / METAR / NOTAM input
- Stable response envelope: `parsed`, `normalized`, `warnings`, `errors`
- Optional natural-language explanation (for backend/UI use)
- Batch-friendly API surface through plain Rust structs

## Installation

```toml
[dependencies]
aviation-wx = "0.1.5"
```

## Basic Usage

```rust
use aviation_wx::{decode_message, DecodeOptions, MessageType};

let options = DecodeOptions {
    requested_type: MessageType::Auto,
    output_json: true,
    output_explain: false,
    lang: "en".to_string(),
    detail: aviation_wx::DetailLevel::Normal,
};

let response = decode_message("METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015", &options);
```

## Important Types

- `DecodeOptions`: controls requested type, output mode, language, detail level
- `MessageType`: `Auto | Taf | Metar | Notam | Unknown`
- `DecodeResponse`: schema envelope used by API and frontend

## Response Shape (Simplified)

```json
{
  "schema_version": "1.0",
  "type": "metar",
  "detected_type": "metar",
  "final_type": "metar",
  "raw": "METAR ...",
  "parsed": {},
  "normalized": {},
  "warnings": [],
  "errors": []
}
```

## Notes

- The crate favors robust partial parsing over hard failure.
- Unknown or unsupported groups are surfaced via `warnings`.
- For service usage, this crate is shared by the backend crate in the same workspace.

See the repository root README for end-to-end examples and API routes.
