# aviation-wx-notam

NOTAM parser and normalizer for the `aviation-wx` project.

## Features

- Parse common NOTAM structure (Q/A/B/C/D/E/F/G sections)
- Extract coarse-grained normalized values for downstream rendering
- Keep unsupported or unknown parts visible for debugging and review

## Current Parsing Scope

- Q line extraction and structured split
- A/B/C baseline location/time fields
- D/E/F/G optional field capture
- Text-first strategy for body content (`E`) with graceful fallback

## Intentional Constraints

- Does not claim full ICAO semantic completeness.
- Prioritizes stability and usefulness for UI explanation pipelines.
- Ambiguous tokens are retained and surfaced rather than silently dropped.

## Integration

This crate is used by `aviation-wx` for NOTAM decode paths.
