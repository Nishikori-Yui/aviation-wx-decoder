# aviation-wx-taf

TAF parser and normalizer for the `aviation-wx` project.

## Features

- Parse TAF messages into structured fields
- Normalize wind, visibility, clouds, trend groups, and valid period
- Preserve unknown tokens as warnings for deterministic downstream behavior

## Output Layers

- `parsed`: raw extracted groups from source message
- `normalized`: unit-normalized values and shape harmonization
- `warnings`: unsupported or partially recognized fragments

## Current Coverage (MVP-Oriented)

- Issue time and validity period
- Main forecast: wind, visibility, weather, clouds
- Trend groups: `BECMG`, `TEMPO`
- Unknown groups surfaced via `raw_tokens`

## Integration

This crate is primarily consumed by `aviation-wx`. Most applications should use the facade crate unless they need TAF-only handling.
