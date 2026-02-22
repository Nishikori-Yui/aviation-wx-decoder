# aviation-wx-core

Shared models, message types, normalization primitives, and error types used by the `aviation-wx` ecosystem.

## What Is Included

- Shared AST-like structs for TAF / METAR / NOTAM parsing output
- Unified decode envelope and message type definitions
- Warning and error item model used across all crates
- Common utility helpers used by parser/normalizer crates

## Typical Consumers

- `aviation-wx-taf`
- `aviation-wx-metar`
- `aviation-wx-notam`
- `aviation-wx` (facade crate)

## Stability Notes

- This crate is internal-facing by design but published for dependency graph correctness.
- Data model changes may require synchronized version bumps in parser crates.
- Most users should depend on `aviation-wx` directly unless they need low-level model access.
