import React from "react";
import {
  Trees,
  Heart,
  Coins,
  Flag,
  HelpCircle,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
} from "lucide-react";
import { getLevel, levelWaveCount } from "../levels.js";
import StageRail from "./StageRail.jsx";
function HudStat({ Icon, label, value, className = "" }) {
  return (
    <div className={`hud-stat ${className}`}>
      <Icon size={23} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
export default function GameHeader({
  state,
  fullscreen,
  onFullscreen,
  onChooseLevel,
}) {
  const { g, setModal, muted, toggleSound } = state;
  return (
    <header className="game-header">
      <a className="brand" href="/" aria-label="Evergreen 林间守卫">
        <img src="/favicon.svg" alt="" width="36" height="36" />
        <span>
          <h1>EVERGREEN</h1>
          <small>— 像 素 守 卫 —</small>
        </span>
      </a>
      <StageRail state={state} onChoose={onChooseLevel} compact />
      <div className="hud">
        <HudStat
          Icon={Heart}
          label="生命"
          value={
            <>
              {g.lives}
              <small> / {g.maxLives}</small>
            </>
          }
          className={g.lives < 6 ? "critical" : ""}
        />
        <HudStat
          Icon={Coins}
          label="金币"
          value={g.gold}
          className="hud-gold"
        />
        <HudStat
          Icon={Flag}
          label="当前波次"
          value={
            <>
              {String(Math.max(1, g.wave)).padStart(2, "0")}
              <small> / {levelWaveCount(g.level)}</small>
            </>
          }
        />
      </div>
      <div className="header-actions">
        <button
          className="icon-button"
          aria-label="玩法指南"
          title="玩法指南"
          onClick={() => setModal("help")}
        >
          <HelpCircle size={19} />
        </button>
        <button
          className="icon-button"
          aria-label={muted ? "开启音效" : "关闭音效"}
          title="音效"
          onClick={toggleSound}
        >
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button
          className="icon-button fullscreen-button"
          aria-label={fullscreen ? "退出全屏" : "进入全屏"}
          title="全屏"
          onClick={onFullscreen}
        >
          {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button
          className="icon-button settings-button"
          aria-label="战役设置"
          onClick={() => setModal("settings")}
        >
          <Settings size={22} />
        </button>
      </div>
    </header>
  );
}
