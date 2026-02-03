import { formatUtcTime } from "../../utils/format.js";
import { getNormalized, getParsed } from "../../utils/message.js";

const windRe = /^(VRB|\d{3})\d{2,3}(G\d{2,3})?(KT|MPS)$/;
const windVarRe = /^\d{3}V\d{3}$/;
const rvrRe = /^R\d{2}[LRC]?\/\d{4}(V\d{4})?[UDN]?$/;
const visibilityRe = /^\d{4}$/;
const visibilitySmRe = /^\d{1,2}SM$/;
const tempRe = /^(M?\d{2})\/(M?\d{2})$/;
const qnhRe = /^Q\d{4}$/;
const altimeterRe = /^A\d{4}$/;
const cloudRe = /^(FEW|SCT|BKN|OVC)\d{3}.*$/;
const cloudAmountRe = /^(FEW|SCT|BKN|OVC|VV)(\d{3})/;
const validityRe = /^\d{4}\/\d{4}$/;

function classifyToken({ token, parsed, normalized, messageType, t }) {
  const upper = token.toUpperCase();

  if (upper === "METAR" || upper === "SPECI" || upper === "TAF" || upper === "NOTAM") {
    return { label: t("analysis.labels.report_type"), fieldKey: "report_type" };
  }

  if (parsed?.station && upper === parsed.station) {
    return { label: t("analysis.labels.station"), fieldKey: "station" };
  }

  if (parsed?.issue_time && upper.endsWith("Z") && upper.length === 7) {
    return { label: t("analysis.labels.issue_time"), fieldKey: "issue" };
  }

  if (windRe.test(upper)) {
    return { label: t("analysis.labels.wind"), fieldKey: "wind" };
  }

  if (windVarRe.test(upper)) {
    return { label: t("analysis.labels.wind_variation"), fieldKey: "wind_variation" };
  }

  if (rvrRe.test(upper)) {
    return { label: t("analysis.labels.rvr"), fieldKey: "rvr" };
  }

  if (upper === "CAVOK" || visibilityRe.test(upper) || visibilitySmRe.test(upper)) {
    return { label: t("analysis.labels.visibility"), fieldKey: "visibility" };
  }

  if (qnhRe.test(upper) || altimeterRe.test(upper)) {
    if (altimeterRe.test(upper)) {
      return { label: t("fields.pressure_altimeter"), fieldKey: "altimeter" };
    }
    return { label: t("analysis.labels.pressure"), fieldKey: "pressure" };
  }

  if (tempRe.test(upper)) {
    return { label: t("analysis.labels.temperature"), fieldKey: "temp" };
  }

  if (cloudRe.test(upper)) {
    return { label: t("analysis.labels.clouds"), fieldKey: "clouds" };
  }

  if (parsed?.weather?.includes(upper)) {
    return { label: t("analysis.labels.weather"), fieldKey: "weather" };
  }

  if (token === "RMK") {
    return { label: t("analysis.labels.remark"), fieldKey: "rmk" };
  }
  if (parsed?.rmk_tokens?.includes(token)) {
    return { label: t("analysis.labels.remark"), fieldKey: "rmk_item" };
  }

  if (parsed?.trend && parsed.trend === upper) {
    return { label: t("analysis.labels.trend"), fieldKey: "trend" };
  }

  if (parsed?.trends?.some((trend) => trend.kind === upper)) {
    return { label: t("analysis.labels.trend"), fieldKey: "trend" };
  }

  if (messageType === "notam") {
    if (/^[A-G]\)/.test(upper) || upper.startsWith("Q)")) {
      return { label: t("analysis.labels.notam"), fieldKey: "notam" };
    }
  }

  if (parsed?.raw_tokens?.includes(token)) {
    return { label: t("analysis.labels.unknown"), fieldKey: "raw" };
  }

  return { label: t("analysis.labels.unknown"), fieldKey: "raw" };
}

function tokenDetail({ token, parsed }) {
  if (parsed?.issue_time && token.endsWith("Z") && token.length === 7) {
    return formatUtcTime(parsed.issue_time);
  }
  if (parsed?.rmk_tokens?.includes(token)) {
    return token;
  }
  return "";
}

