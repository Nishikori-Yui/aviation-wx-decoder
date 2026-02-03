import { useCallback, useState } from "react";
import { decodeWithWasm } from "../wasm/decoder.js";

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:17643";
const USE_WASM = String(import.meta.env.VITE_USE_WASM || "").toLowerCase() === "true";

export function useDecode(baseUrl = DEFAULT_BASE_URL) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [source, setSource] = useState(USE_WASM ? "wasm" : "backend");
  const [durationMs, setDurationMs] = useState(0);

  const decode = useCallback(
    async ({ message, type, detail, lang, emptyMessage }) => {
      const trimmed = (message || "").trim();
      if (!trimmed) {
        setError(emptyMessage || "Message is empty.");
        setData(null);
        return;
      }

      setLoading(true);
      setError("");
      setRequestId("");
      setDurationMs(0);
      setSource(USE_WASM ? "wasm" : "backend");
      const start = performance.now();

      try {
        if (USE_WASM) {
          const payload = await decodeWithWasm({ message: trimmed, type });
          setData(payload);
        } else {
          const response = await fetch(`${baseUrl}/v1/decode`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: trimmed,
              type,
              output: { json: true, explain: false },
              lang,
              detail,
            }),
          });

          const requestIdHeader = response.headers.get("x-request-id") || "";
          setRequestId(requestIdHeader);

          const payload = await response.json();
          if (!response.ok) {
            setError(payload?.errors?.[0]?.message || "Request failed.");
            setData(payload);
          } else {
            setData(payload);
          }
        }
      } catch (err) {
        if (USE_WASM) {
          setError(err?.message || "WASM decode failed.");
          setData(null);
        } else {
          setError(err?.message || "Network error.");
          setData(null);
        }
      } finally {
        const elapsed = Math.round(performance.now() - start);
        setDurationMs(elapsed);
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    data,
    error,
    loading,
    requestId,
    durationMs,
    decode,
    source,
  };
}
