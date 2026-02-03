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

export function buildExplanation({ data, t, locale, stationInfo, messageType, detail }) {
  if (!data) {
    return [];
  }
  const parsed = getParsed(data);
  const normalized = getNormalized(data);
  const lines = [];

  if (detail === "full" && data?.requested_type && data?.detected_type && data?.final_type) {
    if (data.requested_type !== data.detected_type || data.requested_type !== data.final_type) {
      lines.push(
        t("explain.type_notice", {
          requested: data.requested_type,
          detected: data.detected_type,
          final: data.final_type,
        })
      );
    }
  }

  const stationCode = getStationCode(data);
  const stationDisplay = stationInfo
    ? formatStationDisplay(stationInfo.code, stationInfo, locale)
    : stationCode;

  if (messageType === "metar") {
    if (stationDisplay) {
      lines.push(t("explain.metar.station", { station: stationDisplay }));
    }
    if (parsed?.issue_time) {
      lines.push(t("explain.metar.issue_time", { time: formatUtcTime(parsed.issue_time) }));
    }
    if (normalized?.wind) {
      lines.push(t("explain.metar.wind", { wind: formatWind(normalized.wind) }));
    }
    if (normalized?.wind_variation) {
      lines.push(
        t("explain.metar.wind_variation", {
          from: normalized.wind_variation.from_deg,
          to: normalized.wind_variation.to_deg,
        })
      );
    }
    if (normalized?.visibility_m) {
      lines.push(
        t("explain.metar.visibility", { visibility: formatVisibility(normalized.visibility_m) })
      );
    }
    if (normalized?.rvr?.length) {
      normalized.rvr.forEach((rvr) => {
        const tendencyText = rvrTendencyText(t, rvr.tendency);
        lines.push(
          t("explain.metar.rvr", {
            runway: rvr.runway,
            rvr: formatRvr(rvr, tendencyText),
          })
        );
      });
    }
    if (parsed?.weather?.length) {
      lines.push(t("explain.metar.weather", { weather: parsed.weather.join(", ") }));
    }
    if (parsed?.clouds?.length) {
      lines.push(t("explain.metar.clouds", { clouds: formatClouds(parsed.clouds) }));
    }
    if (parsed?.temperature) {
      lines.push(t("explain.metar.temperature", { temp: formatTemperature(parsed.temperature) }));
    }
    if (normalized?.pressure_hpa) {
      lines.push(
        t("explain.metar.pressure", {
          pressure: `${normalized.pressure_hpa.toFixed(1)} hPa`,
        })
      );
    } else if (parsed?.pressure_qnh) {
      lines.push(
        t("explain.metar.pressure", { pressure: formatPressure(parsed.pressure_qnh) })
      );
    }
    if (parsed?.rmk_raw) {
      const clipped = parsed.rmk_raw.length > 120 ? `${parsed.rmk_raw.slice(0, 120)}...` : parsed.rmk_raw;
      lines.push(t("explain.metar.remark", { remark: clipped }));
    }
    if (parsed?.trend) {
      lines.push(t("explain.metar.trend", { trend: parsed.trend }));
    }
  }

  if (messageType === "taf") {
    if (stationDisplay) {
      lines.push(t("explain.taf.station", { station: stationDisplay }));
    }
    if (parsed?.issue_time) {
      lines.push(t("explain.taf.issue_time", { time: formatUtcTime(parsed.issue_time) }));
    }
    if (parsed?.validity) {
      lines.push(t("explain.taf.validity", { validity: formatValidity(parsed.validity) }));
    }
    if (normalized?.wind) {
      lines.push(t("explain.taf.wind", { wind: formatWind(normalized.wind) }));
    }
    if (normalized?.visibility_m) {
      lines.push(
        t("explain.taf.visibility", { visibility: formatVisibility(normalized.visibility_m) })
      );
    }
    if (parsed?.weather?.length) {
      lines.push(t("explain.taf.weather", { weather: parsed.weather.join(", ") }));
    }
    if (parsed?.clouds?.length) {
      lines.push(t("explain.taf.clouds", { clouds: formatClouds(parsed.clouds) }));
    }
    if (parsed?.temperatures?.length) {
      lines.push(t("explain.taf.temperature", { temp: parsed.temperatures.join(", ") }));
    }
    if (parsed?.trends?.length) {
      const trends = parsed.trends.map((trend) => trend.kind).join(", ");
      lines.push(t("explain.taf.trends", { trends }));
    }
  }

  if (messageType === "notam") {
    const location = parsed?.a || stationDisplay || "";
    if (location) {
      lines.push(t("explain.notam.location", { location }));
    }
    if (parsed?.b || parsed?.c) {
      lines.push(
        t("explain.notam.period", {
          start: parsed?.b || "-",
          end: parsed?.c || "-",
        })
      );
    }
    if (parsed?.e) {
      lines.push(t("explain.notam.body", { body: parsed.e }));
    }
  }

  return lines;
}
