import React from "react";

function EmptyState({ title, description }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default EmptyState;
