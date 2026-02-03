import React from "react";

function StatusPill({ label, value, tone = "default" }) {
  return (
    <div className={`chip ${tone}`}>
      <span className="chip-label">{label}</span>
      <span className="chip-value">{value}</span>
    </div>
  );
}

export default StatusPill;
