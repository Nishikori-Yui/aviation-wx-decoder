const SLP_RE = /^SLP(\d{3})$/i;
const TEMP_DEW_RE = /^T([01])(\d{3})([01])(\d{3})$/i;
const PRECIP_1H_RE = /^P(\d{4})$/i;

function parseSlp(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  const pressure = num >= 500 ? 900 + num / 10 : 1000 + num / 10;
  return pressure.toFixed(1);
}

function parseSignedTemp(sign, digits) {
  const temp = Number(digits) / 10;
  if (!Number.isFinite(temp)) {
    return null;
  }
  const signed = sign === "1" ? -temp : temp;
  return signed.toFixed(1);
}

export function explainRemarkToken(token, t) {
  if (!token) {
    return "";
  }
  const upper = token.toUpperCase();

  if (upper === "AO1") {
    return t("remark.ao1");
  }
  if (upper === "AO2") {
    return t("remark.ao2");
  }

  const slpMatch = upper.match(SLP_RE);
  if (slpMatch) {
    const pressure = parseSlp(slpMatch[1]);
    if (pressure) {
      return t("remark.slp", { pressure });
    }
  }

  const tempMatch = upper.match(TEMP_DEW_RE);
  if (tempMatch) {
    const temp = parseSignedTemp(tempMatch[1], tempMatch[2]);
    const dew = parseSignedTemp(tempMatch[3], tempMatch[4]);
    if (temp && dew) {
      return t("remark.temp_dewpoint", { temp, dew });
    }
    if (temp) {
      return t("remark.temp_only", { temp });
    }
    if (dew) {
      return t("remark.dew_only", { dew });
    }
  }

  const precipMatch = upper.match(PRECIP_1H_RE);
  if (precipMatch) {
    const amount = (Number(precipMatch[1]) / 100).toFixed(2);
    if (Number.isFinite(Number(amount))) {
      return t("remark.precip_1h", { amount });
    }
  }

  return token;
}
