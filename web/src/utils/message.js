export function getMessageType(data) {
  return data?.final_type || data?.type || "unknown";
}

export function getParsed(data) {
  return data?.parsed || null;
}

export function getNormalized(data) {
  return data?.normalized || null;
}

export function getStationCode(data) {
  if (!data) {
    return null;
  }
  const parsed = getParsed(data);
  const normalized = getNormalized(data);
  return normalized?.station || parsed?.station || parsed?.a || null;
}
