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
  HeartPulse,
  Wrench,
} from "lucide-react";
import { TYPES, SPECIALIZATIONS, ENEMIES, isSupport } from "../content.js";
import {
  towerStats,
  upgradeCost,
  upgrade,
  specialize,
  setPriority,
  sell,
  repairCost,
  repairTower,
  clinicPatients,
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
    stats = towerStats(
      tower || { type, damageLevel: 0, speedLevel: 0, specialization: null },
      g,
    ),
    ended = ["won", "lost"].includes(g.phase);
  const patients = tower?.type === "medic" ? clinicPatients(g, tower) : [];
  const level = tower ? tower.damageLevel + tower.speedLevel : 0;
  const specialization =
    tower && SPECIALIZATIONS[type].find((s) => s.id === tower.specialization);
  function upgradeTower(kind) {
    if (upgrade(game.current, tower.id, kind)) {
      setNotice(`${def.name}的${kind === "damage" ? "效能" : "频率"}已强化。`);
      sound("click");
      refresh();
    }
  }
  return (
    <aside className="workshop">
      <div className="workshop-title">
        <Swords size={21} />
        <h2>建筑工坊</h2>
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
            <kbd>{i === 9 ? 0 : i + 1}</kbd>
          </button>
        ))}
      </div>
      <section className="inspector">
        {tower && (
          <button
            className="inspector-back"
            onClick={() => {
              setSelected(null);
              setBuild(null);
              const panel = document.querySelector(".workshop");
              panel?.scrollTo({ top: 0, behavior: "instant" });
              if (window.innerWidth <= 760)
                panel?.scrollIntoView({ block: "start", behavior: "instant" });
            }}
          >
            返回建造列表 <ChevronRight size={13} />
          </button>
        )}
        <div className="inspector-title">
          <TowerArt type={type} />
          <div>
            <span>{tower ? "建筑指令" : "部署档案"}</span>
            <h3>{specialization?.name || def.name}</h3>
          </div>
          <span className="level-label">
            {tower ? `Lv.${1 + level}` : "待建造"}
          </span>
        </div>
        <p className="tower-description">{def.desc}</p>
        <div
          className={`durability ${tower && tower.hp < tower.maxHp * 0.35 ? "is-critical" : ""}`}
        >
          <span>
            <HeartPulse size={14} /> 建筑耐久{" "}
            <b>
              {Math.ceil(tower?.hp ?? stats.maxHp)} /{" "}
              {tower?.maxHp ?? stats.maxHp}
            </b>
          </span>
          <div className="durability-track">
            <i
              style={{
                width: `${tower ? (tower.hp / tower.maxHp) * 100 : 100}%`,
              }}
            />
          </div>
          {tower ? (
            <button
              className="repair-button"
              disabled={
                ended || tower.hp >= tower.maxHp || g.gold < repairCost(tower)
              }
              onClick={() => {
                if (repairTower(game.current, tower.id)) {
                  setNotice("紧急维修完成。受袭时可以让诊所持续抢修。");
                  sound("heal");
                  refresh();
                }
              }}
            >
              <Wrench size={13} />
              {tower.hp >= tower.maxHp ? "建筑完好" : "紧急维修"}
              <b>
                <Coins size={12} />
                {repairCost(tower)}
              </b>
            </button>
          ) : (
            <small>会受到怪物攻击 · 诊所可以修复</small>
          )}
        </div>
        {type === "medic" && tower && (
          <div
            className={`clinic-status ${patients.length ? "is-healing" : ""}`}
            role="status"
          >
            <HeartPulse size={16} />
            <span>
              {ended
                ? "战斗已结束"
                : state.paused
                  ? "已暂停，继续后治疗"
                  : patients.length
                    ? `正在治疗 · 范围内 ${patients.length} 座受伤建筑`
                    : "范围内建筑完好，等待伤员"}
              <small>
                {patients.length
                  ? `优先：${TYPES[patients[0].type].name} · 下次治疗 ${Math.max(0, tower.cooldown).toFixed(1)}s`
                  : "绿圈内有效 · 休整时也会治疗 · 不修复已摧毁建筑"}
              </small>
            </span>
          </div>
        )}
        {["medic", "bulwark"].includes(type) && (
          <div className="mechanic-note">
            {type === "medic"
              ? `每次修复 ${Math.round(stats.healing)} 点 · ${tower?.specialization === "triage" ? "同时 2 座" : "优先重伤"} · 不复活残骸`
              : `承担邻居 65% 伤害 · 每 ${stats.interval.toFixed(2)} 秒自愈 ${stats.selfHeal} 点 · 优先保护邻居`}
          </div>
        )}
        {["venom", "flame", "ballista", "beacon"].includes(type) && (
          <div className="mechanic-note">
            {type === "venom"
              ? `每层毒素 ${(stats.damage * 0.65).toFixed(1)} 伤害/秒 · ${tower?.specialization === "toxin" ? 5 : 3} 层上限 · 抑疗 50%`
              : type === "flame"
                ? `扇区喷火 · 基础直伤 ${Math.round(stats.damage / stats.interval)}/秒 · 额外燃烧`
                : type === "ballista"
                  ? `贯穿 ${tower?.specialization === "rail" ? 4 : 2} 个目标 · 忽略 50% 护甲`
                  : tower
                    ? `当前覆盖 ${g.towers.filter((t) => t.id !== tower.id && !isSupport(t.type) && Math.hypot(t.x - tower.x, t.y - tower.y) <= stats.range).length} 座攻击塔 · 附近建筑减伤 25%`
                    : "范围内建筑减伤 25% · 增幅同类取最高值"}
          </div>
        )}
        <div className="stat-trio">
          <span>
            <Swords size={13} />
            {type === "beacon"
              ? "增伤"
              : type === "medic"
                ? "治疗"
                : type === "bulwark"
                  ? "耐久"
                  : "伤害"}
            <b>
              {type === "beacon"
                ? `+${Math.round(stats.auraDamage * 100)}%`
                : Math.round(
                    type === "medic"
                      ? stats.healing
                      : type === "bulwark"
                        ? stats.maxHp
                        : stats.damage,
                  )}
            </b>
          </span>
          <span>
            <Target size={13} />
            {isSupport(type) ? "支援" : "射程"}
            <b>{(stats.range / 50).toFixed(1)} 格</b>
          </span>
          <span>
            <Timer size={13} />
            {type === "beacon" ? "攻速" : "间隔"}
            <b>
              {type === "beacon"
                ? `+${Math.round(stats.auraRate * 100)}%`
                : stats.interval.toFixed(2) + "s"}
            </b>
          </span>
        </div>
        {tower ? (
          <>
            <div className="upgrade-grid">
              {[
                [
                  "damage",
                  type === "beacon"
                    ? "伤害光环"
                    : type === "medic"
                      ? "治疗强化"
                      : type === "bulwark"
                        ? "壳甲强化"
                        : "伤害强化",
                  Flame,
                ],
                [
                  "speed",
                  type === "beacon"
                    ? "射速光环"
                    : type === "medic"
                      ? "抢修频率"
                      : type === "bulwark"
                        ? "自愈频率"
                        : "射速强化",
                  TrendingUp,
                ],
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
                      {type === "beacon"
                        ? kind === "damage"
                          ? "+8% 增幅"
                          : "+6% 射速"
                        : kind === "damage"
                          ? type === "bulwark"
                            ? "+180 耐久"
                            : type === "medic"
                              ? "+42% 治疗"
                              : "+42% 伤害"
                          : isSupport(type)
                            ? "+25% 频率"
                            : "+25% 射速"}
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
              <label>
                {isSupport(type)
                  ? type === "medic"
                    ? "自动抢修 · 优先损伤比例最高"
                    : type === "bulwark"
                      ? "自动分伤 · 最近的护卫承担"
                      : "光环自动生效 · 同类取最高值"
                  : "攻击优先级"}
              </label>
              <div role="group" aria-label="攻击优先级">
                {priorities.map(([id, label]) => (
                  <button
                    key={id}
                    disabled={isSupport(type)}
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
                <span>两条强化累计升级 4 次解锁专精</span>
                <b>{level}/4</b>
              </div>
            )}
            <div className="tower-performance">
              <span>
                击杀 <b>{tower.kills}</b>
              </span>
              <span>
                {type === "medic"
                  ? "修复量"
                  : type === "bulwark"
                    ? "分担量"
                    : "总伤害"}{" "}
                <b>
                  {Math.round(
                    type === "medic"
                      ? tower.healingDone
                      : type === "bulwark"
                        ? tower.damageAbsorbed
                        : tower.damageDealt,
                  ).toLocaleString()}
                </b>
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
              点击空地上的标记建造
              <small>选中建筑后，可维修、升级或选择专精</small>
            </p>
            <ChevronRight size={14} />
          </div>
        )}
      </section>
      <button className="intel-card" onClick={onCodex}>
        <EnemyArt type="armored" />
        <div>
          <span>攻城情报</span>
          <strong>小心骨甲兽重击</strong>
          <p>重击 24 · 龟壳堡优先承伤</p>
        </div>
        <BookOpen size={16} />
      </button>
    </aside>
  );
}
