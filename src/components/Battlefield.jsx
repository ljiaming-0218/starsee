import React from "react";
import {
  Trees,
  Shield,
  Pause,
  Play,
  Target,
  X,
  Trophy,
  Star,
  RotateCcw,
} from "lucide-react";
import { DIFFICULTIES, WAVES } from "../content.js";
import { starRating } from "../game.js";
const ENEMY_BOSS_NAME = "远古岩石巨像";
export default function Battlefield({ state, onPoint, onPlace }) {
  const {
    g,
    canvas,
    hover,
    view,
    assets,
    assetError,
    build,
    spell,
    setSpell,
    paused,
    setPaused,
    setModal,
    reset,
  } = state;
  const ended = ["won", "lost"].includes(g.phase),
    boss = g.enemies.find((e) => e.boss);
  return (
    <div className={`battlefield ${build || spell ? "is-targeting" : ""}`}>
      <canvas
        ref={canvas}
        width={1000}
        height={650}
        tabIndex={0}
        aria-label="森林战场。选择塔后点击草地标记建造。方向键移动，Enter 确认。"
        onPointerMove={(e) => {
          hover.current = onPoint(e, view.current.spell !== "meteor");
        }}
        onPointerLeave={() => {
          hover.current = null;
        }}
        onClick={(e) => onPlace(onPoint(e, view.current.spell !== "meteor"))}
        onKeyDown={(e) => {
          const p = hover.current || { x: 425, y: 225 };
          const dirs = {
            ArrowLeft: [-50, 0],
            ArrowRight: [50, 0],
            ArrowUp: [0, -50],
            ArrowDown: [0, 50],
          };
          if (dirs[e.key]) {
            e.preventDefault();
            hover.current = {
              x: Math.min(975, Math.max(25, p.x + dirs[e.key][0])),
              y: Math.min(625, Math.max(25, p.y + dirs[e.key][1])),
            };
          }
          if (e.key === "Enter") {
            e.preventDefault();
            onPlace(p);
          }
        }}
      />
      <div className="board-corners" aria-hidden="true" />
      <div className="board-topline">
        <span>
          <Shield size={12} />
          {DIFFICULTIES[g.difficulty].name}战役
        </span>
        <span>
          <i />
          {g.phase === "battle" ? "防线交战中" : "森林之心 · 守护中"}
        </span>
      </div>
      {assets !== "ready" && (
        <div className="board-overlay loading-overlay">
          <Trees size={40} />
          <h2>
            {assets === "error" ? "林间的道路暂时迷失" : "正在进入翡翠林地"}
          </h2>
          <p>{assetError || "准备地图与守卫者…"}</p>
          {assets === "error" && (
            <button
              className="gold-button"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          )}
        </div>
      )}
      {boss && !ended && (
        <div className="boss-health">
          <div>
            <span>
              <Shield size={12} /> {ENEMY_BOSS_NAME}
            </span>
            <b>
              {Math.ceil(boss.hp).toLocaleString()} /{" "}
              {Math.round(boss.maxHp).toLocaleString()}
            </b>
          </div>
          <span>
            <i
              style={{ width: Math.max(0, (boss.hp / boss.maxHp) * 100) + "%" }}
            />
          </span>
        </div>
      )}
      {g.bannerTime > 0 && !paused && !ended && (
        <div
          className={`wave-banner ${g.banner === "巨像来袭" ? "boss-banner" : ""}`}
        >
          <span>THE EMERALD WOOD</span>
          <strong>{g.banner}</strong>
          <small>{WAVES[Math.max(0, g.wave - 1)]?.name}</small>
        </div>
      )}
      {!g.wave && !g.towers.length && assets === "ready" && !paused && (
        <div className="first-guide">
          <span>
            <Shield size={17} />
            守卫者，先构筑你的防线
          </span>
          <p>选一座塔，点击发光的草地标记。准备好后开始波次。</p>
        </div>
      )}
      {spell === "meteor" && !paused && (
        <div className="targeting-banner">
          <Target size={15} />
          点击战场释放陨火
          <button aria-label="取消技能" onClick={() => setSpell(null)}>
            <X size={15} />
          </button>
        </div>
      )}
      {g.combo >= 5 && g.comboTimer > 0 && !paused && (
        <div className="combo">
          <strong>{g.combo}</strong>
          <span>连 续 击 杀</span>
        </div>
      )}
      {paused && !ended && (
        <div className="board-overlay pause-overlay">
          <Pause size={32} />
          <span className="overlay-kicker">A MOMENT OF STILLNESS</span>
          <h2>片刻休整</h2>
          <p>你的防线，正在等待下一道指令。</p>
          <button className="gold-button" onClick={() => setPaused(false)}>
            <Play size={16} />
            继续战斗
          </button>
          <button className="quiet-button" onClick={() => setModal("restart")}>
            重新开始
          </button>
        </div>
      )}
      {ended && (
        <div className="board-overlay end-overlay">
          <div className="end-emblem">
            {g.phase === "won" ? <Trophy size={42} /> : <Shield size={42} />}
          </div>
          <span className="overlay-kicker">
            {g.phase === "won"
              ? "THE FOREST ENDURES"
              : "EVERY GUARDIAN RISES AGAIN"}
          </span>
          <h2>
            {g.phase === "won" ? "森林，安然无恙。" : "黎明之前，再战一次。"}
          </h2>
          <div className="rating">
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                size={28}
                fill={
                  g.phase === "won" && n <= starRating(g)
                    ? "currentColor"
                    : "none"
                }
                className={
                  g.phase === "won" && n <= starRating(g) ? "earned" : ""
                }
              />
            ))}
          </div>
          <p>
            {g.phase === "won"
              ? "十二次守望，换来这片绿意长存。"
              : "调整阵容，保留秘术。森林仍在等你归来。"}
          </p>
          <div className="end-stats">
            <span>
              守住波次
              <b>{g.phase === "won" ? 12 : Math.max(0, g.wave - 1)} / 12</b>
            </span>
            <span>
              击败敌人<b>{g.kills}</b>
            </span>
            <span>
              本次得分<b>{g.score.toLocaleString()}</b>
            </span>
          </div>
          <button className="gold-button" onClick={() => reset()}>
            <RotateCcw size={16} />
            重新开始
          </button>
          <button className="quiet-button" onClick={() => setModal("settings")}>
            调整难度
          </button>
        </div>
      )}
    </div>
  );
}
