"use client";

import { useMemo, useRef, useState } from "react";

const WHEEL_SIZE = 320;
const RIM = 16;
const DOT_COUNT = 18;
const SPIN_DURATION_MS = 4500;

export default function LotteryPage() {
  const [rawInput, setRawInput] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const pendingWinnerRef = useRef<string | null>(null);

  const segmentAngle = names.length > 0 ? 360 / names.length : 0;

  const wheelBackground = useMemo(() => {
    if (names.length === 0) return "#e4e4e7";
    if (names.length === 1) return `hsl(0 78% 52%)`;

    const halfGap = 0.35; // % of circle reserved for each divider line
    const stops: string[] = [];
    names.forEach((_, i) => {
      const hue = (360 / names.length) * i;
      const color = `hsl(${hue} 78% 52%)`;
      const from = (i * 100) / names.length;
      const to = ((i + 1) * 100) / names.length;
      stops.push(`${color} ${from + halfGap}% ${to - halfGap}%`);
      stops.push(`white ${to - halfGap}% ${to + halfGap}%`);
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [names]);

  function applyNames() {
    const parsed = Array.from(
      new Set(
        rawInput
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    setNames(parsed);
    setWinner(null);
    setRotation(0);
  }

  function removeName(target: string) {
    setNames((prev) => prev.filter((n) => n !== target));
    setWinner(null);
  }

  function spin() {
    if (spinning || names.length < 2) return;

    const winnerIndex = Math.floor(Math.random() * names.length);
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.7;
    const targetAngle = winnerIndex * segmentAngle + segmentAngle / 2 + jitter;

    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (((360 - targetAngle) % 360) + 360) % 360;
    const deltaFromCurrent = ((desiredMod - currentMod) % 360 + 360) % 360;
    const extraSpins = (6 + Math.floor(Math.random() * 3)) * 360;

    pendingWinnerRef.current = names[winnerIndex];
    setWinner(null);
    setSpinning(true);
    setRotation((prev) => prev + extraSpins + deltaFromCurrent);
  }

  function handleTransitionEnd() {
    if (!spinning) return;
    setSpinning(false);
    setWinner(pendingWinnerRef.current);
    pendingWinnerRef.current = null;
  }

  const radius = WHEEL_SIZE / 2;
  const innerRadius = radius - RIM;
  const dotRadius = radius - RIM / 2;

  return (
    <div className="flex min-h-dvh flex-col items-center gap-10 bg-gradient-to-b from-amber-50 via-rose-50 to-sky-50 px-6 py-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        🎡 抽獎轉盤
      </h1>

      <div className="flex w-full max-w-4xl flex-col items-center gap-10 md:flex-row md:items-start md:justify-center">
        {/* 名單管理 */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            輸入名單（每行一個，或用逗號分隔）
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={6}
            placeholder={"小豬\n大胖\n小美"}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={applyNames}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            套用名單
          </button>

          {names.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {names.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {name}
                  <button
                    onClick={() => removeName(name)}
                    aria-label={`移除 ${name}`}
                    className="text-zinc-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            目前共 {names.length} 人
          </p>
        </div>

        {/* 轉盤 */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
          <div
            className="relative"
            style={{ width: WHEEL_SIZE, height: WHEEL_SIZE + 56 }}
          >
            {/* 木製底座 */}
            <div className="absolute bottom-0 left-1/2 h-5 w-32 -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-amber-700 to-amber-950 shadow-lg" />
            <div className="absolute bottom-3 left-1/2 h-12 w-6 -translate-x-1/2 rounded-sm bg-gradient-to-b from-amber-500 to-amber-800" />

            <div
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
            >
              {/* 指針 */}
              <div
                className="pointer-wiggle absolute left-1/2 top-[-18px] z-20 -translate-x-1/2 drop-shadow-md"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "15px solid transparent",
                  borderRight: "15px solid transparent",
                  borderTop: "26px solid #dc2626",
                }}
              >
                <div className="absolute -top-[30px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-400 ring-2 ring-amber-600" />
              </div>

              {/* 會轉動的輪盤本體（含外框、燈泡、色塊） */}
              <div
                onTransitionEnd={handleTransitionEnd}
                className="absolute inset-0 rounded-full shadow-2xl"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #fde68a, #d97706 55%, #92400e 100%)",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.67, 0.14, 1)`
                    : "none",
                }}
              >
                {/* 燈泡裝飾 */}
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                  const angle = (360 / DOT_COUNT) * i;
                  return (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 h-[9px] w-[9px] rounded-full bg-amber-50 shadow-inner ring-1 ring-amber-800/50"
                      style={{
                        marginLeft: -4.5,
                        marginTop: -4.5,
                        transform: `rotate(${angle}deg) translate(0, -${dotRadius}px)`,
                      }}
                    />
                  );
                })}

                {/* 色塊圓盤 */}
                <div
                  className="absolute rounded-full"
                  style={{ inset: RIM, background: wheelBackground }}
                >
                  {names.map((name, i) => {
                    const mid = i * segmentAngle + segmentAngle / 2;
                    const flip = mid > 180 && mid < 360;
                    return (
                      <div
                        key={name}
                        className="absolute origin-left whitespace-nowrap text-xs font-bold text-white drop-shadow"
                        style={{
                          left: innerRadius,
                          top: innerRadius,
                          width: innerRadius - 16,
                          transform: `rotate(${mid - 90}deg)`,
                        }}
                      >
                        <span
                          className="absolute right-1 -translate-y-1/2"
                          style={{
                            transform: flip ? "rotate(180deg)" : undefined,
                          }}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                  {names.length === 0 && (
                    <div className="flex h-full w-full items-center justify-center text-center text-sm text-zinc-500">
                      請先輸入名單
                    </div>
                  )}
                </div>

                {/* 中心軸 */}
                <div
                  className="absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-amber-900/30"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, #fef3c7, #d97706 70%, #92400e 100%)",
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/60" />
                </div>
              </div>
            </div>
          </div>
          <BunnyMascot wheelSize={WHEEL_SIZE} />
          </div>

          <button
            onClick={spin}
            disabled={spinning || names.length < 2}
            className="rounded-full bg-gradient-to-b from-red-500 to-red-700 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:from-zinc-400 disabled:to-zinc-500 disabled:hover:scale-100"
          >
            {spinning ? "抽獎中…" : "🎯 開始抽獎"}
          </button>

          {names.length > 0 && names.length < 2 && (
            <p className="text-xs text-zinc-500">至少需要 2 個名字才能抽獎</p>
          )}

          {winner && !spinning && (
            <p className="winner-pop rounded-full bg-white px-6 py-3 text-xl font-bold text-zinc-900 shadow-lg dark:bg-zinc-800 dark:text-zinc-50">
              🎉 恭喜 <span className="text-red-600">{winner}</span> 中獎！
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BunnyMascot({ wheelSize }: { wheelSize: number }) {
  return (
    <svg
      viewBox="0 0 140 170"
      className="pointer-events-none absolute z-20"
      style={{
        width: 128,
        height: 156,
        right: -78,
        top: wheelSize * 0.32,
      }}
    >
      {/* 耳朵 */}
      <ellipse cx="52" cy="34" rx="13" ry="40" fill="#3f2a1d" transform="rotate(-16 52 34)" />
      <ellipse cx="52" cy="36" rx="6" ry="28" fill="#f4a6c1" transform="rotate(-16 52 34)" />
      <ellipse cx="92" cy="34" rx="13" ry="40" fill="#3f2a1d" transform="rotate(16 92 34)" />
      <ellipse cx="92" cy="36" rx="6" ry="28" fill="#f4a6c1" transform="rotate(16 92 34)" />

      {/* 頭 */}
      <circle cx="72" cy="92" r="46" fill="#3f2a1d" />
      {/* 口鼻 */}
      <ellipse cx="72" cy="106" rx="28" ry="22" fill="#f5e6d3" />
      {/* 腮紅 */}
      <circle cx="46" cy="100" r="6" fill="#f4a6c1" opacity="0.75" />
      <circle cx="98" cy="100" r="6" fill="#f4a6c1" opacity="0.75" />
      {/* 眼睛 */}
      <circle cx="58" cy="86" r="5.5" fill="#1a1310" />
      <circle cx="86" cy="86" r="5.5" fill="#1a1310" />
      <circle cx="60" cy="83.5" r="1.8" fill="#fff" />
      <circle cx="88" cy="83.5" r="1.8" fill="#fff" />
      {/* 鼻子 */}
      <ellipse cx="72" cy="100" rx="4.5" ry="3" fill="#7a4a3a" />

      {/* 撥動轉盤的手 */}
      <g className="pointer-wiggle" style={{ transformOrigin: "40px 130px" }}>
        <ellipse cx="18" cy="140" rx="15" ry="11" fill="#3f2a1d" transform="rotate(-18 18 140)" />
      </g>
    </svg>
  );
}
