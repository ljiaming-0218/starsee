import { LEVELS, getLevel } from "./levels.js";
import { TYPES, ENEMIES } from "./content.js";
import { canPlace, towerStats, BUILDING_SPRITE_SIZE } from "./game.js";
import { pixelAtlas, createTerrain } from "./pixelArt.js";
export function loadArt(level = "forest") {
  const art = { terrains: {}, mapPromises: {} };
  function load(name, src, cols, rows, cellSize = 32) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        art[name] = pixelAtlas(image, cols, rows, cellSize);
        resolve();
      };
      image.onerror = () => reject(new Error("素材加载失败：" + name));
      image.src = src;
    });
  }
  const common = Promise.all([
    load("towers", "/art/tiny-buildings.png", 5, 2),
    load("enemies", "/art/tiny-monsters.png", 3, 2, 20),
    load("spells", "/art/pixel-spells.png", 2, 1, 16),
    load("tiles", "/art/terrain-tiles.png", 4, 3),
  ]);
  art.loadLevel = (id) =>
    (art.mapPromises[id] ||= common.then(() => {
      art.terrains[id] = createTerrain(id, art.tiles);
      return art.terrains[id];
    }));
  art.ready = art.loadLevel(level).then(() => {
    art.loaded = true;
  });
  return art;
}
function paintCell(ctx, img, index, cols, rows, x, y, size) {
  if (!img?.width) return;
  const w = img.width / cols,
    h = img.height / rows;
  ctx.drawImage(
    img,
    (index % cols) * w,
    Math.floor(index / cols) * h,
    w,
    h,
    Math.round(x - size / 2),
    Math.round(y - size + 14),
    size,
    size,
  );
}
function towerSprite(ctx, art, t, height = BUILDING_SPRITE_SIZE) {
  paintCell(
    ctx,
    art.towers,
    Object.keys(TYPES).indexOf(t.type),
    5,
    2,
    t.x,
    t.y,
    height,
  );
}
function enemySprite(ctx, art, e) {
  const def = ENEMIES[e.type],
    bob = Math.round(
      Math.sin(e.distance * 0.14 + e.id) * (e.type === "wisp" ? 4 : 1),
    );
  paintCell(
    ctx,
    art.enemies,
    Object.keys(ENEMIES).indexOf(e.type),
    3,
    2,
    e.x,
    e.y + bob,
    e.boss ? 100 : 50,
  );
}
function circle(ctx, x, y, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function renderEffect(ctx, e, time) {
  const t = 1 - e.life / e.max;
  ctx.save();
  ctx.globalAlpha = Math.min(1, e.life * 5);
  if (["mend", "guard", "raid"].includes(e.type)) {
    const color =
      e.type === "mend"
        ? "#9bffd0"
        : e.type === "guard"
          ? "#9bdfff"
          : "#ff7689";
    ctx.strokeStyle = color;
    ctx.lineWidth = e.heavy ? 5 : 2.5;
    ctx.setLineDash(e.type === "mend" ? [4, 5] : []);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.tx, e.ty);
    ctx.stroke();
    ctx.setLineDash([]);
    if (e.type === "mend") {
      ctx.fillStyle = color;
      ctx.fillRect(e.tx - 8, e.ty - 2 - t * 18, 16, 4);
      ctx.fillRect(e.tx - 2, e.ty - 8 - t * 18, 4, 16);
    } else circle(ctx, e.tx, e.ty, 5 + t * 15, null, color);
  } else if (e.type === "repair") {
    ctx.fillStyle = "#a2ffd2";
    ctx.fillRect(e.x - 12, e.y - 3 - t * 30, 24, 6);
    ctx.fillRect(e.x - 3, e.y - 12 - t * 30, 6, 24);
  } else if (e.type === "collapse") {
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.4;
      ctx.fillStyle = i % 2 ? "#6f7374" : e.color;
      ctx.fillRect(
        e.x + Math.cos(angle) * t * 45,
        e.y + Math.sin(angle) * t * 20 - Math.sin(t * Math.PI) * 25,
        5 + (i % 5),
        5 + (i % 4),
      );
    }
  } else if (e.type === "flame") {
    for (let i = 0; i < 20; i++) {
      const a = e.angle + Math.sin(i * 2.4) * e.cone,
        dist = e.radius * (0.15 + (i % 7) / 9);
      ctx.fillStyle = i % 3 ? "#ff9a44" : "#ffe59a";
      const size = 6 + (i % 3) * 3;
      ctx.fillRect(
        e.x + Math.cos(a) * dist - size / 2,
        e.y + Math.sin(a) * dist - size / 2,
        size,
        size,
      );
    }
  } else if (e.type === "poison") {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      ctx.fillStyle = i % 2 ? "#badf67" : "#789d3d";
      ctx.fillRect(
        e.x + Math.cos(a) * 30 * t,
        e.y + Math.sin(a) * 22 * t,
        6 * (1 - t),
        6 * (1 - t),
      );
    }
  } else if (e.type === "lightning") {
    ctx.shadowColor = "#b5a0ff";
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f0dcff";
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    for (let i = 1; i <= 7; i++) {
      const p = i / 7,
        noise = i === 7 ? 0 : Math.sin(i * 18 + e.life * 40) * 11;
      ctx.lineTo(
        e.x + (e.tx - e.x) * p + noise,
        e.y + (e.ty - e.y) * p - noise * 0.6,
      );
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    circle(ctx, e.tx, e.ty, 8 * (1 - t), "#f2e3ff");
  } else if (e.type === "explosion" || e.type === "meteor") {
    const meteor = e.type === "meteor",
      radius = meteor ? 115 : e.radius;
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(
      e.x,
      e.y,
      2,
      e.x,
      e.y,
      Math.max(2, radius * (0.3 + t * 0.7)),
    );
    glow.addColorStop(0, "#ffe3aacc");
    glow.addColorStop(0.4, "#f98b3e80");
    glow.addColorStop(1, "#ed713100");
    circle(ctx, e.x, e.y, radius * (0.3 + t * 0.7), glow);
    ctx.lineWidth = meteor ? 4 : 2;
    circle(ctx, e.x, e.y, radius * t, null, "#f2bc70");
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.399;
      circle(
        ctx,
        e.x + Math.cos(angle) * radius * t,
        e.y + Math.sin(angle) * radius * t * 0.65,
        3 * (1 - t),
        "#ffda95",
      );
    }
    if (meteor && t < 0.2) {
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ffda88";
      ctx.beginPath();
      ctx.moveTo(e.x + 150 * (1 - t * 5), e.y - 250 * (1 - t * 5));
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }
  } else if (e.type === "ice") {
    ctx.strokeStyle = "#c2f5ff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(a) * 25 * t, e.y + Math.sin(a) * 25 * t);
      ctx.stroke();
    }
    circle(ctx, e.x, e.y, 23 * t, null, "#8ce4ed80");
  } else if (e.type === "spark") {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffe8a9";
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      ctx.beginPath();
      ctx.moveTo(e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 5);
      ctx.lineTo(e.x + Math.cos(a) * 18 * t, e.y + Math.sin(a) * 18 * t);
      ctx.stroke();
    }
  } else if (e.type === "death") {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      circle(
        ctx,
        e.x + Math.cos(a) * 22 * t,
        e.y + Math.sin(a) * 15 * t,
        3 * (1 - t),
        e.color,
      );
    }
  } else if (e.type === "build") {
    ctx.lineWidth = 2;
    circle(ctx, e.x, e.y, 18 + 32 * t, null, "#f4d18f");
    circle(ctx, e.x, e.y, 9 + 22 * t, null, "#e4e7b188");
  } else if (e.type === "leak") {
    circle(ctx, e.x, e.y, 25 + 70 * t, null, "#f37b70");
  } else if (e.type === "heal") {
    ctx.strokeStyle = "#b8e999";
    ctx.lineWidth = 3;
    circle(ctx, e.x, e.y, 20 + 100 * t, null, "#a6ecab");
    for (let i = 0; i < 8; i++) {
      const x = e.x + Math.cos(i * 2.4) * 50,
        y = e.y + Math.sin(i * 2.4) * 40 - t * 60;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}
export function render(
  ctx,
  g,
  art,
  hover,
  build,
  selected,
  spell,
  reducedMotion = false,
) {
  const terrain = art.terrains[g.level];
  if (!terrain?.width) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 1000, 650);
  ctx.drawImage(terrain, 0, 0, 1000, 650);
  const time = g.visualTime;
  if (!reducedMotion)
    for (let i = 0; i < 20; i++) {
      const x = (i * 173 + time * (i % 2 ? 3 : -2) + 1000) % 1000,
        y = 70 + ((i * 91) % 500) + Math.sin(time * 0.7 + i) * 8;
      ctx.globalAlpha = 0.15 + Math.sin(time * 1.5 + i) * 0.12;
      circle(ctx, x, y, i % 3 ? 1 : 1.7, "#fee9a6");
    }
  ctx.globalAlpha = 1;
  const sel = g.towers.find((t) => t.id === selected);
  const range = (x, y, r, valid = true) => {
    ctx.save();
    circle(
      ctx,
      x,
      y,
      r,
      valid
        ? sel?.type === "medic" || build === "medic"
          ? "#9bffd023"
          : "#bed8bf32"
        : "#f3867344",
    );
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.8;
    circle(
      ctx,
      x,
      y,
      r,
      null,
      valid
        ? sel?.type === "medic" || build === "medic"
          ? "#9bffd0"
          : "#f1e5b9dd"
        : "#ed9a86dd",
    );
    ctx.restore();
  };
  if (sel) range(sel.x, sel.y, towerStats(sel, g).range);
  for (const b of g.towers)
    if (b.type === "beacon") {
      const stats = towerStats(b);
      for (const t of g.towers)
        if (t.id !== b.id && Math.hypot(t.x - b.x, t.y - b.y) <= stats.range) {
          ctx.save();
          ctx.strokeStyle = "#ffdb8644";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 7]);
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
          ctx.restore();
        }
    }
  if (build && !spell) {
    for (let y = 75; y <= 575; y += 50)
      for (let x = 75; x <= 925; x += 50)
        if (canPlace(g, x, y)) {
          ctx.save();
          ctx.globalAlpha = hover?.x === x && hover?.y === y ? 0.9 : 0.4;
          ctx.lineWidth = 1.2;
          ctx.fillStyle = "#e5eeeb";
          for (const dx of [-12.5, 5])
            for (const dy of [-12.5, 10])
              ctx.fillRect(x + dx, y + dy, 7.5, 2.5);
          for (const dx of [-12.5, 10])
            for (const dy of [-12.5, 5]) ctx.fillRect(x + dx, y + dy, 2.5, 7.5);
          ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
          ctx.restore();
        }
    if (hover && !sel) {
      const valid =
        canPlace(g, hover.x, hover.y) && g.gold >= TYPES[build].cost;
      range(hover.x, hover.y, TYPES[build].range, valid);
      ctx.save();
      ctx.globalAlpha = 0.6;
      towerSprite(ctx, art, { type: build, ...hover });
      ctx.restore();
    }
  }
  if (spell === "meteor" && hover) {
    range(hover.x, hover.y, 115, false);
    ctx.strokeStyle = "#ffd292";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hover.x - 12, hover.y);
    ctx.lineTo(hover.x + 12, hover.y);
    ctx.moveTo(hover.x, hover.y - 12);
    ctx.lineTo(hover.x, hover.y + 12);
    ctx.stroke();
  }
  for (const e of g.enemies)
    if (e.type === "shaman") {
      ctx.save();
      ctx.globalAlpha = 0.08 + Math.sin(time * 3) * 0.025;
      circle(ctx, e.x, e.y, 95, "#8bffb4");
      ctx.restore();
    }
  const objects = [
    ...g.towers.map((t) => ({ ...t, kind: "tower" })),
    ...g.enemies.map((e) => ({ ...e, kind: "enemy" })),
  ].sort((a, b) => a.y - b.y);
  for (const o of objects) {
    ctx.save();
    if (o.kind === "tower") {
      ctx.fillStyle = "#07140b55";
      ctx.beginPath();
      ctx.ellipse(o.x, o.y + 6, 21, 7, 0, 0, 7);
      ctx.fill();
      if (o.type === "beacon") {
        ctx.setLineDash([4, 5]);
        circle(ctx, o.x, o.y, towerStats(o).range, null, "#ffe49a44");
        ctx.setLineDash([]);
      } else if (towerStats(o, g).buffed) {
        circle(ctx, o.x, o.y + 11, 28, null, "#ffdf77bb");
      }
      if (o.hit > 0) ctx.filter = "brightness(1.65) sepia(.6)";
      else if (o.hp < o.maxHp * 0.35) ctx.filter = "brightness(.7)";
      towerSprite(
        ctx,
        art,
        o,
        BUILDING_SPRITE_SIZE +
          (o.recoil > 0 ? -Math.sin(o.recoil * 15) * 2 : 0),
      );
      ctx.filter = "none";
      const healthY = o.y - 70;
      ctx.fillStyle = "#071b29";
      ctx.fillRect(o.x - 25, healthY - 1, 50, 7);
      ctx.fillStyle = o.hp < o.maxHp * 0.35 ? "#ff7e91" : "#9bffd0";
      ctx.fillRect(o.x - 23, healthY + 1, 46 * Math.max(0, o.hp / o.maxHp), 3);
      if (o.hp < o.maxHp * 0.35) {
        ctx.fillStyle = "#ffb5ba";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", o.x + 32, healthY + 7);
      }
      ctx.shadowBlur = 0;
      if (o.id === selected) {
        ctx.strokeStyle = "#eed594";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y + 6, 24, 9, 0, 0, 7);
        ctx.stroke();
      }
      const level = o.damageLevel + o.speedLevel;
      for (let i = 0; i < level; i++)
        circle(ctx, o.x - (level - 1) * 3 + i * 6, o.y + 20, 1.7, "#f1d18d");
      if (o.specialization) {
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#f8e3a8";
        ctx.textAlign = "center";
        ctx.fillText("◆", o.x, o.y - 82);
      }
    } else {
      if (o.hit > 0) {
        ctx.filter = "brightness(1.5)";
      } else if (o.slow > 0) {
        ctx.filter = "brightness(1.08) saturate(.7)";
      }
      enemySprite(ctx, art, o);
      ctx.filter = "none";
      const def = ENEMIES[o.type],
        width = o.boss ? 64 : 32,
        y = o.y - def.size + 7;
      ctx.fillStyle = "#091813cc";
      ctx.fillRect(o.x - width / 2 - 1, y - 1, width + 2, 5);
      ctx.fillStyle = o.boss
        ? "#f17c91"
        : o.type === "armored"
          ? "#babec1"
          : "#dd819b";
      ctx.fillRect(o.x - width / 2, y, width * Math.max(0, o.hp / o.maxHp), 3);
      if (o.slow > 0) circle(ctx, o.x - 12, y - 6, 2, "#8ce7ff");
      if (o.burn > 0) circle(ctx, o.x, y - 6, 2, "#ffae6e");
      if (o.poison > 0) circle(ctx, o.x + 16, y - 6, 2, "#b9e56a");
      if (o.vulnerable > 0) circle(ctx, o.x + 10, y - 6, 2, "#e4b4ff");
    }
    ctx.restore();
  }
  for (const s of g.shots) {
    const p = Math.min(1, s.age / s.duration),
      x = s.x + (s.tx - s.x) * p,
      y =
        s.y +
        (s.ty - s.y) * p -
        (s.type === "cannon" ? Math.sin(p * Math.PI) * 65 : 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(s.ty - s.y, s.tx - s.x));
    if (s.type === "arrow" || s.type === "ballista") {
      ctx.lineWidth = s.type === "ballista" ? 4 : 1.8;
      ctx.strokeStyle = "#ffe0a0";
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff4c9";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(1, -3);
      ctx.lineTo(1, 3);
      ctx.fill();
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = s.type === "frost" ? "#8ce7ff" : "#ffac63";
      circle(
        ctx,
        0,
        0,
        s.type === "cannon" ? 5 : 4,
        s.type === "frost"
          ? "#d7ffff"
          : s.type === "venom"
            ? "#b5ef64"
            : "#ffd293",
      );
    }
    ctx.restore();
  }
  for (const e of g.effects) renderEffect(ctx, e, time);
  for (const p of g.particles) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.font = 'bold 14px "DM Sans",sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = p.color || "#f4d78e";
    ctx.strokeStyle = "#173325";
    ctx.lineWidth = 3;
    ctx.strokeText(p.text, p.x, p.y - 20);
    ctx.fillText(p.text, p.x, p.y - 20);
    ctx.restore();
  }
}
