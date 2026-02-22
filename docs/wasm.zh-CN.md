# WASM 前端构建

本项目支持仅使用 WASM 的前端解码路径。Rust 核心仍是唯一解码实现，并被编译成 WebAssembly。

## 构建步骤

1) 安装 `wasm-pack`：

```bash
cargo install wasm-pack
```

2) 构建 WASM 包（在仓库根目录执行）：

```bash
wasm-pack build crates/aviation-wx-wasm --target web --out-dir ../../web/public/wasm
```

说明：`wasm-pack` 的 `--out-dir` 是相对于 crate 目录解析的，上面的路径会把构建产物输出到前端 `public` 目录。

如果你已经构建到了 crate 目录，可以手动复制产物：

- macOS / Linux:

```bash
cp -f crates/aviation-wx-wasm/web/public/wasm/* web/public/wasm/
```

- Windows (PowerShell):

```powershell
Copy-Item -Force crates\aviation-wx-wasm\web\public\wasm\* web\public\wasm\
```

3) 在前端启用 WASM 模式：

```bash
# web/.env
VITE_USE_WASM=true
```

前端将加载 `/wasm/aviation_wx_wasm.js` 并在本地完成解码。

## 说明

- WASM 模块仅返回结构化 JSON（不包含 explain/i18n）。
- 后端仍可同时运行；UI 会显示解码来源是 `wasm` 还是 `backend`。
- 如果出现 “WASM bundle not found” 类报错，说明 `web/public/wasm` 中缺少真实产物。
