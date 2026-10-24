import { getLevel, levelWaveCount } from "../levels.js";
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
import { DIFFICULTIES, levelWave } from "../content.js";
import { starRating } from "../game.js";
const ENEMY_BOSS_NAME = "裂颚灾像";
export default function Battlefield({ state, onPoint, onPlace, onNext }) {
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
  const stage = getLevel(g.level),
    total = levelWaveCount(g.level);
  return (
    <div className={`battlefield ${build || spell ? "is-targeting" : ""}`}>
      <canvas
        ref={canvas}
        width={500}
        height={325}
        tabIndex={0}
        aria-label="像素战场。选择塔后点击空地标记建造。方向键移动，Enter 确认。"
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
          {g.phase === "battle" ? "防线交战中" : `${stage.name} · 防线待命`}
        </span>
      </div>
      {assets !== "ready" && (
        <div className="board-overlay loading-overlay">
          <Trees size={40} />
          <h2>{assets === "error" ? "林间的道路暂时迷失" : "正在进入关卡"}</h2>
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
          <span>{stage.en}</span>
          <strong>{g.banner}</strong>
          <small>{levelWave(Math.max(1, g.wave), g.level)?.name}</small>
        </div>
      )}
      {!g.wave && !g.towers.length && assets === "ready" && !paused && (
        <div className="first-guide">
          <span>
            <Shield size={17} />
            守护暖灯，从一间小屋开始
          </span>
          <p>攻击屋守路口，诊所抢修，龟壳堡保护邻居。</p>
        </div>
      )}
      {g.raidAlertTime > 0 && !paused && !ended && (
        <div className="raid-alert" role="status">
          <Shield size={14} />
          {g.raidAlert}
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
            {g.phase === "won"
              ? `${stage.name} · 守护成功`
              : "黎明之前，再战一次。"}
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
              ? `已守住 ${total} 波入侵。星级已记录在章节地图。`
              : "调整阵容，保留秘术。森林仍在等你归来。"}
          </p>
          <div className="end-stats">
            <span>
              守住波次
              <b>
                {g.phase === "won" ? total : Math.max(0, g.wave - 1)} / {total}
              </b>
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
          {g.phase === "won" && (
            <button className="gold-button next-stage" onClick={onNext}>
              继续冒险 / 选关
            </button>
          )}
          <button className="quiet-button" onClick={() => setModal("settings")}>
            调整难度
          </button>
        </div>
      )}
    </div>
  );
}
