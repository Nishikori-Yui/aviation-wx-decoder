# aviation-wx-wasm

WebAssembly bindings for `aviation-wx`.

## Exports

- `decode_json(raw, type_hint) -> String`

The function returns JSON text that can be parsed in browser environments.

## Parameters

- `raw`: original aviation message text
- `type_hint`: one of `auto`, `taf`, `metar`, `notam`

## Return Value

- JSON string in the same schema family as `aviation-wx` decode output
- Intended for direct use in frontend applications

## Typical JS Usage

```javascript
import init, { decode_json } from "./aviation_wx_wasm.js";

await init();
const result = JSON.parse(decode_json("METAR ...", "auto"));
```

## Notes

- This crate is intended for browser-side decode in static deployments.
- The repository web frontend uses this crate in WASM mode.
