import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Trees,
  Shield,
  Heart,
  RotateCcw,
  Play,
  BookOpen,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  DIFFICULTIES,
  ENEMIES,
  TOTAL_WAVES,
  TYPES,
  SPECIALIZATIONS,
} from "../content.js";
import { EnemyArt } from "./Art.jsx";
export default function Dialogs({ state }) {
  const { modal, setModal, g, reset, muted, toggleSound, records } = state,
    [difficulty, setDifficulty] = useState(g.difficulty),
    ref = useRef(null),
    previous = useRef(null);
  useEffect(() => {
    if (!modal) return;
    previous.current = document.activeElement;
    const el = ref.current;
    el?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setModal(null);
      }
      if (e.key === "Tab") {
        const list = [...el.querySelectorAll("button:not(:disabled),select")];
        if (!list.length) return;
        const first = list[0],
          last = list.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === el)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous.current?.focus();
    };
  }, [modal, setModal]);
  if (!modal) return null;
  const title =
    modal === "codex"
      ? "知己知彼，守住森林。"
      : modal === "restart"
        ? "开启新的守望？"
        : modal === "settings"
          ? "战役设置"
          : "每一座塔，都有它的使命。";
  return (
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <section
        className={`dialog dialog--${modal}`}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close icon-button"
          aria-label="关闭"
          onClick={() => setModal(null)}
        >
          <X size={22} />
        </button>
        <span className="dialog-emblem">
          {modal === "codex" ? <BookOpen size={28} /> : <Trees size={30} />}
        </span>
        <h2 id="dialog-title">{title}</h2>
        {modal === "codex" ? (
          <>
            <p className="dialog-description">
              敌人的抗性与能力不同。混合搭配，才能守到最后。
            </p>
            <div className="codex-list">
              {Object.entries(ENEMIES).map(([id, def]) => (
                <article key={id}>
                  <EnemyArt type={id} />
                  <div>
                    <h3>{def.name}</h3>
                    <p>{def.desc}</p>
                    <span>
                      {def.armor > 0
                        ? `物理减伤 ${Math.round(def.armor * 100)}%`
                        : "无护甲"}
                      <i />
                      魔抗 {Math.round(def.magicResist * 100)}%<i />
                      赏金 {def.reward}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <button className="gold-button" onClick={() => setModal(null)}>
              返回战场
            </button>
          </>
        ) : modal === "settings" || modal === "restart" ? (
          <>
            <p className="dialog-description">
              {modal === "restart"
                ? "重新开始会覆盖当前战局；最佳战绩会保留。"
                : "战局自动保存在当前浏览器。更换难度需要开启新战役。"}
            </p>
            <fieldset className="difficulty-options">
              <legend>选择难度</legend>
              {Object.entries(DIFFICULTIES).map(([key, d]) => (
                <button
                  className={difficulty === key ? "active" : ""}
                  key={key}
                  aria-pressed={difficulty === key}
                  onClick={() => setDifficulty(key)}
                >
                  <strong>{d.name}</strong>
                  <span>{d.desc}</span>
                  <small>初始生命 {d.lives}</small>
                </button>
              ))}
            </fieldset>
            {modal === "settings" && (
              <>
                <div className="settings-line">
                  <span>战斗音效</span>
                  <button className="outline-button" onClick={toggleSound}>
                    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}{" "}
                    {muted ? "已关闭" : "已开启"}
                  </button>
                </div>
                <div className="records-line">
                  <span>
                    本机最高分 <b>{records.bestScore.toLocaleString()}</b>
                  </span>
                  <span>
                    守护成功 <b>{records.wins} 次</b>
                  </span>
                </div>
              </>
            )}
            <button className="gold-button" onClick={() => reset(difficulty)}>
              <RotateCcw size={16} />
              开始新战役
            </button>
            <button className="quiet-button" onClick={() => setModal(null)}>
              保留当前战局
            </button>
          </>
        ) : (
          <>
            <p className="dialog-description">
              12 波入侵，4 类防御塔。守住城堡，留下森林的绿意。
            </p>
            <ol className="help-steps">
              <li>
                <b>先构筑，再开波</b>
                从工坊选择防御塔，在草地上的标记建造。圆圈显示射程；道路、森林和地标不可建造。
              </li>
              <li>
                <b>选择合适的克制</b>
                箭塔快速单体，炮塔范围破甲，冰塔减速，雷塔连锁。重甲怕魔法，游魂怕物理；萨满会治疗。
              </li>
              <li>
                <b>升级，更要专精</b>伤害与射速各可升级 3 次，累计升级 4
                次解锁二选一专精。目标优先级可随时调整。出售返还总投入 70%。
              </li>
              <li>
                <b>技能改变战局</b>Q 陨火需点击战场释放，W 恢复 4
                点生命。冷却仅在战斗推进；巨像漏过损失 5 点生命。
              </li>
            </ol>
            <p className="help-keyboard">
              1–4 选塔 · Q / W 秘术 · Space 开波或暂停 · Esc 取消
              <br />
              战场支持方向键移动格位，Enter
              建造或释放技能。关闭页面前会自动存档。
            </p>
            <button className="gold-button" onClick={() => setModal(null)}>
              <Play size={16} />
              返回战场
            </button>
          </>
        )}
      </section>
    </div>
  );
}
