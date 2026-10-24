import { getLevel } from "./levels.js";
export const TOTAL_WAVES = 12;
export const TYPES = {
  arrow: {
    name: "兔耳箭屋",
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
    name: "茶壶炮坊",
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
    name: "雪帽冰屋",
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
    name: "星星雷屋",
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
Object.assign(TYPES, {
  venom: {
    name: "蘑菇药坊",
    en: "VENOM",
    cost: 110,
    range: 150,
    damage: 10,
    interval: 0.8,
    color: "#b4db65",
    role: "叠毒 · 抑疗",
    desc: "毒素可叠 3 层，持续 4 秒。中毒敌人的治疗效果降低 50%，克制祭司阵容。",
  },
  flame: {
    name: "小龙焙坊",
    en: "FLAMETHROWER",
    cost: 150,
    range: 120,
    damage: 10,
    interval: 0.22,
    color: "#f4a26b",
    role: "锥形 · 灼烧",
    desc: "向前方扇区持续喷火，命中多个敌人并附加燃烧。射程短，适合转角密集布防。",
  },
  ballista: {
    name: "刺猬弩屋",
    en: "BALLISTA",
    cost: 200,
    range: 245,
    damage: 90,
    interval: 2.1,
    color: "#e6c18e",
    role: "贯穿 · 远射",
    desc: "超远距离重弩，穿透同一直线上的 2 个敌人，忽略一半护甲。射速慢，适合长直道。",
  },
  beacon: {
    name: "暖灯小屋",
    en: "BEACON",
    cost: 160,
    range: 155,
    damage: 0,
    interval: 1,
    color: "#f3d780",
    role: "光环 · 辅助",
    desc: "不直接攻击。范围内友塔伤害 +20%、射速 +15%。并使范围内友塔受到的伤害降低 25%。同类光环取最高值。",
  },
});
Object.assign(TYPES, {
  medic: {
    name: "兔兔诊所",
    en: "BUNNY CLINIC",
    cost: 130,
    range: 180,
    damage: 24,
    interval: 1.4,
    color: "#f4b5cd",
    role: "治疗 · 抢修",
    desc: "不攻击怪物。每次修复范围内损伤比例最高的建筑 24 点耐久，可修复自身。已摧毁的建筑无法复活。",
  },
  bulwark: {
    name: "龟壳堡",
    en: "SHELL GUARD",
    cost: 100,
    range: 115,
    damage: 0,
    interval: 2,
    color: "#96d8e7",
    role: "护卫 · 分伤",
    desc: "不直接攻击。替范围内友方建筑承担 65% 伤害，每 2 秒自愈 8 点。保护范围内优先由最近的龟壳堡承担。",
  },
});
const durability = {
  arrow: 300,
  cannon: 400,
  frost: 300,
  storm: 320,
  venom: 300,
  flame: 420,
  ballista: 340,
  beacon: 320,
  medic: 280,
  bulwark: 780,
};
for (const [type, hp] of Object.entries(durability)) TYPES[type].hp = hp;
export const SUPPORT_TYPES = ["beacon", "medic", "bulwark"];
export const isSupport = (type) => SUPPORT_TYPES.includes(type);
export const ENEMIES = {
  slime: {
    name: "噬光黏怪",
    short: "噬光怪",
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
    name: "裂面爪行者",
    short: "爪行者",
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
    name: "骨甲攻城兽",
    short: "骨甲兽",
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
    name: "缝影幽魂",
    short: "幽魂",
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
    name: "鹿骸祭司",
    short: "祭司",
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
    name: "裂颚灾像",
    short: "裂颚灾像",
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
// Reach is measured from the road position to the building footprint.
const raids = {
  slime: [90, 9, 1.6, "近距离噬咬建筑"],
  scout: [90, 8, 1.1, "快速挥爪，威胁前排"],
  armored: [120, 24, 2.2, "重击建筑，优先攻击龟壳堡"],
  wisp: [210, 16, 2.6, "远程影弹，能袭击后排"],
  shaman: [170, 13, 3, "诅咒投射，同时治疗同伴"],
  boss: [180, 52, 3.2, "重击波及目标周围 90 范围"],
};
for (const [type, [reach, attack, attackInterval, raid]] of Object.entries(
  raids,
)) {
  Object.assign(ENEMIES[type], { reach, attack, attackInterval, raid });
}
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
Object.assign(SPECIALIZATIONS, {
  venom: [
    {
      id: "plague",
      name: "瘟疫扩散",
      desc: "毒弹影响目标周围 70 范围",
      cost: 175,
    },
    {
      id: "toxin",
      name: "剧毒萃取",
      desc: "毒素上限 5 层，持续 6 秒",
      cost: 185,
    },
  ],
  flame: [
    {
      id: "firestorm",
      name: "灼热风暴",
      desc: "射程 +40，喷火角度扩大",
      cost: 210,
    },
    {
      id: "molten",
      name: "熔核喷流",
      desc: "伤害 +60%，燃烧延长至 3 秒",
      cost: 225,
    },
  ],
  ballista: [
    {
      id: "rail",
      name: "贯穿弩阵",
      desc: "贯穿 4 个敌人，射程 +45",
      cost: 240,
    },
    { id: "giant", name: "巨兽猎手", desc: "对巨像造成双倍伤害", cost: 230 },
  ],
  beacon: [
    { id: "wide", name: "守望灯塔", desc: "光环半径 +70", cost: 190 },
    {
      id: "warbanner",
      name: "战争号角",
      desc: "光环额外增加 15% 伤害",
      cost: 215,
    },
  ],
});
Object.assign(SPECIALIZATIONS, {
  medic: [
    {
      id: "triage",
      name: "双兔急救",
      desc: "每次治疗 2 座受损建筑",
      cost: 170,
    },
    {
      id: "sanctuary",
      name: "暖心病房",
      desc: "治疗量 +50%，范围 +55",
      cost: 185,
    },
  ],
  bulwark: [
    {
      id: "bastion",
      name: "厚壳卫士",
      desc: "最大耐久 +450，分伤半径 +45",
      cost: 160,
    },
    {
      id: "mending",
      name: "长眠修复",
      desc: "自愈由 8 点提升至 28 点",
      cost: 155,
    },
  ],
});
export const DIFFICULTIES = {
  casual: { name: "休闲", hp: 0.8, lives: 25, desc: "更从容的森林之旅" },
  normal: { name: "标准", hp: 1, lives: 20, desc: "策略与挑战恰到好处" },
  veteran: { name: "老兵", hp: 1.3, lives: 15, desc: "为经验丰富的守卫者准备" },
};
export const WAVES = [
  {
    name: "林间异动",
    tip: "先用兔耳箭屋守住路口。建筑也会受伤，可用诊所治疗或金币维修。",
    groups: [
      ["slime", 8],
      ["scout", 4],
    ],
  },
  {
    name: "疾行突袭",
    tip: "爪行者成群来袭，减速可以争取时间。",
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
    name: "暗夜幽魂",
    tip: "幽魂抵抗魔法，物理箭塔仍然重要。",
    groups: [
      ["wisp", 12],
      ["slime", 10],
    ],
  },
  {
    name: "苔林仪式",
    tip: "祭司会治疗附近同伴，优先集火。",
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
export function levelWave(wave, level = "forest") {
  const stage = getLevel(level);
  return WAVES[stage.waveOrder[wave - 1]] || WAVES[stage.waveOrder.at(-1)];
}
export function wavePlan(wave, level) {
  const groups =
    (level ? levelWave(wave, level) : WAVES[wave - 1])?.groups || [];
  const result = [],
    bosses = [],
    max = Math.max(0, ...groups.map(([, count]) => count));
  for (let i = 0; i < max; i++)
    for (const [type, count] of groups)
      if (i < count) (type === "boss" ? bosses : result).push(type);
  return [...result, ...bosses];
}
