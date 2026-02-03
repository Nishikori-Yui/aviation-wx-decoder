# CLI usage

The CLI outputs structured JSON only. It does not include `explain` and does not accept `lang`.

## Single message

```bash
aviation-wx --type metar "METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015"
```

Example output (trimmed):

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

## Batch file

One message per line. See template: `tests/fixtures/cli/batch.txt`.

```bash
aviation-wx --batch tests/fixtures/cli/batch.txt --pretty --out output.json
```

Batch output is a JSON array:

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

## Output mode

- `--mode with-raw` (default) includes the raw message in JSON.
- `--mode parsed-only` omits the raw message and only returns parsed + normalized data.

## Write to file

```bash
aviation-wx --type notam --file path/to/notam.txt --pretty --out result.json
```
