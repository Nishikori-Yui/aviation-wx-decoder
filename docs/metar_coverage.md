# METAR Coverage Notes

This document lists incremental additions for METAR support and the fields added to parsed/normalized outputs.

## Stage 1 Additions

- Altimeter support (`Axxxx`):
  - Parsed: `pressure` keeps raw value + unit.
  - Normalized: add `pressure_inhg: f32` and `pressure_hpa: f32` (1 decimal).
  - Translation: include QNH/altimeter hPa output; if both Q and A exist, Q is primary and A is auxiliary.

- Wind variation group (`dddVddd`):
  - Parsed: add `wind_variation: { from_deg, to_deg }`.
  - Normalized: add `wind_variation: { from_deg, to_deg }`.
  - Translation: add "wind varies xxx°–yyy°".

- RVR group (`Rxx/xxxx` or `Rxx/xxxxVyyyy` with tendency `U/D/N`):
  - Parsed/Normalized: add `rvr` list with runway, visibility range, and tendency.
  - Translation: mention runway RVR range and tendency.

- RMK block:
  - Parsed: keep `rmk_raw` and `rmk_tokens` (split by whitespace).
  - Translation: include short note, truncated to 120 characters.

