import { TYPES, ENEMIES } from "./content.js";
import { canPlace, towerStats, PATH } from "./game.js";
export function loadArt() {
  const urls = {
    terrain: "/art/battlefield.png",
    sprites: "/art/sprites.png",
    enemies: "/art/enemies.png",
    storm: "/art/storm.png",
  };
  const art = {};
  art.ready = Promise.all(
    Object.entries(urls).map(
      ([name, src]) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          art[name] = image;
          image.onload = resolve;
          image.onerror = () => reject(new Error("素材加载失败：" + name));
          image.src = src;
        }),
    ),
  );
  return art;
}
function paintImage(ctx, img, sx, sy, sw, sh, x, y, height) {
  if (!img?.complete || !img.naturalWidth) return;
  const w = (height * sw) / sh;
  ctx.drawImage(img, sx, sy, sw, sh, x - w / 2, y - height + 14, w, height);
}
function towerSprite(ctx, art, t, height = 99) {
  if (t.type === "storm")
    return paintImage(
      ctx,
      art.storm,
      0,
      0,
      art.storm.naturalWidth,
      art.storm.naturalHeight,
      t.x,
      t.y,
      height,
    );
  const img = art.sprites,
    w = img.naturalWidth / 4,
    index = ["arrow", "cannon", "frost"].indexOf(t.type);
  paintImage(ctx, img, index * w, 0, w, img.naturalHeight, t.x, t.y, height);
}
const enemyRects = [
  [0, 0.35, 0.175, 0.56],
  [0.175, 0.28, 0.232, 0.63],
  [0.407, 0.14, 0.135, 0.77],
  [0.542, 0.13, 0.2, 0.78],
  [0.742, 0.12, 0.258, 0.79],
];
function enemySprite(ctx, art, e) {
  const def = ENEMIES[e.type],
    bob = Math.sin(e.distance * 0.14 + e.id) * (e.type === "wisp" ? 4 : 1.8);
  if (e.type === "slime") {
    const img = art.sprites,
      w = img.naturalWidth / 4;
    paintImage(
      ctx,
      img,
      3 * w,
      img.naturalHeight * 0.4,
      w,
      img.naturalHeight * 0.56,
      e.x,
      e.y + bob,
      def.size,
    );
  } else {
    const img = art.enemies,
      [x, y, w, h] = enemyRects[def.sprite];
    paintImage(
      ctx,
      img,
      x * img.naturalWidth,
      y * img.naturalHeight,
      w * img.naturalWidth,
      h * img.naturalHeight,
      e.x,
      e.y + bob,
      def.size,
    );
  }
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
  if (e.type === "lightning") {
    ctx.shadowColor = "#b5a0ff";
    ctx.shadowBlur = 14;
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
  if (!art.terrain?.naturalWidth) return;
  ctx.clearRect(0, 0, 1000, 650);
  ctx.drawImage(art.terrain, 0, 0, 1000, 650);
  // Cinematic edge shading leaves the playable center and illustrated road unfiltered.
  const edge = ctx.createRadialGradient(500, 300, 230, 500, 325, 660);
  edge.addColorStop(0, "#071a0e00");
  edge.addColorStop(1, "#03110f88");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 1000, 650);
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
    circle(ctx, x, y, r, valid ? "#bed8bf32" : "#f3867344");
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.8;
    circle(ctx, x, y, r, null, valid ? "#f1e5b9dd" : "#ed9a86dd");
    ctx.restore();
  };
  if (sel) range(sel.x, sel.y, towerStats(sel).range);
  if (build && !spell) {
    for (let y = 175; y <= 425; y += 50)
      for (let x = 275; x <= 725; x += 50)
        if (canPlace(g, x, y)) {
          ctx.save();
          ctx.globalAlpha = hover?.x === x && hover?.y === y ? 0.9 : 0.4;
          ctx.lineWidth = 1.2;
          circle(ctx, x, y, 12, "#16382088", "#e4d6a1");
          ctx.strokeStyle = "#e8dfad";
          ctx.beginPath();
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
          ctx.stroke();
          ctx.restore();
        }
    if (hover && !sel) {
      const valid =
        canPlace(g, hover.x, hover.y) && g.gold >= TYPES[build].cost;
      range(hover.x, hover.y, TYPES[build].range, valid);
      ctx.save();
      ctx.globalAlpha = 0.6;
      towerSprite(ctx, art, { type: build, ...hover }, 95);
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
      ctx.ellipse(o.x, o.y + 9, 25, 10, 0, 0, 7);
      ctx.fill();
      if (o.specialization) {
        ctx.shadowColor = TYPES[o.type].color;
        ctx.shadowBlur = 10;
      }
      towerSprite(
        ctx,
        art,
        o,
        99 + (o.recoil > 0 ? -Math.sin(o.recoil * 15) * 3 : 0),
      );
      ctx.shadowBlur = 0;
      if (o.id === selected) {
        ctx.strokeStyle = "#eed594";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.ellipse(o.x, o.y + 8, 29, 13, 0, 0, 7);
        ctx.stroke();
      }
      const level = o.damageLevel + o.speedLevel;
      for (let i = 0; i < level; i++)
        circle(ctx, o.x - (level - 1) * 3 + i * 6, o.y + 20, 1.7, "#f1d18d");
      if (o.specialization) {
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#f8e3a8";
        ctx.textAlign = "center";
        ctx.fillText("◆", o.x, o.y - 85);
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
        ? "#e9a866"
        : o.type === "armored"
          ? "#babec1"
          : "#b5cc8a";
      ctx.fillRect(o.x - width / 2, y, width * Math.max(0, o.hp / o.maxHp), 3);
      if (o.slow > 0) circle(ctx, o.x - 12, y - 6, 2, "#8ce7ff");
      if (o.burn > 0) circle(ctx, o.x, y - 6, 2, "#ffae6e");
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
    if (s.type === "arrow") {
      ctx.strokeStyle = "#ffe0a0";
      ctx.lineWidth = 1.8;
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
      ctx.shadowBlur = s.type === "frost" ? 14 : 9;
      ctx.shadowColor = s.type === "frost" ? "#8ce7ff" : "#ffac63";
      circle(
        ctx,
        0,
        0,
        s.type === "cannon" ? 5 : 4,
        s.type === "frost" ? "#d7ffff" : "#ffd293",
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
