import {
  formatClouds,
  formatPressure,
  formatRvr,
  formatStationDisplay,
  formatTemperature,
  formatUtcTime,
  formatValidity,
  formatVisibility,
  formatWind,
} from "../../utils/format.js";
import { getNormalized, getParsed, getStationCode } from "../../utils/message.js";
import qSubject from "../../data/lexicons/notam_q_subject.json";
import qCondition from "../../data/lexicons/notam_q_condition.json";
import firCodes from "../../data/lexicons/fir_codes.json";
import notamBodyLexicon from "../../data/lexicons/notam_body.json";

const WEATHER_DESCRIPTORS = new Set([
  "MI",
  "PR",
  "BC",
  "DR",
  "BL",
  "SH",
  "TS",
  "FZ",
  "VC",
]);

function explainWeatherToken(token, t) {
  if (!token) {
    return "";
  }
  const upper = token.toUpperCase();
  let index = 0;
  let intensity = "";
  if (upper[index] === "-" || upper[index] === "+") {
    intensity = upper[index];
    index += 1;
  }

  const descriptors = [];
  while (index + 1 < upper.length) {
    const candidate = upper.slice(index, index + 2);
    if (!WEATHER_DESCRIPTORS.has(candidate)) {
      break;
    }
    descriptors.push(candidate);
    index += 2;
    if (descriptors.length >= 2) {
      break;
    }
  }

  const phenomena = [];
  for (let i = index; i + 1 < upper.length; i += 2) {
    phenomena.push(upper.slice(i, i + 2));
  }

  const parts = [];
  if (intensity) {
    const intensityText = t(`weather.intensity.${intensity}`) || "";
    if (intensityText) {
      parts.push(intensityText);
    }
  }
  descriptors.forEach((code) => {
    const descriptorText = t(`weather.descriptor.${code}`) || "";
    if (descriptorText) {
      parts.push(descriptorText);
    }
  });
  phenomena.forEach((code) => {
    const phenomenonText = t(`weather.phenomena.${code}`) || "";
    if (phenomenonText) {
      parts.push(phenomenonText);
    }
  });

  if (parts.length === 0) {
    return upper;
  }
  return `${upper}（${parts.join(" ")}）`;
}

function explainWeatherList(list, t) {
  if (!list?.length) {
    return "";
  }
  return list.map((token) => explainWeatherToken(token, t)).join(", ");
}

function explainCloudLayer(layer, t) {
  if (!layer?.amount) {
    return "";
  }
  const heightText = layer.height_ft ? `${layer.height_ft}ft` : "";
  const meaning = t(`clouds.amount.${layer.amount}`) || "";
  const base = heightText ? `${layer.amount} ${heightText}` : layer.amount;
  if (!meaning) {
    return base;
  }
  return `${base}（${meaning}）`;
}

function explainClouds(clouds, t) {
  if (!clouds?.length) {
    return "";
  }
  return clouds.map((layer) => explainCloudLayer(layer, t)).join(", ");
}

function rvrTendencyText(t, tendency) {
  switch (tendency) {
    case "up":
      return t("analysis.tendency.up");
    case "down":
      return t("analysis.tendency.down");
    case "no_change":
      return t("analysis.tendency.no_change");
    default:
      return "";
  }
}

function formatNotamTime(raw) {
  if (!raw || typeof raw !== "string") {
    return "";
  }
  const value = raw.trim();
  if (!/^\d{10}$/.test(value)) {
    return raw;
  }
  const yy = value.slice(0, 2);
  const mm = value.slice(2, 4);
  const dd = value.slice(4, 6);
  const hh = value.slice(6, 8);
  const min = value.slice(8, 10);
  return `20${yy}-${mm}-${dd} ${hh}:${min} UTC`;
}

function explainNotamSchedule(raw, t) {
  if (!raw || typeof raw !== "string") {
    return "";
  }
  const value = raw.trim();
  const match = value.match(/^(\d{4})-(\d{4})\s*(DLY)?$/i);
  if (!match) {
    return value;
  }
  const start = `${match[1].slice(0, 2)}:${match[1].slice(2, 4)} UTC`;
  const end = `${match[2].slice(0, 2)}:${match[2].slice(2, 4)} UTC`;
  if (match[3]) {
    return t("notam.schedule.daily", { start, end });
  }
  return t("notam.schedule.range", { start, end });
}

