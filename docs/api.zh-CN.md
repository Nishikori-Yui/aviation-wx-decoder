# API（中文）

基础地址：`http://127.0.0.1:17643`

## GET /healthz

响应：

```json
{ "status": "ok" }
```

## POST /v1/decode

请求：

```json
{
  "message": "TAF ...",
  "type": "auto|taf|metar|notam",
  "output": { "json": true, "explain": true },
  "lang": "zh-CN",
  "detail": "brief|normal|full"
}
```

类型冲突行为：

- 当 `type` 不是 `auto` 且与自动识别类型不一致时，服务端仍按请求类型解析。
- 返回中会附带 warning；当 `detail=full` 时，`explain` 开头会追加提示语。

响应：

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

请求：

```json
{
  "messages": ["...", "..."],
  "type": "auto",
  "output": { "json": true, "explain": true },
  "lang": "zh-CN",
  "detail": "normal"
}
```

响应：

```json
{
  "results": [
    { "schema_version": "1.0", "type": "taf", "detected_type": "taf", "raw": "..." }
  ],
  "errors": []
}
```
