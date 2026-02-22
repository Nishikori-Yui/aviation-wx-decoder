import React, { useEffect, useMemo, useState } from "react";
import Panel from "../components/Panel.jsx";
import SegmentedToggle from "../components/SegmentedToggle.jsx";
import StatusPill from "../components/StatusPill.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useDecode } from "../features/decode/useDecode.js";
import { useStations } from "../features/station/useStations.js";
import { buildFieldExplainList } from "../features/explain/fieldExplain.js";
import { buildTokenAnalysis } from "../features/analysis/buildTokenAnalysis.js";
import { explainRemarkToken } from "../features/explain/remarkExplain.js";
import { useI18n } from "../i18n/index.js";
import { formatStationDisplay } from "../utils/format.js";
import { getMessageType, getParsed, getNormalized, getStationCode } from "../utils/message.js";
import { safeStringify } from "../utils/json.js";
import sampleMessages from "../data/samples.json";

const DEFAULT_SAMPLE =
  "METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015";

function detectSampleType(message) {
  const trimmed = message.trim();
  const upper = trimmed.toUpperCase();
  if (upper.startsWith("TAF ")) {
    return "taf";
  }
  if (upper.startsWith("METAR ") || upper.startsWith("SPECI ")) {
    return "metar";
  }
  if (upper.includes("NOTAM") || upper.includes(" Q)")) {
    return "notam";
  }
  if (/^[A-Z0-9]{4}\s\d{6}Z/.test(upper)) {
    return "metar";
  }
  if (/^[A-Z]\d{4}\/\d{2}/.test(upper)) {
    return "notam";
  }
  return "unknown";
}

