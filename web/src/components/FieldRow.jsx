import React from "react";

function FieldRow({ label, value, hint }) {
  return (
    <div className="field-row">
      <div className="field-label">{label}</div>
      <div className="field-value">
        <span>{value}</span>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
    </div>
  );
}

export default FieldRow;
