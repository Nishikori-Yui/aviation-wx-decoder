# aviation-wx-metar

METAR parser and normalizer for the `aviation-wx` project.

## Features

- Parse core METAR groups (wind, visibility, weather, cloud, temperature, pressure)
- Normalize units and weather-related values
- Expose warnings for partially recognized segments

## Current Coverage

- Wind (including gust and variable direction groups)
- Visibility (`m`, `SM`)
- Weather and cloud groups
- Temperature/dew point
- QNH (`Qxxxx`) and altimeter (`Axxxx`) normalization
- RVR structural extraction
- RMK raw/tokens preservation

## Design Notes

- Focuses on high-value, low-ambiguity extraction.
- Keeps unrecognized tokens in stable order for snapshot-friendly output.
- Provides both `parsed` and `normalized` representations for frontend/backend use.

## Integration

Used by `aviation-wx` as the METAR backend implementation.
