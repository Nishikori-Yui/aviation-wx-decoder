# WASM frontend build

This project supports a WASM-only frontend decode path. The Rust core remains authoritative and is compiled into WebAssembly.

## Build steps

1) Install wasm-pack:

```bash
cargo install wasm-pack
```

2) Build the WASM bundle (run from repo root):

```bash
wasm-pack build crates/aviation-wx-wasm --target web --out-dir ../../web/public/wasm
```

Note: `wasm-pack` resolves `--out-dir` relative to the crate directory, so the command above uses a relative path to the frontend public folder.

If you already ran a build into the crate folder, you can copy artifacts:

```bash
Copy-Item -Force crates\aviation-wx-wasm\web\public\wasm\* web\public\wasm\
```

3) Enable WASM mode in the frontend:

```bash
# web/.env
VITE_USE_WASM=true
```

The frontend will load `/wasm/aviation_wx_wasm.js` and decode messages locally.

## Notes

- The WASM module returns structured JSON only (no explain/i18n).
- You can still run the backend; the UI will show whether it used `wasm` or `backend`.
- If you see a runtime message about the WASM bundle not found, it means the real wasm output is missing in `web/public/wasm`.