function explainNotamBody(raw, t, locale) {
  if (!raw || typeof raw !== "string") {
    return "";
  }
  const cleaned = raw.trim().replace(/^E\)\s*/i, "");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return cleaned;
  }
  const resolveLexicon = (code) => notamBodyLexicon?.[code]?.[locale] || code;
  const mapToken = (token) => {
    const nrMatch = token.match(/^NR\.(.+)$/i);
    if (nrMatch) {
      const resolved = resolveLexicon("NR.");
      return `${resolved}${nrMatch[1]}`;
    }
    if (token.toUpperCase().includes("NR.")) {
      const resolved = resolveLexicon("NR.");
      return token.replace(/NR\./gi, resolved);
    }
    const match = token.match(/^([A-Z0-9/]+)([.,;:]*)$/i);
    const core = match ? match[1] : token;
    const suffix = match ? match[2] : "";
    const resolved = resolveLexicon(core.toUpperCase());
    return `${resolved}${suffix}`;
  };
  const result = [];
  const mappedTokens = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const upper = token.toUpperCase();
    if (
      upper === "WORK" &&
      tokens[i + 1] &&
      tokens[i + 1].toUpperCase() === "IN" &&
      tokens[i + 2] &&
      tokens[i + 2].toUpperCase() === "PROGRESS"
    ) {
      const resolved = resolveLexicon("WIP");
      result.push(resolved);
      mappedTokens.push(resolved);
      i += 2;
      continue;
    }
    if ((upper === "RWY" || upper === "TWY" || upper === "APRON") && tokens[i + 1]) {
      const target = tokens[i + 1];
      const base = `${mapToken(token)} ${target}`;
      if (tokens[i + 2] && tokens[i + 2].toUpperCase() === "CLSD") {
        const mapped = `${base} ${mapToken(tokens[i + 2])}`;
        result.push(mapped);
        mappedTokens.push(mapToken(token));
        mappedTokens.push(target);
        mappedTokens.push(mapToken(tokens[i + 2]));
        i += 2;
        continue;
      }
      result.push(base);
      mappedTokens.push(mapToken(token));
      mappedTokens.push(target);
      i += 1;
      continue;
    }
    if (upper === "ACT" && tokens[i + 1] && tokens[i + 1].toUpperCase() === "ARE") {
      result.push(resolveLexicon("ACT ARE"));
      mappedTokens.push(resolveLexicon("ACT ARE"));
      i += 1;
      continue;
    }
    if (upper === "PARKING" && tokens[i + 1] && tokens[i + 1].toUpperCase() === "STAND") {
      result.push(resolveLexicon("PARKING STAND"));
      mappedTokens.push(resolveLexicon("PARKING STAND"));
      i += 1;
      continue;
    }
    if (upper === "DUE" && tokens[i + 1] && tokens[i + 1].toUpperCase() === "TO") {
      result.push(resolveLexicon("DUE TO"));
      mappedTokens.push(resolveLexicon("DUE TO"));
      i += 1;
      continue;
    }
    if (upper === "AD" && tokens[i + 1] && tokens[i + 1].toUpperCase() === "CLSD") {
      const mapped = `${mapToken(token)} ${mapToken(tokens[i + 1])}`;
      result.push(mapped);
      mappedTokens.push(mapToken(token));
      mappedTokens.push(mapToken(tokens[i + 1]));
      i += 1;
      continue;
    }
    const mapped = mapToken(token);
    result.push(mapped);
    mappedTokens.push(mapped);
  }
  const joined = result.join(" ");
  if (joined !== cleaned) {
    return joined;
  }
  // Fallback: replace common tokens even when the spacing is unexpected.
  const common = [
    "RWY",
    "CLSD",
    "AD",
    "TWY",
    "APRON",
    "ILS",
    "U/S",
    "WIP",
    "WKG",
    "OBST",
    "VOR",
    "DME",
    "NDB",
    "LOC",
    "GS",
    "PAPI",
    "ALS",
    "RSTR",
    "AVBL",
    "UNAVBL",
    "UFN",
    "SFC",
    "FL",
    "MSL",
    "AGL",
    "BTN",
    "EXC",
    "DLY",
    "TIL",
    "EXTD",
    "EST",
  ];
  let replaced = cleaned;
  common.forEach((code) => {
    const mapped = resolveLexicon(code);
    if (mapped !== code) {
      const re = new RegExp(`\\b${code.replace("/", "\\/")}\\b`, "g");
      replaced = replaced.replace(re, mapped);
    }
  });
  if (replaced === cleaned) {
    return cleaned;
  }
  return replaced;
}

