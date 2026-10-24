import React from "react";
import { TYPES, ENEMIES } from "../content.js";
function AtlasArt({ kind, index, cols, rows, className = "" }) {
  return (
    <span aria-hidden="true" className={`${kind}-art ${className}`}>
      <svg viewBox={`${index % cols} ${Math.floor(index / cols)} 1 1`}>
        <image
          href={`/art/pixel-${kind === "tower" ? "towers" : "enemies"}.png`}
          width={cols}
          height={rows}
          preserveAspectRatio="none"
        />
      </svg>
    </span>
  );
}
export function TowerArt({ type, className = "" }) {
  return (
    <AtlasArt
      kind="tower"
      index={Object.keys(TYPES).indexOf(type)}
      cols={4}
      rows={2}
      className={className}
    />
  );
}
export function EnemyArt({ type, className = "" }) {
  return (
    <AtlasArt
      kind="enemy"
      index={Object.keys(ENEMIES).indexOf(type)}
      cols={3}
      rows={2}
      className={className}
    />
  );
}
export function SpellArt({ type }) {
  return <span aria-hidden="true" className={`spell-art spell-art--${type}`} />;
}
