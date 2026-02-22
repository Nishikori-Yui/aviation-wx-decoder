# 响应结构（Schema）

所有接口共用的顶层结构：

- `schema_version`：结构版本号（当前 `1.0`）。
- `type`：最终用于解析的报文类型（`taf`、`metar`、`notam`、`unknown`）。
- `requested_type`：调用方请求类型（`taf`、`metar`、`notam`、`unknown`）。
- `detected_type`：自动识别类型（`taf`、`metar`、`notam`、`unknown`）。
- `final_type`：综合请求与识别后最终使用的类型。
- `raw`：原始输入报文（trim 后）。
- `parsed`：解析结果（按类型）或 `null`。
- `normalized`：归一化结果（按类型）或 `null`。
- `explain`：自然语言说明（中文）或 `null`。
- `warnings`：告警数组，元素结构为 `{ code, message, token?, span? }`。
- `errors`：错误数组，元素结构为 `{ code, message, token?, span? }`。
- `warnings_legacy`：可选，旧版 warning 字符串数组。
- `errors_legacy`：可选，旧版 error 字符串数组。

## TAF Parsed

- `station`：ICAO 台站代码（若识别到）。
- `issue_time`：`{ day, hour, minute }`。
- `validity`：`{ from, to }`，其中 `from/to` 都是 `UtcTime`。
- `wind`：`{ direction_deg, variable, speed, gust, unit }`。
- `visibility`：`{ distance, unit, raw }`。
- `weather`：天气 token（原始代码）。
- `clouds`：云层列表（量、高度、类型）。
- `temperatures`：温度组原文，如 `TX02/0212Z`。
- `trends`：`BECMG` / `TEMPO` 变化段（部分字段）。
- `raw_tokens`：解析器未识别 token。

## METAR Parsed

- `station`、`issue_time`、`wind`、`visibility`、`weather`、`clouds`。
- `wind_variation`：若有 `dddVddd`，则为 `{ from_deg, to_deg }`。
- `rvr`：`{ runway, vis_m, vis_vary_m, tendency }` 列表。
- `temperature`：`{ temperature_c, dewpoint_c }`。
- `pressure_qnh`：若有 `Qxxxx`，则为 `{ value, unit }`。
- `altimeter`：若有 `Axxxx`，则为 `{ value, unit }`。
- `pressure`：兼容字段（优先 QNH，否则 altimeter）。
- `rmk_raw`：`RMK` 之后的原始字符串（若存在）。
- `rmk_tokens`：`RMK` 之后按空白分词结果。
- `trend`：若存在则为 `NOSIG` / `BECMG` / `TEMPO`。
- `raw_tokens`：解析器未识别 token。

## NOTAM Parsed

- `q_line`、`a`、`b`、`c`、`d`、`e`、`f`、`g`。
- `raw_lines`：从输入中提取的原始行。

## Normalized

归一化结构与 parsed 基本对应，重点转换字段如下：

- `wind`：统一换算为节（`speed_kt`、`gust_kt`）。
- `wind_variation`：透传 parsed 中的 `{ from_deg, to_deg }`。
- `rvr`：`{ runway, vis_m, vis_vary_m, tendency }` 列表。
- `visibility_m`：能见度（米）。
- `pressure_hpa`：hPa（`f32`），优先 QNH，否则由高度表推导。
- `pressure_inhg`：英寸汞柱（`f32`，来自高度表）。
- `pressure_hpa_int`：兼容整型 hPa（当来自 `Qxxxx` 时）。
- `rmk_raw`：`RMK` 后原始字符串。
- `rmk_tokens`：`RMK` 后分词结果。
