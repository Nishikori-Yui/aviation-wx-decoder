# METAR 覆盖说明

本文档记录 METAR 支持的增量能力，以及 parsed/normalized 输出新增的字段。

## 第一阶段新增

- 高度表（`Axxxx`）支持：
  - Parsed：`pressure` 保留原始值和单位。
  - Normalized：新增 `pressure_inhg: f32` 与 `pressure_hpa: f32`（保留 1 位小数）。
  - Translation：输出 QNH/高度表对应 hPa；若 Q 和 A 同时存在，Q 为主，A 作为辅助信息。

- 风向波动组（`dddVddd`）：
  - Parsed：新增 `wind_variation: { from_deg, to_deg }`。
  - Normalized：新增 `wind_variation: { from_deg, to_deg }`。
  - Translation：增加“风向在 xxx°–yyy° 间波动”说明。

- RVR 组（`Rxx/xxxx` 或 `Rxx/xxxxVyyyy`，趋势 `U/D/N`）：
  - Parsed/Normalized：新增 `rvr` 列表，包含跑道、能见度区间与趋势。
  - Translation：说明跑道 RVR 数值范围与趋势。

- RMK 块：
  - Parsed：保留 `rmk_raw` 和 `rmk_tokens`（按空白分词）。
  - Translation：追加简短备注说明，长度截断为 120 字符。
