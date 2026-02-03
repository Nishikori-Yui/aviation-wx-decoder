# API

Base URL: `http://127.0.0.1:17643`

## GET /healthz

Response:

```json
{ "status": "ok" }
```

## POST /v1/decode

Request:

```json
{
  "message": "TAF ...",
  "type": "auto|taf|metar|notam",
  "output": { "json": true, "explain": true },
  "lang": "zh-CN",
  "detail": "brief|normal|full"
}
```

Type conflict behavior:

- If `type` is not `auto` and the detected type differs, the service still parses using the requested type.
- A warning is emitted, and when `detail=full` the explanation starts with a short notice.

Response:

```json
{
  "schema_version": "1.0",
  "type": "taf|metar|notam|unknown",
  "requested_type": "taf|metar|notam|unknown",
  "detected_type": "taf|metar|notam|unknown",
  "final_type": "taf|metar|notam|unknown",
  "raw": "...",
  "parsed": { ... },
  "normalized": { ... },
  "explain": "...",
  "warnings": [{ "code": "warning", "message": "...", "token": "..." }],
  "errors": [{ "code": "error", "message": "...", "token": "..." }],
  "warnings_legacy": [],
  "errors_legacy": []
}
```

## POST /v1/decode/batch

Request:

```json
{
  "messages": ["...", "..."],
  "type": "auto",
  "output": { "json": true, "explain": true },
  "lang": "zh-CN",
  "detail": "normal"
}
```

Response:

```json
{
  "results": [
    { "schema_version": "1.0", "type": "taf", "detected_type": "taf", "raw": "..." }
  ],
  "errors": []
}
```