function explainQLineParts(qLine, locale, t) {
  if (!qLine || typeof qLine !== "string") {
    return [];
  }
  const parts = qLine.split("/");
  if (parts.length < 8) {
    return [];
  }
  const [fir, qCode, traffic, purpose, scope, lower, upper, centerRadius] = parts;
  const explainTraffic = () => {
    const parts = traffic.split("");
    const entries = parts.map((code) => {
      const meaningKey = `notam.q.traffic_${code}`;
      const meaning = t(meaningKey);
      const label = meaningKey === meaning ? code : meaning;
      const descKey = `notam.q.traffic_${code}_desc`;
      const desc = t(descKey);
      if (descKey !== desc) {
        return `${label} (${desc})`;
      }
      return label;
    });
    return t("notam.q.traffic", { meaning: entries.join(", ") });
  };
  const trafficText = explainTraffic();
  const explainPurpose = () => {
    const parts = purpose.split("");
    const meanings = parts.map((code) => {
      const meaningKey = `notam.q.purpose_${code}`;
      const meaning = t(meaningKey);
      return meaningKey === meaning ? code : meaning;
    });
    return t("notam.q.purpose", { meaning: meanings.join(", ") });
  };
  const purposeText = explainPurpose();
  const explainScope = () => {
    const parts = scope.split("");
    const meanings = parts.map((code) => {
      const meaningKey = `notam.q.scope_${code}`;
      const meaning = t(meaningKey);
      return meaningKey === meaning ? code : meaning;
    });
    return t("notam.q.scope", { meaning: meanings.join(", ") });
  };
  const scopeText = explainScope();
  const centerText = (() => {
    const match = centerRadius.match(/^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])(\d{3})$/);
    if (!match) {
      return t("notam.q.center", { value: centerRadius });
    }
    const [, latDeg, latMin, latHem, lonDeg, lonMin, lonHem, radius] = match;
    const lat = `${latDeg}°${latMin}'${latHem}`;
    const lon = `${lonDeg}°${lonMin}'${lonHem}`;
    return t("notam.q.center_parsed", {
      lat,
      lon,
      radius: `${Number(radius)} NM`,
    });
  })();
  const lowerText = lower;
  const upperText = upper;
  return [
    {
      key: "fir",
      raw: fir,
      explain: firCodes?.[fir]?.[locale] ? `${fir} ${firCodes[fir][locale]}` : fir,
    },
    {
      key: "q_code",
      raw: qCode,
      explain: (() => {
        if (qCode.length >= 5) {
          const subjectCode = qCode.slice(1, 3);
          const conditionCode = qCode.slice(3, 5);
          const subjectMeaning =
            subjectCode === "XX"
              ? t("notam.q.q_subject_unknown", { code: subjectCode })
              : qSubject?.[subjectCode]?.[locale] ||
            t("notam.q.q_subject_unknown", { code: subjectCode });
          const conditionMeaning =
            conditionCode === "XX"
              ? t("notam.q.q_condition_unknown", { code: conditionCode })
              : qCondition?.[conditionCode]?.[locale] ||
            t("notam.q.q_condition_unknown", { code: conditionCode });
          return t("notam.q.q_code", {
            code: qCode,
            subject_code: subjectCode,
            subject: subjectMeaning,
            condition_code: conditionCode,
            condition: conditionMeaning,
          });
        }
        const meaning = t("notam.q.q_code_unknown", { code: qCode });
        return t("notam.q.q_code_simple", { code: qCode, meaning });
      })(),
    },
    { key: "traffic", raw: traffic, explain: trafficText },
    { key: "purpose", raw: purpose, explain: purposeText },
    { key: "scope", raw: scope, explain: scopeText },
    { key: "lower", raw: lower, explain: lowerText },
    { key: "upper", raw: upper, explain: upperText },
    { key: "center", raw: centerRadius, explain: centerText },
  ];
}

