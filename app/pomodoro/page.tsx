"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "work" | "shortBreak" | "longBreak";

const LONG_BREAK_INTERVAL = 4;
const RING_SIZE = 280;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MODE_LABEL: Record<Mode, string> = {
  work: "專注",
  shortBreak: "短休息",
  longBreak: "長休息",
};

const MODE_COLOR: Record<Mode, string> = {
  work: "#ef4444",
  shortBreak: "#10b981",
  longBreak: "#3b82f6",
};

type Durations = Record<Mode, number>; // minutes

const DEFAULT_DURATIONS: Durations = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.35].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.32);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    // Web Audio unavailable — fail silently
  }
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PomodoroPage() {
  const [durations, setDurations] = useState<Durations>(DEFAULT_DURATIONS);
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Kept in sync every render so the interval callback below always sees
  // the latest values without needing to restart the interval.
  const modeRef = useRef(mode);
  const durationsRef = useRef(durations);
  const completedCountRef = useRef(completedCount);
  useEffect(() => {
    modeRef.current = mode;
    durationsRef.current = durations;
    completedCountRef.current = completedCount;
  });

  // Countdown loop; phase transitions are handled inside the interval
  // callback so state updates happen in response to the external clock
  // tick rather than synchronously in the effect body.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        setIsRunning(false);
        playChime();

        if (modeRef.current === "work") {
          const nextCount = completedCountRef.current + 1;
          setCompletedCount(nextCount);
          const nextMode: Mode =
            nextCount % LONG_BREAK_INTERVAL === 0 ? "longBreak" : "shortBreak";
          setMode(nextMode);
          return durationsRef.current[nextMode] * 60;
        }

        setMode("work");
        return durationsRef.current.work * 60;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Reflect remaining time in the browser tab title.
  useEffect(() => {
    document.title = isRunning
      ? `${formatTime(timeLeft)} · ${MODE_LABEL[mode]} - 番茄鐘`
      : "番茄鐘";
  }, [timeLeft, isRunning, mode]);

  function switchMode(next: Mode) {
    setIsRunning(false);
    setMode(next);
    setTimeLeft(durations[next] * 60);
  }

  function reset() {
    setIsRunning(false);
    setTimeLeft(durations[mode] * 60);
  }

  function updateDuration(key: Mode, minutes: number) {
    const clamped = Math.min(120, Math.max(1, minutes));
    setDurations((prev) => ({ ...prev, [key]: clamped }));
    if (mode === key && !isRunning) {
      setTimeLeft(clamped * 60);
    }
  }

  const totalSeconds = durations[mode] * 60;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const dashoffset = CIRCUMFERENCE * (1 - progress);
  const cycleFilled =
    completedCount === 0
      ? 0
      : ((completedCount - 1) % LONG_BREAK_INTERVAL) + 1;

  return (
    <div className="flex min-h-dvh flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        🍅 番茄鐘
      </h1>

      {/* 模式切換 */}
      <div className="flex gap-2 rounded-full bg-zinc-200 p-1 dark:bg-zinc-800">
        {(["work", "shortBreak", "longBreak"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* 圓形計時器 */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth={STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={MODE_COLOR[mode]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {MODE_LABEL[mode]}
          </span>
        </div>
      </div>

      {/* 控制按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="rounded-full px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: MODE_COLOR[mode] }}
        >
          {isRunning ? "暫停" : timeLeft === totalSeconds ? "開始" : "繼續"}
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          重設
        </button>
      </div>

      {/* 番茄鐘進度點 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {Array.from({ length: LONG_BREAK_INTERVAL }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${
                i < cycleFilled ? "bg-red-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          已完成 {completedCount} 個番茄鐘
        </p>
      </div>

      {/* 設定 */}
      <div className="w-full max-w-xs">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="mx-auto flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ⚙️ 時間設定
        </button>
        {showSettings && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {(["work", "shortBreak", "longBreak"] as Mode[]).map((m) => (
              <label
                key={m}
                className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300"
              >
                {MODE_LABEL[m]}（分鐘）
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durations[m]}
                  onChange={(e) =>
                    updateDuration(m, Number(e.target.value) || 1)
                  }
                  className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-right text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
