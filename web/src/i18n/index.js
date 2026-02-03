import { useCallback, useMemo, useState } from "react";
import { en } from "./en.js";
import { zhCN } from "./zhCN.js";

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

export function useI18n(initialLocale = "zh-CN") {
  const [locale, setLocale] = useState(initialLocale);

  const dictionary = useMemo(() => dictionaries[locale] || en, [locale]);

  const t = useCallback(
    (key, params) => {
      const value = getValue(dictionary, key);
      if (value === undefined) {
        return key;
      }
      return formatTemplate(value, params);
    },
    [dictionary]
  );

  return {
    t,
    locale,
    setLocale,
  };
}
