import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
} from "react";
import { TYPES, ENEMIES } from "../content.js";
import { drawCell } from "../pixelArt.js";
export const GameArtContext = createContext(null);
const AtlasArt = memo(function AtlasArt({ kind, index, cols, className = "" }) {
  const art = useContext(GameArtContext),
    ref = useRef(null);
  useEffect(() => {
    let active = true;
    art?.ready
      .then(() => {
        if (!active || !ref.current) return;
        const c = ref.current.getContext("2d");
        c.clearRect(0, 0, 32, 32);
        c.imageSmoothingEnabled = false;
        drawCell(
          c,
          art[{ tower: "towers", enemy: "enemies", spell: "spells" }[kind]],
          index,
          cols,
          0,
          0,
          32,
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [art, kind, index, cols]);
  return (
    <span aria-hidden="true" className={`${kind}-art ${className}`}>
      <canvas ref={ref} width={32} height={32} />
    </span>
  );
});
export const TowerArt = memo(function TowerArt({ type, className = "" }) {
  return (
    <AtlasArt
      kind="tower"
      index={Object.keys(TYPES).indexOf(type)}
      cols={5}
      className={className}
    />
  );
});
export const EnemyArt = memo(function EnemyArt({ type, className = "" }) {
  return (
    <AtlasArt
      kind="enemy"
      index={Object.keys(ENEMIES).indexOf(type)}
      cols={3}
      className={className}
    />
  );
});
export const MapPreview = memo(function MapPreview({ level }) {
  const art = useContext(GameArtContext),
    ref = useRef(null);
  useEffect(() => {
    let active = true;
    art
      ?.loadLevel(level)
      .then((map) => {
        if (active && ref.current) {
          const c = ref.current.getContext("2d");
          c.imageSmoothingEnabled = false;
          c.drawImage(map, 0, 0, 200, 130);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [art, level]);
  return (
    <canvas
      aria-hidden="true"
      className="map-preview"
      ref={ref}
      width={200}
      height={130}
    />
  );
});
export function SpellArt({ type }) {
  return <AtlasArt kind="spell" index={type === "heal" ? 1 : 0} cols={2} />;
}
