import React from "react";
import {
  Coins,
  Target,
  Timer,
  Swords,
  Flame,
  TrendingUp,
  ArrowUpRight,
  MousePointer2,
  Lock,
  Trash2,
  ChevronRight,
  Shield,
  BookOpen,
  Check,
} from "lucide-react";
import { TYPES, SPECIALIZATIONS, ENEMIES } from "../content.js";
import {
  towerStats,
  upgradeCost,
  upgrade,
  specialize,
  setPriority,
  sell,
} from "../game.js";
import { TowerArt, EnemyArt } from "./Art.jsx";
const priorities = [
  ["first", "最前"],
  ["strong", "最强"],
  ["close", "最近"],
];
export default function Workshop({ state, onChoose, onCodex }) {
  const {
    g,
    game,
    selected,
    build,
    setSelected,
    setBuild,
    refresh,
    setNotice,
    sound,
  } = state;
  const tower = g.towers.find((t) => t.id === selected),
    type = tower?.type || build || "arrow",
    def = TYPES[type],
    stats = tower ? towerStats(tower) : def,
    ended = ["won", "lost"].includes(g.phase);
  const level = tower ? tower.damageLevel + tower.speedLevel : 0;
  const specialization =
    tower && SPECIALIZATIONS[type].find((s) => s.id === tower.specialization);
  function upgradeTower(kind) {
    if (upgrade(game.current, tower.id, kind)) {
      setNotice(`${def.name}的${kind === "damage" ? "伤害" : "射速"}已强化。`);
      sound("click");
      refresh();
    }
  }
  return (
    <aside className="workshop">
      <div className="workshop-title">
        <Swords size={21} />
        <h2>防御工坊</h2>
        <span>THE WORKSHOP</span>
      </div>
      <div className="tower-list">
        {Object.entries(TYPES).map(([key, d], i) => (
          <button
            className={`tower-card ${build === key ? "is-selected" : ""} ${g.gold < d.cost ? "low-gold" : ""}`}
            key={key}
            onClick={() => onChoose(key)}
            aria-pressed={build === key}
          >
            <TowerArt type={key} />
            <div className="tower-card-content">
              <div className="tower-name">
                <strong>{d.name}</strong>
                <b>
                  <Coins size={13} />
                  {d.cost}
                </b>
              </div>
              <p>{d.role}</p>
              <div className="tower-attributes">
                <span>
                  <Target size={11} />
                  {(d.range / 50).toFixed(1)} 格
                </span>
                <span>
                  <Timer size={11} />
                  {d.interval.toFixed(2)}s
                </span>
              </div>
            </div>
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
      <section className="inspector">
        <div className="inspector-title">
          <TowerArt type={type} />
          <div>
            <span>{tower ? "防御塔指令" : "部署档案"}</span>
            <h3>{specialization?.name || def.name}</h3>
          </div>
          <span className="level-label">
            {tower ? `Lv.${1 + level}` : "待建造"}
          </span>
        </div>
        <p className="tower-description">{def.desc}</p>
        <div className="stat-trio">
          <span>
            <Swords size={13} />
            伤害<b>{Math.round(stats.damage)}</b>
          </span>
          <span>
            <Target size={13} />
            射程<b>{(stats.range / 50).toFixed(1)} 格</b>
          </span>
          <span>
            <Timer size={13} />
            间隔<b>{stats.interval.toFixed(2)}s</b>
          </span>
        </div>
        {tower ? (
          <>
            <div className="upgrade-grid">
              {[
                ["damage", "伤害强化", Flame],
                ["speed", "射速强化", TrendingUp],
              ].map(([kind, label, Icon]) => (
                <button
                  key={kind}
                  disabled={
                    ended ||
                    tower[kind + "Level"] >= 3 ||
                    g.gold < upgradeCost(tower, kind)
                  }
                  onClick={() => upgradeTower(kind)}
                >
                  <Icon size={18} />
                  <span>
                    {label}
                    <small>
                      {tower[kind + "Level"]}/3 级 <i>→</i>{" "}
                      {kind === "damage" ? "+42% 伤害" : "+25% 射速"}
                    </small>
                  </span>
                  <b>
                    {tower[kind + "Level"] >= 3 ? (
                      <Check size={14} />
                    ) : (
                      <>
                        <Coins size={12} />
                        {upgradeCost(tower, kind)}
                      </>
                    )}
                  </b>
                </button>
              ))}
            </div>
            <div className="priority">
              <label>攻击优先级</label>
              <div role="group" aria-label="攻击优先级">
                {priorities.map(([id, label]) => (
                  <button
                    key={id}
                    className={tower.priority === id ? "active" : ""}
                    aria-pressed={tower.priority === id}
                    onClick={() => {
                      setPriority(game.current, tower.id, id);
                      refresh();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {specialization ? (
              <div className="specialized">
                <Check size={14} />
                <span>
                  {specialization.name}
                  <small>{specialization.desc}</small>
                </span>
              </div>
            ) : level >= 4 ? (
              <div className="specializations">
                <label>
                  选择专精 <span>一旦选择不可更换</span>
                </label>
                {SPECIALIZATIONS[type].map((s) => (
                  <button
                    key={s.id}
                    disabled={ended || g.gold < s.cost}
                    onClick={() => {
                      if (specialize(game.current, tower.id, s.id)) {
                        setNotice(`专精完成：${s.name}。`);
                        sound("click");
                        refresh();
                      }
                    }}
                  >
                    <span>
                      {s.name}
                      <small>{s.desc}</small>
                    </span>
                    <b>
                      <Coins size={11} />
                      {s.cost}
                    </b>
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="specialization-locked">
                <Lock size={12} />
                <span>伤害与射速累计升级 4 次解锁专精</span>
                <b>{level}/4</b>
              </div>
            )}
            <div className="tower-performance">
              <span>
                击杀 <b>{tower.kills}</b>
              </span>
              <span>
                总伤害 <b>{Math.round(tower.damageDealt).toLocaleString()}</b>
              </span>
              <button
                disabled={ended}
                onClick={() => {
                  sell(game.current, tower.id);
                  setSelected(null);
                  setBuild(type);
                  refresh();
                  setNotice("防御塔已出售，返还 70% 总投入。");
                }}
              >
                <Trash2 size={12} />
                出售 <Coins size={11} />
                {Math.floor(tower.invested * 0.7)}
              </button>
            </div>
          </>
        ) : (
          <div className="build-instruction">
            <MousePointer2 size={17} />
            <p>
              点击草地上的标记建造
              <small>选中防御塔后，可升级、专精和更改目标</small>
            </p>
            <ChevronRight size={14} />
          </div>
        )}
      </section>
      <button className="intel-card" onClick={onCodex}>
        <EnemyArt type="armored" />
        <div>
          <span>敌人情报</span>
          <strong>装甲不等于无敌</strong>
          <p>物理减伤 58% · 魔法可穿透</p>
        </div>
        <BookOpen size={16} />
      </button>
    </aside>
  );
}
