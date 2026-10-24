import React from "react";
export function TowerArt({ type, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`tower-art tower-art--${type} ${className}`}
    />
  );
}
const crops = {
  scout: [0, 0.35, 0.175, 0.56],
  armored: [0.175, 0.28, 0.232, 0.63],
  wisp: [0.407, 0.14, 0.135, 0.77],
  shaman: [0.542, 0.13, 0.2, 0.78],
  boss: [0.742, 0.12, 0.258, 0.79],
};
export function EnemyArt({ type, className = "" }) {
  const r = crops[type];
  return (
    <span
      aria-hidden="true"
      className={`enemy-art enemy-art--${type} ${className}`}
    >
      {r && (
        <svg
          viewBox={`${r[0] * 2172} ${r[1] * 724} ${r[2] * 2172} ${r[3] * 724}`}
        >
          <image href="/art/enemies.png" width="2172" height="724" />
        </svg>
      )}
    </span>
  );
}
export function SpellArt({ type }) {
  return <span aria-hidden="true" className={`spell-art spell-art--${type}`} />;
}
