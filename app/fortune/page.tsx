"use client";

import { useState } from "react";

type Fortune = {
  level: string;
  weight: number;
  color: string;
  poem: string;
  love: string;
  career: string;
  money: string;
  health: string;
};

const FORTUNES: Fortune[] = [
  {
    level: "大吉",
    weight: 15,
    color: "#d97706",
    poem: "萬事亨通,心想事成的好日子。",
    love: "桃花朵朵開,勇敢表達心意",
    career: "工作運旺盛,適合主動出擊",
    money: "財運亨通,投資可望獲利",
    health: "精神飽滿,活力充沛",
  },
  {
    level: "中吉",
    weight: 20,
    color: "#16a34a",
    poem: "順風而行,努力終將開花結果。",
    love: "感情穩定加溫,多些甜蜜互動",
    career: "努力被看見,升遷有望",
    money: "收入穩定,小額投資順利",
    health: "身心平衡,維持良好作息",
  },
  {
    level: "小吉",
    weight: 20,
    color: "#22c55e",
    poem: "小有收穫,穩紮穩打繼續前進。",
    love: "單身者有機會遇見合適對象",
    career: "按部就班,穩步向前",
    money: "財運普通,量入為出即可",
    health: "狀態尚可,別忘了適度休息",
  },
  {
    level: "吉",
    weight: 15,
    color: "#3b82f6",
    poem: "平順如常,保持步調安心前行。",
    love: "感情平順,坦誠溝通更順利",
    career: "工作穩定,適合累積實力",
    money: "財務平穩,無須過度擔心",
    health: "體力一般,規律運動有幫助",
  },
  {
    level: "末吉",
    weight: 15,
    color: "#8b5cf6",
    poem: "否極泰來前的醞釀,耐心等待轉機。",
    love: "感情需要耐心經營,勿躁進",
    career: "進展稍緩,沉潛蓄積能量",
    money: "收支持平,避免衝動消費",
    health: "容易疲勞,注意睡眠品質",
  },
  {
    level: "凶",
    weight: 10,
    color: "#f97316",
    poem: "諸事不順,凡事多加謹慎為宜。",
    love: "溝通易生誤會,少說多聽",
    career: "阻礙較多,凡事三思而後行",
    money: "破財小心,避免借貸與擔保",
    health: "抵抗力較弱,留意保暖與飲食",
  },
  {
    level: "大凶",
    weight: 5,
    color: "#dc2626",
    poem: "低潮時刻,靜心沉澱,避免衝動決定。",
    love: "感情低潮,先照顧好自己",
    career: "諸事不順,宜守不宜攻",
    money: "財運低迷,避免任何投資決策",
    health: "身體亮紅燈,務必多加休息",
  },
];

function drawFortune(): Fortune {
  const total = FORTUNES.reduce((sum, f) => sum + f.weight, 0);
  let r = Math.random() * total;
  for (const f of FORTUNES) {
    if (r < f.weight) return f;
    r -= f.weight;
  }
  return FORTUNES[FORTUNES.length - 1];
}

const CATEGORY_ROWS: { key: keyof Fortune; icon: string; label: string }[] = [
  { key: "love", icon: "❤️", label: "愛情" },
  { key: "career", icon: "💼", label: "事業" },
  { key: "money", icon: "💰", label: "財運" },
  { key: "health", icon: "🩺", label: "健康" },
];

export default function FortunePage() {
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<Fortune | null>(null);

  function draw() {
    if (drawing) return;
    setResult(null);
    setDrawing(true);
    setTimeout(() => {
      setResult(drawFortune());
      setDrawing(false);
    }, 900);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center gap-8 bg-gradient-to-b from-rose-50 via-amber-50 to-orange-50 px-6 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          🎋 好運抽籤
        </h1>
        <p
          className="text-sm text-zinc-500 dark:text-zinc-400"
          suppressHydrationWarning
        >
          {new Date().toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
          ・今日運勢
        </p>
      </div>

      {/* 籤筒 */}
      <div className={`relative ${drawing ? "cup-shake" : ""}`}>
        <svg width={140} height={160} viewBox="0 0 140 160">
          {/* 籤支 */}
          {[-18, -8, 4, 14, 24].map((angle, i) => (
            <rect
              key={i}
              x="66"
              y="10"
              width="7"
              height="70"
              rx="3"
              fill="#f5deb3"
              stroke="#c9a35d"
              strokeWidth="1"
              transform={`rotate(${angle} 70 80)`}
            />
          ))}
          {/* 籤筒杯身 */}
          <path
            d="M30 70 L110 70 L100 150 Q70 160 40 150 Z"
            fill="#9a5b2c"
            stroke="#6b3d1a"
            strokeWidth="2"
          />
          <ellipse cx="70" cy="70" rx="40" ry="10" fill="#c07b3e" stroke="#6b3d1a" strokeWidth="2" />
        </svg>
      </div>

      <button
        onClick={draw}
        disabled={drawing}
        className="rounded-full bg-gradient-to-b from-amber-500 to-amber-700 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {drawing ? "搖籤中…" : result ? "🎋 再抽一次" : "🎋 抽一支籤"}
      </button>

      {result && !drawing && (
        <div className="winner-pop w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div
            className="flex flex-col items-center gap-1 py-6 text-white"
            style={{ backgroundColor: result.color }}
          >
            <span className="text-sm opacity-90">今日籤詩</span>
            <span className="text-4xl font-bold">{result.level}</span>
          </div>
          <div className="flex flex-col gap-4 p-5">
            <p className="text-center text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {result.poem}
            </p>
            <div className="flex flex-col gap-2">
              {CATEGORY_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
                >
                  <span>{row.icon}</span>
                  <span className="w-10 shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                    {row.label}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {result[row.key] as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
