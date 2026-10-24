import { levelWaveCount } from "../levels.js";
import React from "react";
import {
  Pause,
  Play,
  Coins,
  ArrowRight,
  Info,
  Flame,
  Leaf,
  Crown,
  Check,
} from "lucide-react";
import { levelWave, SPELLS } from "../content.js";
import { waveCount } from "../game.js";
import { EnemyArt, SpellArt } from "./Art.jsx";
export default function BattleControls({ state, onLaunch, onSpell, onCodex }) {
  const { g, paused, setPaused, speed, setSpeed, spell, notice } = state;
  const total = levelWaveCount(g.level);
  const battle = g.phase === "battle",
    ended = ["won", "lost"].includes(g.phase),
    next = Math.min(g.wave - (battle ? 1 : 0), total - 1),
    wave = levelWave(next + 1, g.level);
  const completed =
    g.phase === "won" ? total : Math.max(0, g.wave - (battle ? 1 : 0));
  return (
    <>
      <div className="command-bar">
        <div className="time-controls">
          <button
            className="control pause-button"
            disabled={ended}
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "继续游戏" : "暂停游戏"}
          >
            {paused ? <Play size={19} /> : <Pause size={19} />}
          </button>
          <div className="speed-group">
            {[1, 2, 3].map((s) => (
              <button
                className={`control ${speed === s ? "active" : ""}`}
                key={s}
                onClick={() => setSpeed(s)}
                aria-label={`${s}倍速`}
              >
                {s}
                <span>×</span>
              </button>
            ))}
          </div>
        </div>
        <button
          className="wave-preview"
          onClick={onCodex}
          aria-label="查看波次敌人情报"
        >
          <span>
            {battle ? "本波入侵" : "下波入侵"}
            <small>{wave.name}</small>
          </span>
          <div className="preview-units">
            {wave.groups.map(([type, count]) => (
              <span key={type} title={type}>
                <EnemyArt type={type} />
                <b>×{count}</b>
              </span>
            ))}
          </div>
        </button>
        <button
          className="launch-button"
          onClick={onLaunch}
          disabled={g.phase !== "ready" || state.assets !== "ready"}
        >
          <span>
            {battle ? (
              <>
                <SwordsIcon />
                战斗进行中
              </>
            ) : ended ? (
              "战役已结束"
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                开始第 {g.wave + 1} 波
              </>
            )}
            <ArrowRight size={16} />
          </span>
          <small>
            {battle
              ? `剩余 ${waveCount(g.wave, g.level) - g.spawned + g.enemies.length} 名敌人`
              : ended
                ? "为森林而战"
                : "完成奖励"}
            {!battle && !ended && (
              <>
                <Coins size={11} /> {50 + (g.wave + 1) * 7}
              </>
            )}
          </small>
        </button>
      </div>
      <div className="strategy-bar">
        <section className="spells">
          <h3>
            森林秘术 <span>用在扭转战局的时刻</span>
          </h3>
          <div>
            {Object.entries(SPELLS).map(([id, def]) => {
              const remaining = g.spellCooldowns[id],
                disabled =
                  !battle ||
                  remaining > 0 ||
                  (id === "heal" && g.lives >= g.maxLives);
              return (
                <button
                  className={`spell-button ${spell === id ? "active" : ""}`}
                  key={id}
                  disabled={disabled}
                  onClick={() => onSpell(id)}
                  title={def.desc}
                >
                  <div className="spell-icon">
                    <SpellArt type={id} />
                    {remaining > 0 && <span>{Math.ceil(remaining)}s</span>}
                  </div>
                  <span className="spell-info">
                    <strong>{def.name}</strong>
                    <small>
                      {id === "meteor"
                        ? "范围打击 · 点击释放"
                        : "恢复 4 点生命"}
                    </small>
                    <span>
                      <kbd>{def.key}</kbd>
                      {remaining > 0
                        ? "冷却中"
                        : !battle
                          ? "战斗时可用"
                          : id === "heal" && g.lives >= g.maxLives
                            ? "生命已满"
                            : "已就绪"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="wave-progress">
          <div>
            <h3>守望进度</h3>
            <span>
              {String(completed).padStart(2, "0")} / {total}
            </span>
          </div>
          <ol aria-label="波次进度">
            {Array.from({ length: total }, (_, i) => (
              <li
                className={`${i < completed ? "completed" : ""} ${i === completed && !ended ? "current" : ""}`}
                key={i}
                title={`第 ${i + 1} 波：${levelWave(i + 1, g.level).name}`}
              >
                {levelWave(i + 1, g.level).groups.some(
                  ([type]) => type === "boss",
                ) && <Crown size={10} />}
                <span>{i < completed ? <Check size={12} /> : i + 1}</span>
              </li>
            ))}
          </ol>
          <p>{wave.tip}</p>
        </section>
      </div>
      <div className="battle-notice" role="status">
        <Info size={13} />
        <span>{notice}</span>
        <span className="keyboard-hints">
          <kbd>1–0</kbd>选建筑 <kbd>Q / W</kbd>秘术 <kbd>Space</kbd>开波 / 暂停{" "}
          <kbd>Esc</kbd>取消
        </span>
      </div>
    </>
  );
}
function SwordsIcon() {
  return <Flame size={15} />;
}
