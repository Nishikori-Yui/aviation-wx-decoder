export function padNumber(value, length = 2) {
  return String(value ?? "").padStart(length, "0");
}

export function formatUtcTime(utc) {
  if (!utc) {
    return "";
  }
  return `${padNumber(utc.day)} ${padNumber(utc.hour)}:${padNumber(utc.minute)} UTC`;
}

export function formatValidity(period) {
  if (!period?.from || !period?.to) {
    return "";
  }
  return `${formatUtcTime(period.from)} - ${formatUtcTime(period.to)}`;
}

export function formatWind(wind) {
  if (!wind) {
    return "";
  }
  const direction = wind.direction_deg ?? null;
  const speed = wind.speed_kt ?? wind.speed;
  const gust = wind.gust_kt ?? wind.gust;
  const label = direction !== null ? `${direction}°` : "VRB";
  if (gust) {
    return `${label} ${speed}kt gust ${gust}kt`;
  }
  return `${label} ${speed}kt`;
}

export function formatVisibility(distanceM) {
  if (!distanceM && distanceM !== 0) {
    return "";
  }
  if (distanceM >= 10000) {
    return ">= 10km";
  }
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }
  return `${distanceM} m`;
}

export function formatTemperature(pair) {
  if (!pair) {
    return "";
  }
  return `${pair.temperature_c}°C / ${pair.dewpoint_c}°C`;
}

export function formatCloudLayer(layer) {
  if (!layer) {
    return "";
  }
  if (layer.height_ft) {
    return `${layer.amount} ${layer.height_ft}ft`;
  }
  return layer.amount;
}

export function formatClouds(clouds) {
  if (!clouds || clouds.length === 0) {
    return "";
  }
  return clouds.map(formatCloudLayer).join(", ");
}

export function formatPressure(pressure) {
  if (!pressure) {
    return "";
  }
  return `${pressure.value} ${pressure.unit}`;
}

export function formatStationDisplay(code, station, locale) {
  if (!station) {
    return code || "";
  }
  const primary =
    locale === "en"
      ? station.name_en || station.name_local || station.name
      : station.name_zh_hans || station.name_zh || station.name_en || station.name_local || station.name;
  if (!primary) {
    return code || "";
  }
  return `${code} · ${primary}`;
}

export function formatStationName(station, locale) {
  if (!station) {
    return "";
  }
  if (locale === "en") {
    return station.name_en || station.name_local || station.name || "";
  }
  return (
    station.name_zh_hans ||
    station.name_zh ||
    station.name_en ||
    station.name_local ||
    station.name ||
    ""
  );
}

export function formatRvr(rvr, tendencyText) {
  if (!rvr) {
    return "";
  }
  const base = rvr.vis_vary_m ? `${rvr.vis_m}-${rvr.vis_vary_m} m` : `${rvr.vis_m} m`;
  if (tendencyText) {
    return `${base} (${tendencyText})`;
  }
  return base;
}
