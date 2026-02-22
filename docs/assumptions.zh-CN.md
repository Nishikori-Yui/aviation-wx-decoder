# 假设与限制

- 解析采用基于 token 的宽松策略。无法识别的 token 会保留在 `raw_tokens` 中，并通过 `warnings` 返回。
- TAF 变化组目前只支持基础的 `BECMG` / `TEMPO`，可选带有效期，字段覆盖有限。
- 天气现象代码保持原始 token，不在 MVP 阶段做完整 ICAO 语义展开。
- 能见度解析：
  - TAF/METAR 的 `dddd` 按米处理。
  - `9999` 归一化为 10km 或以上。
  - METAR 的英里能见度支持简化格式：`xSM` 或 `x/ySM`。
  - `CAVOK` 映射为能见度 10km+ 且无显著云。
- 时间组（`DDHHMMZ`、`DDHH/DDHH`）不带年月上下文。
- 归一化结果提供高度表换算（inHg 和 hPa）。当 `QNH` 与 `Altimeter` 同时存在时，以 `QNH` 为主并给出 warning。
- NOTAM 目前只按标签抽取 `Q/A/B/C/D/E/F/G` 字段，不进行完整 ICAO 语义解码。
- 报文类型识别是启发式，可能返回 `unknown`。
- 翻译输出目前主要面向 `zh-CN`。
- 风向波动组 `dddVddd` 只作为范围字段保存，不做更多校验。
- RVR 目前仅抽取跑道/数值/趋势，不解析 `P/M` 修饰和单位换算。
- `RMK` 作为原始字符串与 token 保存，不做语义扩展。
