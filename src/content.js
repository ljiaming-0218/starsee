export const TOTAL_WAVES = 12;
export const TYPES = {
  arrow: {
    name: "游侠箭塔",
    en: "RANGER",
    cost: 80,
    range: 165,
    damage: 22,
    interval: 0.62,
    color: "#e7c782",
    role: "单体 · 物理",
    desc: "射程远、出手快。优先清理疾行敌人；对重甲的伤害较低。",
  },
  cannon: {
    name: "重装炮塔",
    en: "BOMBARD",
    cost: 140,
    range: 145,
    damage: 58,
    interval: 1.6,
    color: "#ef9a60",
    role: "范围 · 破甲",
    desc: "炮弹爆炸覆盖周围敌人，部分穿透护甲。狭窄路口的清场利器。",
  },
  frost: {
    name: "冰霜法塔",
    en: "FROSTKEEPER",
    cost: 120,
    range: 150,
    damage: 16,
    interval: 0.95,
    color: "#8cdbef",
    role: "减速 · 魔法",
    desc: "冰霜无视护甲，使敌人减速 45%，为其他防御塔争取输出时间。",
  },
  storm: {
    name: "雷电高塔",
    en: "STORMCALLER",
    cost: 180,
    range: 155,
    damage: 38,
    interval: 1.2,
    color: "#ceb0ff",
    role: "连锁 · 魔法",
    desc: "闪电在 3 个敌人间跳跃，无视护甲。每次弹跳保留 78% 伤害。",
  },
};
export const ENEMIES = {
  slime: {
    name: "森林史莱姆",
    short: "史莱姆",
    hp: 1,
    speed: 48,
    reward: 12,
    armor: 0,
    magicResist: 0,
    sprite: -1,
    size: 42,
    color: "#a7c975",
    desc: "数量众多的入侵先锋，容易被范围攻击清理。",
  },
  scout: {
    name: "疾行哥布林",
    short: "疾行者",
    hp: 0.65,
    speed: 91,
    reward: 12,
    armor: 0,
    magicResist: 0,
    sprite: 0,
    size: 44,
    color: "#c6b578",
    desc: "移动速度很快。用箭塔点杀，或用冰霜限制行动。",
  },
  armored: {
    name: "重甲圣甲虫",
    short: "重甲虫",
    hp: 2.1,
    speed: 36,
    reward: 24,
    armor: 0.58,
    magicResist: 0,
    sprite: 1,
    size: 54,
    color: "#b6bdc3",
    desc: "护甲减少 58% 箭矢伤害。炮击部分破甲，魔法完全无视护甲。",
  },
  wisp: {
    name: "幽林游魂",
    short: "游魂",
    hp: 0.95,
    speed: 64,
    reward: 18,
    armor: 0,
    magicResist: 0.42,
    sprite: 2,
    size: 47,
    color: "#c1a2ee",
    desc: "抵抗 42% 魔法伤害。使用物理塔对抗；冰霜减速仍然有效。",
  },
  shaman: {
    name: "苔林萨满",
    short: "萨满",
    hp: 1.5,
    speed: 42,
    reward: 28,
    armor: 0,
    magicResist: 0.15,
    sprite: 3,
    size: 52,
    color: "#7fd5a3",
    desc: "每秒回复周围同伴 1.6% 最大生命。优先击杀，避免战线拖长。",
  },
  boss: {
    name: "远古岩石巨像",
    short: "岩石巨像",
    hp: 11,
    speed: 28,
    reward: 150,
    armor: 0.35,
    magicResist: 0.15,
    sprite: 4,
    size: 91,
    color: "#e5b275",
    desc: "携带护甲、抵抗一半减速效果。漏过扣 5 点生命。合理使用陨火。",
  },
};
export const SPECIALIZATIONS = {
  arrow: [
    { id: "sniper", name: "鹰眼神射", desc: "射程 +60，伤害 +45%", cost: 170 },
    { id: "volley", name: "疾风齐射", desc: "同时攻击 3 个目标", cost: 190 },
  ],
  cannon: [
    {
      id: "siege",
      name: "震地重炮",
      desc: "爆炸半径 +45，伤害 +25%",
      cost: 210,
    },
    {
      id: "burn",
      name: "烈焰炮弹",
      desc: "额外燃烧伤害，持续 3 秒",
      cost: 200,
    },
  ],
  frost: [
    {
      id: "glacier",
      name: "永冻之心",
      desc: "减速提升至 70%，持续 3 秒",
      cost: 170,
    },
    {
      id: "brittle",
      name: "碎冰诅咒",
      desc: "命中目标承伤 +30%，持续 3 秒",
      cost: 185,
    },
  ],
  storm: [
    {
      id: "chain",
      name: "风暴回响",
      desc: "连锁目标由 3 个增至 5 个",
      cost: 230,
    },
    { id: "overload", name: "雷霆过载", desc: "首个目标伤害 +100%", cost: 220 },
  ],
};
export const DIFFICULTIES = {
  casual: { name: "休闲", hp: 0.8, lives: 25, desc: "更从容的森林之旅" },
  normal: { name: "标准", hp: 1, lives: 20, desc: "策略与挑战恰到好处" },
  veteran: { name: "老兵", hp: 1.3, lives: 15, desc: "为经验丰富的守卫者准备" },
};
export const WAVES = [
  {
    name: "林间异动",
    tip: "先用箭塔守住前两段路口。",
    groups: [
      ["slime", 8],
      ["scout", 4],
    ],
  },
  {
    name: "疾行突袭",
    tip: "疾行者成群来袭，减速可以争取时间。",
    groups: [
      ["scout", 12],
      ["slime", 6],
    ],
  },
  {
    name: "铁甲行军",
    tip: "重甲登场。魔法塔与炮塔能有效克制。",
    groups: [
      ["slime", 10],
      ["armored", 5],
    ],
  },
  {
    name: "古岩苏醒",
    tip: "第一只巨像出现，留好陨火技能。",
    groups: [
      ["scout", 10],
      ["armored", 4],
      ["boss", 1],
    ],
  },
  {
    name: "暗夜游魂",
    tip: "游魂抵抗魔法，物理箭塔仍然重要。",
    groups: [
      ["wisp", 12],
      ["slime", 10],
    ],
  },
  {
    name: "苔林仪式",
    tip: "萨满会治疗附近同伴，优先集火。",
    groups: [
      ["armored", 8],
      ["shaman", 3],
      ["scout", 8],
    ],
  },
  {
    name: "蜂拥而至",
    tip: "大量轻装单位，连锁和爆炸是最佳选择。",
    groups: [
      ["scout", 20],
      ["slime", 14],
      ["wisp", 5],
    ],
  },
  {
    name: "巨像之怒",
    tip: "巨像与治疗者同行，强敌优先锁定目标。",
    groups: [
      ["boss", 1],
      ["armored", 10],
      ["shaman", 4],
    ],
  },
  {
    name: "幽影潮汐",
    tip: "魔抗与重甲混编，保持物理和魔法搭配。",
    groups: [
      ["wisp", 15],
      ["armored", 10],
      ["scout", 8],
    ],
  },
  {
    name: "绿潮奔袭",
    tip: "敌人密集，尝试完成塔的专精。",
    groups: [
      ["slime", 18],
      ["scout", 18],
      ["shaman", 4],
    ],
  },
  {
    name: "森林的回声",
    tip: "最后的准备。检查技能冷却和薄弱路段。",
    groups: [
      ["armored", 14],
      ["wisp", 12],
      ["shaman", 5],
    ],
  },
  {
    name: "最后的守望",
    tip: "两只巨像压境。让每一枚金币发挥作用。",
    groups: [
      ["scout", 14],
      ["armored", 12],
      ["shaman", 4],
      ["boss", 2],
    ],
  },
];
export const SPELLS = {
  meteor: {
    name: "陨火打击",
    key: "Q",
    cooldown: 38,
    desc: "点击战场，对 115 范围造成魔法伤害，伤害随波次增强。",
    color: "#e5a065",
  },
  heal: {
    name: "复苏之风",
    key: "W",
    cooldown: 55,
    desc: "立即恢复 4 点生命，不超过初始生命上限。",
    color: "#9bcd8f",
  },
};
export function wavePlan(wave) {
  const groups = WAVES[wave - 1]?.groups || [];
  const result = [];
  const bosses = [];
  const max = Math.max(0, ...groups.map(([, count]) => count));
  for (let i = 0; i < max; i++)
    for (const [type, count] of groups)
      if (i < count) (type === "boss" ? bosses : result).push(type);
  return [...result, ...bosses];
}
