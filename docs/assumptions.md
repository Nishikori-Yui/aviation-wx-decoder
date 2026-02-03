# Assumptions and Limitations

- Parsing is token-based and intentionally forgiving. Unknown tokens are preserved in `raw_tokens` and reported via `warnings`.
- TAF trends support only basic `BECMG` and `TEMPO` blocks with optional validity and limited fields.
- Weather codes are kept as raw tokens; no full ICAO expansion is attempted in MVP.
- Visibility parsing:
  - TAF/METAR meters: `dddd` is treated as meters.
  - `9999` is normalized to 10km or more.
  - METAR statute miles: `xSM` or `x/ySM` is supported in a simplified form.
  - `CAVOK` is mapped to 10km+ visibility with no significant cloud.
- Time groups (`DDHHMMZ`, validity `DDHH/DDHH`) are stored without month/year context.
- Altimeter conversion is provided in normalized output (inHg and hPa). If both QNH and altimeter are present, QNH is used as the primary pressure and a warning is emitted.
- NOTAM parsing only extracts Q/A/B/C/D/E/F/G fields by tags and does not attempt full ICAO semantic decoding.
- Type detection is heuristic and can return `unknown`.
- Translation output currently targets `zh-CN` only.
- Wind variation group `dddVddd` is captured as a simple range without additional validation.
- RVR parsing only extracts runway/visibility/tendency and does not interpret `P/M` modifiers or unit conversions.
- RMK is stored as raw string/tokens without semantic expansion.

