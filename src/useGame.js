import { useEffect, useRef, useState } from "react";
import { initialGame, tick } from "./game.js";
import { loadArt, render } from "./renderer.js";
import {
  restoreGame,
  persistGame,
  getRecords,
  recordResult,
} from "./storage.js";
import { createAudio } from "./audio.js";
function localStorageSafe() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {
        throw new Error("Local storage unavailable");
      },
    };
  }
}
export function useGame() {
  const initial = useRef(null);
  if (!initial.current) {
    const saved = restoreGame(localStorageSafe());
    initial.current = { game: saved || initialGame(), restored: !!saved };
  }
  const game = useRef(initial.current.game),
    canvas = useRef(null),
    hover = useRef(null),
    art = useRef(null),
    view = useRef({
      build: "arrow",
      selected: null,
      spell: null,
      paused:
        initial.current.restored && initial.current.game.phase === "battle",
      speed: 1,
      modal: null,
    });
  const [g, setG] = useState(() => ({ ...game.current })),
    [assets, setAssets] = useState("loading"),
    [assetError, setAssetError] = useState(""),
    [saveStatus, setSaveStatus] = useState("本地自动存档"),
    [records, setRecords] = useState(() => getRecords(localStorageSafe()));
  const [paused, setPaused] = useState(view.current.paused),
    [speed, setSpeed] = useState(1),
    [build, setBuild] = useState("arrow"),
    [selected, setSelected] = useState(null),
    [spell, setSpell] = useState(null),
    [modal, setModal] = useState(null),
    [muted, setMuted] = useState(true),
    [requestedLevel, setRequestedLevel] = useState(null),
    [notice, setNotice] = useState(
      initial.current.restored
        ? "已恢复上次战局，准备好后继续。"
        : "先布置防线，再开始第一波。点击草地上的标记建造。",
    );
  const audio = useRef(null);
  if (!audio.current) audio.current = createAudio();
  view.current = { build, selected, spell, paused, speed, modal };
  const refresh = () => setG({ ...game.current });
  useEffect(() => {
    let active = true,
      frame,
      last = performance.now(),
      lastUI = 0,
      lastSave = 0,
      lastKills = game.current.kills,
      lastShots = 0,
      lastPhase = game.current.phase;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    art.current = loadArt(game.current.level);
    art.current.ready
      .then(() => {
        if (active) setAssets("ready");
      })
      .catch((e) => {
        if (active) {
          setAssets("error");
          setAssetError(e.message);
        }
      });
    const animate = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const v = view.current;
      if (
        !v.paused &&
        !v.modal &&
        art.current.loaded &&
        art.current.terrains[game.current.level]?.width
      )
        tick(game.current, dt * v.speed);
      const shots = game.current.towers.reduce((n, t) => n + t.shots, 0);
      if (shots > lastShots) {
        const tower = game.current.towers.find((t) => t.recoil > 0.12);
        if (tower) audio.current.play(tower.type);
      }
      lastShots = shots;
      if (game.current.kills > lastKills) audio.current.play("kill");
      lastKills = game.current.kills;
      if (
        game.current.phase !== lastPhase &&
        ["won", "lost"].includes(game.current.phase)
      )
        setRecords(recordResult(localStorageSafe(), game.current));
      lastPhase = game.current.phase;
      if (canvas.current) {
        const ctx = canvas.current.getContext("2d");
        ctx.setTransform(
          canvas.current.width / 1000,
          0,
          0,
          canvas.current.height / 650,
          0,
          0,
        );
        render(
          ctx,
          game.current,
          art.current,
          hover.current,
          v.build,
          v.selected,
          v.spell,
          reduced,
        );
      }
      if (now - lastUI > 90) {
        setG({ ...game.current });
        lastUI = now;
      }
      if (now - lastSave > 2000) {
        setSaveStatus(
          persistGame(localStorageSafe(), game.current)
            ? "本地自动存档"
            : "浏览器未允许存档",
        );
        lastSave = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    canvas.current.width = 400;
    canvas.current.height = 260;
    const save = () => persistGame(localStorageSafe(), game.current);
    window.addEventListener("pagehide", save);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pagehide", save);
      audio.current.dispose();
    };
  }, []);
  function reset(
    difficulty = game.current.difficulty,
    level = game.current.level,
  ) {
    game.current = initialGame(difficulty, level);
    hover.current = null;
    setAssets("loading");
    Promise.all([art.current.ready, art.current.loadLevel(level)])
      .then(() => {
        if (game.current.level === level) setAssets("ready");
      })
      .catch((e) => {
        if (game.current.level !== level) return;
        setAssets("error");
        setAssetError(e.message);
      });
    setPaused(false);
    setBuild("arrow");
    setSelected(null);
    setSpell(null);
    setModal(null);
    setNotice("新的防线，新的希望。先布置防御塔，再开始波次。");
    persistGame(localStorageSafe(), game.current);
    refresh();
    if (window.innerWidth <= 760)
      requestAnimationFrame(() =>
        canvas.current?.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
  }
  function toggleSound() {
    audio.current.enable(muted);
    setMuted(!muted);
    if (muted) audio.current.play("click");
  }
  return {
    game,
    art,
    canvas,
    hover,
    view,
    g,
    assets,
    assetError,
    saveStatus,
    records,
    paused,
    setPaused,
    speed,
    setSpeed,
    build,
    setBuild,
    selected,
    setSelected,
    spell,
    setSpell,
    modal,
    setModal,
    muted,
    toggleSound,
    notice,
    setNotice,
    refresh,
    reset,
    requestedLevel,
    setRequestedLevel,
    sound: (type) => audio.current.play(type),
  };
}