function App() {
  const { t, locale, setLocale } = useI18n("zh-CN");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("auto");
  const [centerView, setCenterView] = useState("fields");

  const { decode, data, error, loading, requestId, durationMs, source } = useDecode();
  const {
    lookupStation,
    meta: stationMeta,
    loading: stationLoading,
    error: stationError,
    downloadUrl,
  } = useStations();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const stationCode = useMemo(() => getStationCode(data), [data]);
  const stationInfo = useMemo(() => {
    if (!stationCode) {
      return null;
    }
    const entry = lookupStation(stationCode);
    if (!entry) {
      return null;
    }
    return {
      ...entry,
      display: formatStationDisplay(entry.code, entry, locale),
    };
  }, [lookupStation, locale, stationCode]);
  const messageType = useMemo(() => getMessageType(data), [data]);

  const parsed = useMemo(() => getParsed(data), [data]);
  const normalized = useMemo(() => getNormalized(data), [data]);

  const fieldList = useMemo(
    () =>
      buildFieldExplainList({
        data,
        t,
        locale,
        stationInfo,
        messageType,
      }),
    [data, locale, messageType, stationInfo, t]
  );

  const analysisItems = useMemo(
    () =>
      buildTokenAnalysis({
        data,
        t,
        locale,
        messageType,
      }),
    [data, locale, messageType, t]
  );

  const handleDecode = async () => {
    await decode({
      message,
      type,
      detail: "normal",
      lang: locale,
      emptyMessage: t("ui.errors.empty"),
    });
  };

  const handleSample = () => {
    const all = Array.isArray(sampleMessages) && sampleMessages.length > 0
      ? sampleMessages
      : [DEFAULT_SAMPLE];
    const sanitized = all.filter((item) => !/aviation-wx\s+--type/i.test(item));
    const filtered = type === "auto"
      ? sanitized
      : sanitized.filter((item) => detectSampleType(item) === type);
    const pool = filtered.length > 0 ? filtered : all;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setMessage(pick);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      handleDecode();
    }
  };

  const statusChips = [
    messageType && messageType !== "unknown"
      ? { label: t("ui.status.type"), value: messageType.toUpperCase() }
      : null,
    source ? { label: t("ui.status.source"), value: source } : null,
    requestId ? { label: t("ui.status.request"), value: requestId } : null,
    durationMs ? { label: t("ui.status.latency"), value: `${durationMs}ms` } : null,
  ].filter(Boolean);

  const warnings = data?.warnings ?? [];
  const errors = data?.errors ?? [];
  const rawJson = data ? safeStringify(data) : "";

  const datasetInfo = stationMeta
    ? `${stationMeta.dataset_version || "-"} · ${stationMeta.generated_at || "-"}`
    : stationLoading
    ? t("ui.dataset.loading")
    : stationError
    ? t("ui.dataset.error")
    : t("ui.dataset.empty");
  const showDatasetDownload =
    !!downloadUrl && !stationLoading && (!!stationError || !stationMeta);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{t("ui.title")}</h1>
          <p>{t("ui.subtitle")}</p>
        </div>
      </header>

      <main className="grid">
        <div className="column">
          <Panel className="panel-input" title={t("ui.panels.input")}
            subtitle={t("ui.panels.input_subtitle")}
            actions={
              <button className="secondary" type="button" onClick={handleSample}>
                {t("ui.actions.sample")}
              </button>
            }
          >
            <div className="controls">
              <div className="field">
                <label className="label" htmlFor="type-select">
                  {t("ui.controls.type")}
                </label>
                <select
                  id="type-select"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="auto">auto</option>
                  <option value="taf">taf</option>
                  <option value="metar">metar</option>
                  <option value="notam">notam</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="message-input">
                {t("ui.controls.message")}
              </label>
              <textarea
                id="message-input"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("ui.controls.placeholder")}
              />
            </div>

            <div className="actions">
              <button className="primary" type="button" onClick={handleDecode} disabled={loading}>
                {loading ? t("ui.actions.decoding") : t("ui.actions.decode")}
              </button>
            </div>

            <div className="status">
              {statusChips.map((chip) => (
                <StatusPill key={chip.label} label={chip.label} value={chip.value} />
              ))}
              {warnings.length > 0 && (
                <StatusPill
                  label={t("ui.status.warnings")}
                  value={warnings.length}
                  tone="warning"
                />
              )}
              {errors.length > 0 && (
                <StatusPill
                  label={t("ui.status.errors")}
                  value={errors.length}
                  tone="danger"
                />
              )}
            </div>

            {error && (
              <div className="alert danger">
                <strong>{t("ui.errors.request")}</strong>
                <span>{error}</span>
                {requestId && <span className="muted">{t("ui.status.request")}: {requestId}</span>}
              </div>
            )}

            {!error && errors.length > 0 && (
              <div className="alert danger">
                <strong>{t("ui.errors.backend")}</strong>
                <ul>
                  {errors.map((item, index) => (
                    <li key={`${item.code}-${index}`}>
                      {item.message}
                      {item.token ? ` (${item.token})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!error && warnings.length > 0 && (
              <div className="alert warning">
                <strong>{t("ui.warnings.title")}</strong>
                <ul>
                  {warnings.map((item, index) => (
                    <li key={`${item.code}-${index}`}>
                      {item.message}
                      {item.token ? ` (${item.token})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel className="panel-settings" title={t("ui.panels.settings")} subtitle={t("ui.panels.settings_subtitle")}>
            <div className="field">
              <label className="label">{t("ui.dataset.label")}</label>
              <div className="meta-inline">
                <span className="meta-value">{datasetInfo}</span>
                {showDatasetDownload ? (
                  <button
                    className="secondary small"
                    type="button"
                    onClick={() => window.open(downloadUrl, "_blank", "noreferrer")}
                  >
                    {t("ui.dataset.download")}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="lang-select">
                {t("ui.controls.lang")}
              </label>
              <select
                id="lang-select"
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </Panel>
        </div>

        <Panel
          className="panel-decode"
          title={t("ui.panels.decode")}
          subtitle={t("ui.panels.decode_subtitle")}
          actions={
            <SegmentedToggle
              value={centerView}
              onChange={setCenterView}
              options={[
                { value: "fields", label: t("ui.switch.fields") },
                { value: "json", label: t("ui.switch.json") },
              ]}
            />
          }
        >
          {centerView === "fields" ? (
            <>
              {stationInfo ? (
                <div className="station-chip">
                  <span className="label">{t("ui.station.label")}</span>
                  <span>{stationInfo.display}</span>
                </div>
              ) : null}


              <div className="decode-table">
                <div className="decode-header">
                  <span>{t("ui.decode.field")}</span>
                  <span>{t("ui.decode.raw")}</span>
                  <span>{t("ui.decode.parsed")}</span>
                </div>
                {analysisItems.length > 0 ? (
                  <>
                    {analysisItems.map((item) => {
                      const fieldMatch = fieldList.find((field) => field.key === item.fieldKey);
                      let parsedValue =
                        fieldMatch?.explain || fieldMatch?.value || item.detail || item.token || "";
                      if (item.fieldKey === "rmk_item") {
                        parsedValue = explainRemarkToken(item.token, t);
                      }
                      if (item.fieldKey === "trend") {
                        const tokenUpper = item.token.toUpperCase();
                        if (tokenUpper === "BECMG") {
                          parsedValue = t("explain.trend_becmg");
                        } else if (tokenUpper === "TEMPO") {
                          parsedValue = t("explain.trend_tempo");
                        } else if (tokenUpper === "NOSIG") {
                          parsedValue = t("explain.trend_nosig");
                        }
                      }
                      if (fieldMatch?.key === "e") {
                        parsedValue = fieldMatch?.explain || parsedValue;
                      }
                      if (fieldMatch?.key === "q_line_full") {
                        parsedValue = fieldMatch?.explain || "";
                      }
                      if (fieldMatch?.meta?.q_part && item.fieldKey?.startsWith("q_line_")) {
                        parsedValue = fieldMatch.explain || parsedValue;
                      }
                      if (item.fieldKey === "clouds" && fieldMatch?.meta?.clouds) {
                        const match = fieldMatch.meta.clouds.find(
                          (cloud) => cloud.index === item.cloudIndex
                        );
                        if (match?.explain) {
                          parsedValue = match.explain;
                        } else if (match?.value) {
                          parsedValue = match.value;
                        }
                      }
                      return (
                        <div className="decode-row" key={item.key}>
                          <span className="decode-field" data-label={t("ui.decode.field")}>
                            {item.label}
                          </span>
                          <span className="decode-raw" data-label={t("ui.decode.raw")}>
                            {item.token}
                          </span>
                          <span className="decode-parsed" data-label={t("ui.decode.parsed")}>
                            {parsedValue}
                          </span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <EmptyState
                    title={t("ui.empty.analysis")}
                    description={t("ui.empty.analysis_desc")}
                  />
                )}
              </div>
            </>
          ) : rawJson ? (
            <pre className="codeblock">{rawJson}</pre>
          ) : (
            <EmptyState
              title={t("ui.empty.json")}
              description={t("ui.empty.json_desc")}
            />
          )}
        </Panel>
      </main>

      <footer className="footer">
        <div>{t("ui.footer.attribution")}</div>
        <div>{t("ui.footer.note")}</div>
      </footer>
    </div>
  );
}

export default App;
