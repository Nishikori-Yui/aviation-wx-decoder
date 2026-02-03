import { decodeWithWasm } from "../features/wasm/decoder.js";
import { buildExplanation } from "../features/explain/buildExplanation.js";
import { getMessageType } from "../utils/message.js";
import { en } from "../i18n/en.js";
import { zhCN } from "../i18n/zhCN.js";

const dictionaries = {
  "zh-CN": zhCN,
  en,
};

function getValue(dict, path) {
  if (!dict) {
    return undefined;
  }
  return path.split(".").reduce((acc, key) => acc?.[key], dict);
}

function formatTemplate(template, params) {
  if (typeof template !== "string") {
    return template;
  }
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (params[key] === undefined || params[key] === null) {
      return match;
    }
    return String(params[key]);
  });
}

function createTranslator(locale) {
  const dictionary = dictionaries[locale] || en;
  return (key, params) => {
    const value = getValue(dictionary, key);
    if (value === undefined) {
      return key;
    }
    return formatTemplate(value, params);
  };
}

async function decodeMessage(input) {
  const payload =
    typeof input === "string"
      ? { message: input }
      : input && typeof input === "object"
      ? input
      : {};
  const message = String(payload.message || payload.raw || "").trim();
  if (!message) {
    return "Empty message.";
  }
  const type = String(payload.type || "auto").toLowerCase();
  const locale = payload.lang || payload.locale || "zh-CN";
  const t = createTranslator(locale);

  try {
    const data = await decodeWithWasm({ message, type });
    const messageType = getMessageType(data);
    const lines = buildExplanation({
      data,
      t,
      locale,
      stationInfo: null,
      messageType,
      detail: "normal",
    });
    if (!lines.length) {
      return message;
    }
    return lines.join("\n");
  } catch (err) {
    const detail = err?.message || String(err);
    return `Decode failed: ${detail}`;
  }
}

window.decodeMessage = decodeMessage;
window.__AVIATION_WX_SHORTCUT_READY__ = true;
