# Response Schema

Top-level envelope (all endpoints):

- `schema_version`: Schema version string (current: `1.0`).
- `type`: Final message type used for parsing (`taf`, `metar`, `notam`, `unknown`).
- `requested_type`: Type requested by the caller (`taf`, `metar`, `notam`, `unknown`).
- `detected_type`: Type inferred by heuristics (`taf`, `metar`, `notam`, `unknown`).
- `final_type`: Final type chosen after applying request/detection rules.
- `raw`: Raw input message (trimmed).
- `parsed`: Parser output (type-specific object) or `null`.
- `normalized`: Normalized output (type-specific object) or `null`.
- `explain`: Natural-language explanation (Chinese) or `null`.
- `warnings`: Array of warning objects with `{ code, message, token?, span? }`.
- `errors`: Array of error objects with `{ code, message, token?, span? }`.
- `warnings_legacy`: Optional array of legacy warning strings.
- `errors_legacy`: Optional array of legacy error strings.

## TAF Parsed

- `station`: ICAO station code (if detected).
- `issue_time`: `{ day, hour, minute }`.
- `validity`: `{ from, to }` using `UtcTime`.
- `wind`: `{ direction_deg, variable, speed, gust, unit }`.
- `visibility`: `{ distance, unit, raw }`.
- `weather`: Weather tokens (raw codes).
- `clouds`: Cloud layers with amount/height/type.
- `temperatures`: Raw temperature groups like `TX02/0212Z`.
- `trends`: `BECMG`/`TEMPO` segments with partial fields.
- `raw_tokens`: Tokens not recognized by the parser.

## METAR Parsed

- `station`, `issue_time`, `wind`, `visibility`, `weather`, `clouds`.
- `wind_variation`: `{ from_deg, to_deg }` if `dddVddd` is present.
- `rvr`: list of `{ runway, vis_m, vis_vary_m, tendency }`.
- `temperature`: `{ temperature_c, dewpoint_c }`.
- `pressure_qnh`: `{ value, unit }` from `Qxxxx` if present.
- `altimeter`: `{ value, unit }` from `Axxxx` if present.
- `pressure`: compatibility field (QNH preferred, else altimeter).
- `rmk_raw`: raw string after `RMK` (if present).
- `rmk_tokens`: whitespace-split tokens after `RMK`.
- `trend`: `NOSIG`/`BECMG`/`TEMPO` if present.
- `raw_tokens`: Tokens not recognized by the parser.

## NOTAM Parsed

- `q_line`, `a`, `b`, `c`, `d`, `e`, `f`, `g`.
- `raw_lines`: Raw lines extracted from the input.

## Normalized

Normalized output mirrors parsed structures but converts key fields:

- `wind`: converted to knots (`speed_kt`, `gust_kt`).
- `wind_variation`: copy of `{ from_deg, to_deg }` from parsed.
- `rvr`: list of `{ runway, vis_m, vis_vary_m, tendency }`.
- `visibility_m`: meters for visibility (if available).
- `pressure_hpa`: hPa as `f32` (QNH preferred, otherwise altimeter-derived).
- `pressure_inhg`: inches of mercury as `f32` (altimeter).
- `pressure_hpa_int`: legacy integer hPa when parsed from `Qxxxx`.
- `rmk_raw`: raw string after `RMK`.
- `rmk_tokens`: whitespace-split tokens after `RMK`.

