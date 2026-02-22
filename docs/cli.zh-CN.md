# CLI 用法

CLI 只输出结构化 JSON，不包含 `explain`，也不接受 `lang` 参数。

## 单条报文

```bash
aviation-wx --type metar "METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015"
```

示例输出（节选）：

```json
{
  "schema_version": "1.0",
  "type": "metar",
  "requested_type": "metar",
  "detected_type": "metar",
  "final_type": "metar",
  "raw": "METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015",
  "parsed": {
    "station": "ZBAA",
    "issue_time": { "day": 1, "hour": 12, "minute": 0 },
    "wind": { "direction_deg": 20, "variable": false, "speed": 5, "gust": null, "unit": "MPS" }
  },
  "normalized": {
    "station": "ZBAA",
    "visibility_m": 6000,
    "pressure_hpa": 1015.0
  },
  "warnings": [],
  "errors": []
}
```

## 批量文件

每行一条报文。模板见：`tests/fixtures/cli/batch.txt`。

```bash
aviation-wx --batch tests/fixtures/cli/batch.txt --pretty --out output.json
```

批量输出是 JSON 数组：

```json
[
  {
    "schema_version": "1.0",
    "type": "metar",
    "raw": "METAR ...",
    "parsed": { "station": "ZBAA" },
    "normalized": { "station": "ZBAA" },
    "warnings": [],
    "errors": []
  },
  {
    "schema_version": "1.0",
    "type": "taf",
    "raw": "TAF ...",
    "parsed": { "station": "ZBAA" },
    "normalized": { "station": "ZBAA" },
    "warnings": [],
    "errors": []
  }
]
```

## 输出模式

- `--mode with-raw`（默认）会在 JSON 中保留原始报文。
- `--mode parsed-only` 会省略原始报文，仅输出 parsed + normalized。

## 输出到文件

```bash
aviation-wx --type notam --file path/to/notam.txt --pretty --out result.json
```
