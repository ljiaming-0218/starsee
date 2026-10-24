import React from "react";
import { Star, Map, ChevronRight } from "lucide-react";
import { LEVELS, LEVEL_IDS, levelWaveCount } from "../levels.js";
export default function StageRail({ state, onChoose, compact = false }) {
  const { g, records } = state;
  return (
    <section
      className={`stage-rail ${compact ? "compact" : ""}`}
      aria-label="关卡选择"
    >
      {!compact && (
        <div className="stage-rail-title">
          <Map size={21} />
          <span>
            章节地图<small>自由选关 · 独立星级</small>
          </span>
        </div>
      )}
      <div className="stage-cards">
        {LEVEL_IDS.map((id) => {
          const l = LEVELS[id],
            stars = records.levels?.[id]?.stars || 0;
          return (
            <button
              className={`stage-card ${g.level === id ? "active" : ""}`}
              key={id}
              onClick={() => onChoose(id)}
              aria-label={`选择关卡 ${l.number} ${l.name}`}
              aria-pressed={g.level === id}
              style={{ "--stage-accent": l.color }}
            >
              <img src={l.image} alt="" loading={compact ? "eager" : "lazy"} />
              <span>
                <strong>
                  <b>{l.number}</b>
                  {l.name}
                </strong>
                {!compact && (
                  <small>
                    {levelWaveCount(id)} 波 · {l.biome}
                  </small>
                )}
                <span className="stage-stars" aria-label={`${stars}颗星`}>
                  {[1, 2, 3].map((n) => (
                    <Star
                      size={compact ? 8 : 12}
                      key={n}
                      fill={n <= stars ? "currentColor" : "none"}
                      className={n <= stars ? "earned" : ""}
                    />
                  ))}
                </span>
              </span>
              {!compact && <ChevronRight size={16} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