export function buildFieldExplainList({ data, t, locale, stationInfo, messageType }) {
  if (!data) {
    return [];
  }
  const parsed = getParsed(data);
  const normalized = getNormalized(data);
  const items = [];
  const pushItem = (key, label, value, explain, meta) => {
    if (!value) {
      return;
    }
    items.push({ key, label, value, explain, meta });
  };

  const stationCode = getStationCode(data);
  const stationDisplay = stationInfo
    ? formatStationDisplay(stationInfo.code, stationInfo, locale)
    : stationCode;

  if (messageType === "metar") {
    pushItem(
      "station",
      t("fields.station"),
      stationDisplay,
      t("explain.metar.station", { station: stationDisplay })
    );
    const issueTime = formatUtcTime(parsed?.issue_time);
    pushItem(
      "issue",
      t("fields.issue_time"),
      issueTime,
      issueTime ? t("explain.metar.issue_time", { time: issueTime }) : ""
    );
    const windText = formatWind(normalized?.wind);
    const windExplain = windText
      ? normalized?.wind?.direction_deg === null
        ? t("explain.metar.wind_vrb", { speed: `${normalized.wind.speed_kt}kt` })
        : normalized?.wind?.gust_kt
        ? t("explain.metar.wind_gust", { wind: windText, gust: `${normalized.wind.gust_kt}kt` })
        : t("explain.metar.wind", { wind: windText })
      : "";
    pushItem("wind", t("fields.wind"), windText, windExplain);
    if (normalized?.wind_variation) {
      const variationText = `${normalized.wind_variation.from_deg}° - ${normalized.wind_variation.to_deg}°`;
      pushItem(
        "wind_variation",
        t("fields.wind_variation"),
        variationText,
        t("explain.metar.wind_variation", {
          from: normalized.wind_variation.from_deg,
          to: normalized.wind_variation.to_deg,
        })
      );
    }
    if (normalized?.visibility_m) {
      const visibilityText = formatVisibility(normalized.visibility_m);
      pushItem(
        "visibility",
        t("fields.visibility"),
        visibilityText,
        visibilityText ? t("explain.metar.visibility", { visibility: visibilityText }) : ""
      );
    } else if (parsed?.visibility?.raw) {
      pushItem("visibility_raw", t("fields.visibility"), parsed.visibility.raw, "");
    }
    if (normalized?.rvr?.length) {
      normalized.rvr.forEach((rvr, index) => {
        const tendency = rvrTendencyText(t, rvr.tendency);
        const rvrText = formatRvr(rvr, tendency);
        pushItem(
          `rvr_${index}`,
          `${t("fields.rvr")} ${rvr.runway}`,
          rvrText,
          rvrText
            ? t("explain.metar.rvr", {
                runway: rvr.runway,
                rvr: rvrText,
              })
            : ""
        );
      });
    }
    if (parsed?.weather?.length) {
      const weatherText = explainWeatherList(parsed.weather, t);
      pushItem(
        "weather",
        t("fields.weather"),
        weatherText,
        weatherText ? t("explain.metar.weather", { weather: weatherText }) : ""
      );
    }
    if (parsed?.clouds?.length) {
      const cloudText = explainClouds(parsed.clouds, t) || formatClouds(parsed.clouds);
      const cloudDetails = parsed.clouds.map((layer, index) => ({
        index,
        value: explainCloudLayer(layer, t) || formatCloudLayer(layer),
        explain: t("explain.metar.clouds", {
          clouds: explainCloudLayer(layer, t) || formatCloudLayer(layer),
        }),
      }));
      pushItem(
        "clouds",
        t("fields.clouds"),
        cloudText,
        cloudText ? t("explain.metar.clouds", { clouds: cloudText }) : "",
        { clouds: cloudDetails }
      );
    }
    if (parsed?.temperature) {
      const tempText = formatTemperature(parsed.temperature);
      pushItem(
        "temp",
        t("fields.temperature"),
        tempText,
        tempText ? t("explain.metar.temperature", { temp: tempText }) : ""
      );
    }
    if (normalized?.pressure_hpa) {
      const pressure = `${normalized.pressure_hpa.toFixed(1)} hPa`;
      pushItem(
        "pressure",
        t("fields.pressure"),
        pressure,
        t("explain.metar.pressure", { pressure })
      );
    } else if (parsed?.pressure_qnh) {
      const pressureText = formatPressure(parsed.pressure_qnh);
      pushItem(
        "pressure",
        t("fields.pressure"),
        pressureText,
        pressureText ? t("explain.metar.pressure", { pressure: pressureText }) : ""
      );
    }
    if (normalized?.pressure_inhg) {
      const altimeterText = `${normalized.pressure_inhg.toFixed(2)} inHg`;
      pushItem(
        "altimeter",
        t("fields.pressure_altimeter"),
        altimeterText,
        t("explain.metar.altimeter", { altimeter: altimeterText })
      );
    } else if (parsed?.altimeter) {
      const altimeterText = formatPressure(parsed.altimeter);
      pushItem(
        "altimeter",
        t("fields.pressure_altimeter"),
        altimeterText,
        t("explain.metar.altimeter", { altimeter: altimeterText })
      );
    }
    if (parsed?.trend) {
      pushItem(
        "trend",
        t("fields.trend"),
        parsed.trend,
        t("explain.metar.trend", { trend: parsed.trend })
      );
    }
    if (parsed?.rmk_raw) {
      const clipped = parsed.rmk_raw.length > 120 ? `${parsed.rmk_raw.slice(0, 120)}...` : parsed.rmk_raw;
      pushItem("rmk", t("fields.rmk"), clipped, t("explain.metar.remark", { remark: clipped }));
    }
    if (parsed?.raw_tokens?.length) {
      pushItem("raw", t("fields.raw_tokens"), parsed.raw_tokens.join(" "), "");
    }
  }

  if (messageType === "taf") {
    pushItem("station", t("fields.station"), stationDisplay);
    pushItem("issue", t("fields.issue_time"), formatUtcTime(parsed?.issue_time));
    pushItem("validity", t("fields.validity"), formatValidity(parsed?.validity));
    if (normalized?.wind) {
      const windText = formatWind(normalized.wind);
      const windExplain = normalized.wind.gust_kt
        ? t("explain.taf.wind_gust", { wind: windText, gust: `${normalized.wind.gust_kt}kt` })
        : t("explain.taf.wind", { wind: windText });
      pushItem("wind", t("fields.wind"), windText, windExplain);
    }
    if (normalized?.visibility_m) {
      pushItem("visibility", t("fields.visibility"), formatVisibility(normalized.visibility_m));
    } else if (parsed?.visibility?.raw) {
      pushItem("visibility_raw", t("fields.visibility"), parsed.visibility.raw);
    }
    if (parsed?.weather?.length) {
      const weatherText = explainWeatherList(parsed.weather, t);
      pushItem(
        "weather",
        t("fields.weather"),
        weatherText,
        weatherText ? t("explain.taf.weather", { weather: weatherText }) : ""
      );
    }
    if (parsed?.clouds?.length) {
      const cloudText = explainClouds(parsed.clouds, t) || formatClouds(parsed.clouds);
      const cloudDetails = parsed.clouds.map((layer, index) => ({
        index,
        value: explainCloudLayer(layer, t) || formatCloudLayer(layer),
        explain: t("explain.taf.clouds", {
          clouds: explainCloudLayer(layer, t) || formatCloudLayer(layer),
        }),
      }));
      pushItem(
        "clouds",
        t("fields.clouds"),
        cloudText,
        cloudText ? t("explain.taf.clouds", { clouds: cloudText }) : "",
        { clouds: cloudDetails }
      );
    }
    if (parsed?.temperatures?.length) {
      const explainTemp = (token) => {
        const match = token.match(/^T([XN])M?(\d{2})\/(\d{2})(\d{2})Z$/);
        if (!match) {
          return token;
        }
        const kind = match[1] === "X" ? t("taf.temp.max") : t("taf.temp.min");
        const tempSign = token.includes("M") ? "-" : "";
        const temp = `${tempSign}${match[2]}°C`;
        const day = match[3];
        const hour = match[4];
        return t("taf.temp.explain", { kind, temp, time: `${day} ${hour}:00 UTC` });
      };
      parsed.temperatures.forEach((temp, index) => {
        pushItem(
          `temp_${index}`,
          t("fields.temperature"),
          temp,
          explainTemp(temp)
        );
      });
    }
    if (parsed?.trends?.length) {
      const summary = parsed.trends.map((trend) => trend.kind).join(", ");
      pushItem("trends", t("fields.trend"), summary);
      parsed.trends.forEach((trend, index) => {
        const trendWind = normalized?.trends?.[index]?.wind || trend.wind;
        if (!trendWind) {
          return;
        }
        const windText = formatWind(trendWind);
        if (!windText) {
          return;
        }
        pushItem(
          `trend_wind_${index}`,
          t("analysis.labels.trend_wind"),
          windText,
          t("explain.taf.trend_wind", { wind: windText })
        );
      });
      parsed.trends.forEach((trend, index) => {
        if (trend.period) {
          const periodText = formatValidity(trend.period);
          pushItem(
            `trend_period_${index}`,
            t("analysis.labels.trend_period"),
            periodText,
            t("explain.taf.trend_period", { period: periodText })
          );
        }
        const trendVisibility = normalized?.trends?.[index]?.visibility_m;
        if (trendVisibility) {
          const visibilityText = formatVisibility(trendVisibility);
          pushItem(
            `trend_visibility_${index}`,
            t("analysis.labels.trend_visibility"),
            visibilityText,
            t("explain.taf.trend_visibility", { visibility: visibilityText })
          );
        } else if (trend.visibility?.raw) {
          pushItem(
            `trend_visibility_${index}`,
            t("analysis.labels.trend_visibility"),
            trend.visibility.raw,
            t("explain.taf.trend_visibility", { visibility: trend.visibility.raw })
          );
        }
        if (trend.weather?.length) {
          trend.weather.forEach((token, weatherIndex) => {
            const weatherText = explainWeatherToken(token, t);
            pushItem(
              `trend_weather_${index}_${weatherIndex}`,
              t("analysis.labels.trend_weather"),
              weatherText,
              t("explain.taf.trend_weather", { weather: weatherText })
            );
          });
        }
        if (trend.clouds?.length) {
          trend.clouds.forEach((layer, cloudIndex) => {
            const cloudText = explainCloudLayer(layer, t) || formatCloudLayer(layer);
            pushItem(
              `trend_cloud_${index}_${cloudIndex}`,
              t("analysis.labels.trend_clouds"),
              cloudText,
              t("explain.taf.trend_clouds", { clouds: cloudText })
            );
          });
        }
      });
    }
    if (parsed?.raw_tokens?.length) {
      pushItem("raw", t("fields.raw_tokens"), parsed.raw_tokens.join(" "));
    }
  }

  if (messageType === "notam") {
    if (parsed?.q_line) {
      const qParts = explainQLineParts(parsed.q_line, locale, t);
      if (qParts.length > 0) {
        pushItem(
          "q_line_full",
          `${t("notam.q.tag_q")}${t("notam.q.part_full")}`,
          `${t("notam.q.tag_q")}${parsed.q_line}`,
          ""
        );
        qParts.forEach((part, index) => {
          pushItem(
            `q_line_${index}`,
            `${t("fields.notam_q_prefix")}${t(`notam.q.part_${part.key}`)}`,
            part.raw,
            part.explain,
            { q_part: part.key }
          );
        });
      } else {
        pushItem(
          "q_line_full",
          `${t("notam.q.tag_q")}${t("notam.q.part_full")}`,
          `${t("notam.q.tag_q")}${parsed.q_line}`,
          ""
        );
      }
    }
    pushItem(
      "a",
      t("fields.notam_a"),
      parsed?.a,
      parsed?.a ? t("explain.notam.location", { location: parsed.a }) : ""
    );
    const bText = formatNotamTime(parsed?.b);
    const cText = formatNotamTime(parsed?.c);
    pushItem(
      "b",
      t("fields.notam_b"),
      bText,
      bText ? t("explain.notam.start", { start: bText }) : ""
    );
    pushItem(
      "c",
      t("fields.notam_c"),
      cText,
      cText ? t("explain.notam.end", { end: cText }) : ""
    );
    const scheduleText = explainNotamSchedule(parsed?.d, t);
    pushItem("d", t("fields.notam_d"), parsed?.d, scheduleText);
    const bodyText = explainNotamBody(parsed?.e, t, locale) || parsed?.e || "";
    pushItem(
      "e",
      t("fields.notam_e"),
      parsed?.e,
      bodyText ? t("explain.notam.body", { body: bodyText }) : ""
    );
    pushItem("f", t("fields.notam_f"), parsed?.f);
    pushItem("g", t("fields.notam_g"), parsed?.g);
  }

  return items;
}
