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

## iOS Shortcuts (WASM decode via Pages)

This uses the hosted WASM page and does not require a backend server. The decoder page is:

```
https://<your-pages-domain>/shortcut.html
```

### Shortcut steps

1) **Ask for Input**  
Prompt (bilingual): `请输入报文 / Enter message`

2) **Choose from Menu (message type)**  
Title (bilingual): `选择报文类型 / Choose message type`  
Options (exact labels):
- Auto
- METAR
- TAF
- NOTAM

3) **Choose from Menu (language)**  
Title (bilingual): `选择语言 / Choose language`  
Options (exact labels):
- 简体中文
- English

4) **Dictionary**  
Build an object with:
- `message`: output from step 1  
- `type`: output from step 2 (lowercase `auto|metar|taf|notam`)  
- `lang`: output from step 3 (`zh-CN` for 简体中文, `en` for English)

5) **Run JavaScript on Web Page**  
URL: `https://<your-pages-domain>/shortcut.html`  
Input: the dictionary from step 4  
Script:

```javascript
const run = async () => {
  try {
    const result = await window.decodeMessage(input);
    completion(result);
  } catch (err) {
    completion(`Decode failed: ${err}`);
  }
};
run();
```

6) **Show Result** (optional)  
7) **Copy to Clipboard** (recommended)
