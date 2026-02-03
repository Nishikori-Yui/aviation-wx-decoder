import { useCallback, useEffect, useState } from "react";
import { loadJson, saveJson } from "../../utils/storage.js";

const STORAGE_KEY = "aviationWx.airports.v1";
const LOCAL_DATA_URL = "/data/airports.json";
const DATA_URL = import.meta.env.VITE_AIRPORTS_URL || "";

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
}

export function useStations() {
  const [airports, setAirports] = useState({});
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = loadJson(STORAGE_KEY);
    if (cached?.airports) {
      setAirports(cached.airports);
      setMeta(cached.meta || null);
    }

    let active = true;
    setLoading(true);
    (async () => {
      try {
        let payload = null;
        try {
          payload = await fetchJson(LOCAL_DATA_URL);
        } catch (err) {
          if (DATA_URL) {
            payload = await fetchJson(DATA_URL);
          }
        }

        if (!payload) {
          throw new Error("No station dataset available.");
        }

        if (!active) {
          return;
        }
        const nextMeta = payload.meta || payload.metadata || null;
        const nextAirports = payload.airports || payload.data || {};
        setAirports(nextAirports);
        setMeta(nextMeta);
        setError("");
        saveJson(STORAGE_KEY, { meta: nextMeta, airports: nextAirports });
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err?.message || "Failed to load stations.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const lookupStation = useCallback(
    (code) => {
      if (!code) {
        return null;
      }
      const key = code.toUpperCase();
      const entry = airports?.[key];
      if (!entry) {
        return null;
      }
      return {
        ...entry,
        code: key,
      };
    },
    [airports]
  );

  return {
    lookupStation,
    meta,
    loading,
    error,
    downloadUrl: DATA_URL,
  };
}
