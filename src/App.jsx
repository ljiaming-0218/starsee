import { LEVELS, LEVEL_IDS, getLevel } from "./levels.js";
import StageRail from "./components/StageRail.jsx";
import React, { useEffect, useRef } from "react";
import { Trees, RotateCcw } from "lucide-react";
import { TYPES, levelWave } from "./content.js";
import { useGame } from "./useGame.js";
import {
  startWave,
  placeTower,
  canPlace,
  castSpell,
  buildingAt,
  snapPlot,
} from "./game.js";
import Workshop from "./components/Workshop.jsx";
import BattleControls from "./components/BattleControls.jsx";
import Dialogs from "./components/Dialogs.jsx";
import GameHeader from "./components/GameHeader.jsx";
import { GameArtContext } from "./components/Art.jsx";
import Battlefield from "./components/Battlefield.jsx";
export default function App() {
  const state = useGame(),
    {
      game,
      canvas,
      hover,
      g,
      setPaused,
      setBuild,
      setSelected,
      setSpell,
      setModal,
      setNotice,
      refresh,
      view,
      sound,
      saveStatus,
      records,
    } = state;
  const root = useRef(null),
    [fullscreen, setFullscreen] = React.useState(false);
  function chooseLevel(id) {
    if (!LEVELS[id] || game.current.level === id) return;
    if (
      (game.current.wave > 0 || game.current.towers.length > 0) &&
      !["won", "lost"].includes(game.current.phase)
    ) {
      state.setRequestedLevel(id);
      setModal("switch");
    } else state.reset(game.current.difficulty, id);
  }
  function nextLevel() {
    const i = LEVEL_IDS.indexOf(game.current.level);
    if (i < LEVEL_IDS.length - 1)
      state.reset(game.current.difficulty, LEVEL_IDS[i + 1]);
    else setModal("levels");
  }
  function choose(type) {
    setSpell(null);
    setSelected(null);
    setBuild(type);
    setNotice(`正在部署${TYPES[type].name}。点击空地标记建造，Esc 取消。`);
    sound("click");
    if (window.innerWidth <= 760)
      requestAnimationFrame(() =>
        canvas.current?.scrollIntoView({
          block: "center",
          behavior: "instant",
        }),
      );
  }
  function launch() {
    if (state.assets !== "ready") return;
    if (startWave(game.current)) {
      setPaused(false);
      setSpell(null);
      setNotice(levelWave(game.current.wave, game.current.level).tip);
      sound("click");
      refresh();
    }
  }
  function useSpell(id) {
    const current = game.current;
    if (current.phase !== "battle" || current.spellCooldowns[id] > 0) return;
    if (id === "meteor") {
      setSelected(null);
      setBuild(null);
      setSpell(view.current.spell === "meteor" ? null : "meteor");
      setNotice("陨火已瞄准：点击战场选择落点，Esc 取消。");
    } else if (castSpell(current, id)) {
      setNotice("复苏之风：恢复 4 点生命。");
      sound("heal");
      refresh();
    }
  }
  function place(point) {
    const current = game.current,
      v = view.current;
    if (["won", "lost"].includes(current.phase) || v.paused || v.modal) return;
    if (v.spell === "meteor") {
      if (castSpell(current, "meteor", point)) {
        setSpell(null);
        sound("meteor");
        setNotice("陨火已落下！冷却期间留意你的防线。");
        refresh();
      }
      return;
    }
    const existing = buildingAt(current, point);
    if (existing) {
      setSelected(existing.id);
      setBuild(null);
      setSpell(null);
      setNotice("查看建筑耐久、维修、升级和支援范围。");
      requestAnimationFrame(() => {
        const inspector = document.querySelector(".inspector"),
          panel = document.querySelector(".workshop");
        if (!inspector || !panel) return;
        if (window.innerWidth <= 760)
          inspector.scrollIntoView({ block: "start", behavior: "instant" });
        else
          panel.scrollTo({
            top:
              panel.scrollTop +
              inspector.getBoundingClientRect().top -
              panel.getBoundingClientRect().top -
              12,
            behavior: "instant",
          });
      });
      return;
    }
    if (!v.build) {
      setSelected(null);
      return;
    }
    if (current.gold < TYPES[v.build].cost) {
      setNotice("金币不足。击败敌人和守住波次可获得金币。");
      return;
    }
    const plot = snapPlot(point);
    if (!canPlace(current, plot.x, plot.y)) {
      setNotice("请在空地标记处建造，避开道路、森林、地标及其他防御塔。");
      return;
    }
    const tower = placeTower(current, v.build, plot.x, plot.y);
    if (tower) {
      sound("click");
      setNotice(`${TYPES[v.build].name}已就位。点击塔可升级或改变目标。`);
      refresh();
    }
  }
  function point(event, snap = true) {
    const rect = canvas.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000,
      y = ((event.clientY - rect.top) / rect.height) * 650;
    return snap
      ? {
          x: Math.round((x - 25) / 50) * 50 + 25,
          y: Math.round((y - 25) / 50) * 50 + 25,
        }
      : { x, y };
  }
  const actions = useRef({});
  actions.current = { choose, launch, useSpell };
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.repeat ||
        e.target.closest("input,select,textarea") ||
        view.current.modal
      )
        return;
      if (e.key === "Escape") {
        setBuild(null);
        setSelected(null);
        setSpell(null);
      }
      if (e.code === "Space" && !e.target.closest("button")) {
        e.preventDefault();
        if (game.current.phase === "ready") actions.current.launch();
        else if (game.current.phase === "battle") setPaused((p) => !p);
      }
      if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(e.key))
        actions.current.choose(
          Object.keys(TYPES)[e.key === "0" ? 9 : Number(e.key) - 1],
        );
      if (e.key.toLowerCase() === "q") actions.current.useSpell("meteor");
      if (e.key.toLowerCase() === "w") actions.current.useSpell("heal");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const change = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else
      root.current
        ?.requestFullscreen?.()
        .catch(() => setNotice("当前浏览器不支持全屏，可继续在窗口中游玩。"));
  }
  return (
    <GameArtContext.Provider value={state.art.current}>
      <div className="game-shell" ref={root}>
        <GameHeader
          state={state}
          fullscreen={fullscreen}
          onFullscreen={toggleFullscreen}
          onChooseLevel={chooseLevel}
        />
        <main className="game-grid">
          <section className="battle-section">
            <Battlefield
              state={state}
              onPoint={point}
              onPlace={place}
              onNext={nextLevel}
            />
            <BattleControls
              state={state}
              onLaunch={launch}
              onSpell={useSpell}
              onCodex={() => setModal("codex")}
            />
          </section>
          <Workshop
            state={state}
            onChoose={choose}
            onCodex={() => setModal("codex")}
          />
        </main>
        <StageRail state={state} onChoose={chooseLevel} />
        <footer className="game-footer">
          <span>
            <Trees size={13} />
            守住每一段旅程。
          </span>
          <span>
            {saveStatus}
            <i />
            最高得分 {records.bestScore.toLocaleString()}
            <i />
            EVERGREEN · LANTERN DEFENSE
          </span>
          <button onClick={() => setModal("restart")}>
            <RotateCcw size={11} />
            新战役
          </button>
        </footer>
        <Dialogs state={state} onChooseLevel={chooseLevel} />
      </div>
    </GameArtContext.Provider>
  );
}