export function buildTokenAnalysis({ data, t, locale, messageType }) {
  if (!data?.raw) {
    return [];
  }
  const parsed = getParsed(data);
  const normalized = getNormalized(data);

  if (messageType === "notam") {
    const rows = [];
    const pushRow = (key, label, token, detail, fieldKey, includeDetailInToken = true) => {
      if (!detail) {
        return;
      }
      rows.push({
        key,
        token: includeDetailInToken ? `${token} ${detail}`.trim() : token,
        label,
        detail,
        fieldKey,
      });
    };

    if (parsed?.q_line) {
      const qPartLabels = [
        t("notam.q.part_fir"),
        t("notam.q.part_qcode"),
        t("notam.q.part_traffic"),
        t("notam.q.part_purpose"),
        t("notam.q.part_scope"),
        t("notam.q.part_lower"),
        t("notam.q.part_upper"),
        t("notam.q.part_center"),
      ];
      const parts = parsed.q_line.split("/");
      pushRow(
        "notam-q-full",
        `${t("notam.q.tag_q")}${t("notam.q.part_full")}`,
        `${t("notam.q.tag_q")}${parsed.q_line}`,
        parsed.q_line,
        "q_line_full",
        false
      );
      if (parts.length > 1) {
        parts.forEach((part, index) => {
          const partLabel = qPartLabels[index] || "";
          pushRow(
            `notam-q-${index}`,
            `${t("fields.notam_q_prefix")}${partLabel || t("fields.notam_q_item")}`,
            part,
            part,
            `q_line_${index}`,
            false
          );
        });
      } else {
        pushRow(
          "notam-q",
          `${t("fields.notam_q_prefix")}${t("notam.q.part_qcode")}`,
          parsed.q_line,
          parsed.q_line,
          "q_line",
          false
        );
      }
    }
    pushRow(
      "notam-a",
      t("fields.notam_a"),
      `${t("notam.q.tag_a")}${parsed?.a || ""}`.trim(),
      parsed?.a,
      "a",
      false
    );
    pushRow(
      "notam-b",
      t("fields.notam_b"),
      `${t("notam.q.tag_b")}${parsed?.b || ""}`.trim(),
      parsed?.b,
      "b",
      false
    );
    pushRow(
      "notam-c",
      t("fields.notam_c"),
      `${t("notam.q.tag_c")}${parsed?.c || ""}`.trim(),
      parsed?.c,
      "c",
      false
    );
    pushRow(
      "notam-d",
      t("fields.notam_d"),
      `${t("notam.q.tag_d")}${parsed?.d || ""}`.trim(),
      parsed?.d,
      "d",
      false
    );
    pushRow(
      "notam-e",
      t("fields.notam_e"),
      `${t("notam.q.tag_e")}${parsed?.e || ""}`.trim(),
      parsed?.e,
      "e",
      false
    );
    pushRow(
      "notam-f",
      t("fields.notam_f"),
      `${t("notam.q.tag_f")}${parsed?.f || ""}`.trim(),
      parsed?.f,
      "f",
      false
    );
    pushRow(
      "notam-g",
      t("fields.notam_g"),
      `${t("notam.q.tag_g")}${parsed?.g || ""}`.trim(),
      parsed?.g,
      "g",
      false
    );

    if (rows.length > 0) {
      return rows;
    }
  }

  const tokens = data.raw.trim().split(/\s+/).filter(Boolean);
  let inTrend = false;
  let trendIndex = -1;
  let tempIndex = 0;

  return tokens.map((token, index) => {
    const upper = token.toUpperCase();
    if (rvrRe.test(upper) && Array.isArray(normalized?.rvr)) {
      const runwayMatch = upper.match(/^R(\d{2}[LRC]?)/);
      const runway = runwayMatch ? runwayMatch[1] : null;
      const rvrIndex = runway
        ? normalized.rvr.findIndex((item) => item.runway === runway)
        : -1;
      return {
        key: `${token}-${index}`,
        token,
        label: t("analysis.labels.rvr"),
        fieldKey: rvrIndex >= 0 ? `rvr_${rvrIndex}` : "rvr",
        detail: "",
      };
    }
    if (messageType === "taf" && validityRe.test(upper)) {
      if (inTrend) {
        return {
          key: `${token}-${index}`,
          token,
          label: t("analysis.labels.trend_period"),
          fieldKey: `trend_period_${trendIndex}`,
          detail: "",
        };
      }
      return {
        key: `${token}-${index}`,
        token,
        label: t("analysis.labels.validity"),
        fieldKey: "validity",
        detail: "",
      };
    }
    if (messageType === "taf" && (upper.startsWith("TX") || upper.startsWith("TN"))) {
      const currentIndex = tempIndex;
      tempIndex += 1;
      return {
        key: `${token}-${index}`,
        token,
        label: t("fields.temperature"),
        fieldKey: `temp_${currentIndex}`,
        detail: "",
      };
    }
    if (messageType === "taf") {
      if (upper === "BECMG" || upper === "TEMPO") {
        inTrend = true;
        trendIndex += 1;
      }
      if (inTrend && windRe.test(upper)) {
        return {
          key: `${token}-${index}`,
          token,
          label: t("analysis.labels.trend_wind"),
          fieldKey: `trend_wind_${trendIndex}`,
          detail: "",
        };
      }
      if (inTrend && (visibilityRe.test(upper) || visibilitySmRe.test(upper) || upper === "CAVOK")) {
        return {
          key: `${token}-${index}`,
          token,
          label: t("analysis.labels.trend_visibility"),
          fieldKey: `trend_visibility_${trendIndex}`,
          detail: "",
        };
      }
      if (inTrend && cloudRe.test(upper)) {
        const trendClouds = parsed?.trends?.[trendIndex]?.clouds || [];
        let trendCloudIndex = null;
        const cloudMatch = upper.match(cloudAmountRe);
        if (cloudMatch) {
          trendCloudIndex = trendClouds.findIndex((layer) => {
            if (!layer) {
              return false;
            }
            const amountMatch =
              layer.amount === cloudMatch[1] || layer.amount?.startsWith(cloudMatch[1]);
            if (!amountMatch) {
              return false;
            }
            const heightHundreds = Number(cloudMatch[2]);
            const tokenHeight = Number.isFinite(heightHundreds) ? heightHundreds * 100 : null;
            if (!tokenHeight || !layer.height_ft) {
              return false;
            }
            return Math.abs(layer.height_ft - tokenHeight) < 1;
          });
        }
        return {
          key: `${token}-${index}`,
          token,
          label: t("analysis.labels.trend_clouds"),
          fieldKey:
            trendCloudIndex !== null && trendCloudIndex >= 0
              ? `trend_cloud_${trendIndex}_${trendCloudIndex}`
              : `trend_cloud_${trendIndex}`,
          detail: "",
        };
      }
      if (inTrend) {
        const trendWeather = parsed?.trends?.[trendIndex]?.weather || [];
        const weatherIndex = trendWeather.findIndex((item) => item === upper);
        if (weatherIndex >= 0) {
          return {
            key: `${token}-${index}`,
            token,
            label: t("analysis.labels.trend_weather"),
            fieldKey: `trend_weather_${trendIndex}_${weatherIndex}`,
            detail: "",
          };
        }
      }
    }
    let cloudIndex = null;
    const cloudMatch = upper.match(cloudAmountRe);
    if (cloudMatch && Array.isArray(parsed?.clouds)) {
      cloudIndex = parsed.clouds.findIndex((layer) => {
        if (!layer) {
          return false;
        }
        const amountMatch =
          layer.amount === cloudMatch[1] || layer.amount?.startsWith(cloudMatch[1]);
        if (!amountMatch) {
          return false;
        }
        const heightHundreds = Number(cloudMatch[2]);
        const tokenHeight = Number.isFinite(heightHundreds) ? heightHundreds * 100 : null;
        if (!tokenHeight || !layer.height_ft) {
          return false;
        }
        return Math.abs(layer.height_ft - tokenHeight) < 1;
      });
    }
    const classification = classifyToken({ token, parsed, normalized, messageType, t, locale });
    const detail = tokenDetail({ token, parsed, normalized, locale });
    return {
      key: `${token}-${index}`,
      token,
      label: classification.label,
      fieldKey: classification.fieldKey,
      cloudIndex,
      detail,
    };
  });
}
