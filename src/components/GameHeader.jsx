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
import { TOTAL_WAVES } from "../content.js";
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
export default function GameHeader({ state, fullscreen, onFullscreen }) {
  const { g, setModal, muted, toggleSound } = state;
  return (
    <header className="game-header">
      <a className="brand" href="/" aria-label="Evergreen 林间守卫">
        <Trees size={40} strokeWidth={1.25} />
        <span>
          <b>EVERGREEN</b>
          <small>—— 林 间 守 卫 ——</small>
        </span>
      </a>
      <div className="campaign-title">
        <h1>翡翠林地</h1>
        <p>
          第{g.wave > 8 ? "三" : g.wave > 4 ? "二" : "一"}章 ·{" "}
          {g.wave > 8 ? "最后的守望" : g.wave > 4 ? "暗潮涌动" : "被遗忘的林间"}
        </p>
      </div>
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
              <small> / {TOTAL_WAVES}</small>
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
