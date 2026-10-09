import Link from "next/link";

type Tool = {
  href: string;
  emoji: string;
  name: string;
  description: string;
  accent: string;
  glow: string;
};

const TOOLS: Tool[] = [
  {
    href: "/lottery",
    emoji: "🎡",
    name: "抽獎轉盤",
    description: "輸入名單、轉動繽紛轉盤,公平又有趣地抽出幸運兒。",
    accent: "from-red-500 to-orange-500",
    glow: "bg-red-400/30",
  },
  {
    href: "/pomodoro",
    emoji: "🍅",
    name: "番茄鐘",
    description: "專注與休息循環搭配倒數圓環,幫你維持穩定的工作節奏。",
    accent: "from-emerald-500 to-teal-500",
    glow: "bg-emerald-400/30",
  },
  {
    href: "/fortune",
    emoji: "🎋",
    name: "好運抽籤",
    description: "每天抽一支籤,看看今日的愛情、事業、財運與健康運勢。",
    accent: "from-amber-500 to-orange-600",
    glow: "bg-amber-400/30",
  },
  {
    href: "/tetris",
    emoji: "🧱",
    name: "俄羅斯方塊",
    description: "經典方塊消除小遊戲,支援鍵盤與觸控操作,挑戰你的最高分。",
    accent: "from-violet-500 to-indigo-500",
    glow: "bg-violet-400/30",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            🧰 Chu 的小工具箱
          </span>
          <a
            href="#tools"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            瀏覽工具
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-red-300/30 blur-3xl dark:bg-red-500/10" />
          <div className="pointer-events-none absolute top-6 right-[15%] h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10" />
          <div className="pointer-events-none absolute top-52 left-[45%] h-72 w-72 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />

          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
            <span className="rounded-full bg-zinc-900/5 px-4 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-900/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
              ✨ 好玩又實用的網頁小工具集
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
              歡迎來到{" "}
              <span className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                Chu 的小工具箱
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              收錄生活與工作中派得上用場的小工具——抽獎、專注、算今日運勢,
              通通不用安裝,打開網頁就能用。
            </p>
            <a
              href="#tools"
              className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900"
            >
              查看所有工具 ↓
            </a>
          </div>
        </section>

        {/* Tools */}
        <section id="tools" className="mx-auto w-full max-w-5xl px-6 pb-28">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
              🔧 目前收錄的工具
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              持續新增中,共 {TOOLS.length} 個小工具
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${tool.glow} blur-2xl transition-opacity group-hover:opacity-80`}
                />
                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-3xl shadow-md`}
                >
                  {tool.emoji}
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {tool.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {tool.description}
                  </p>
                </div>
                <span className="relative mt-auto flex items-center gap-1 text-sm font-semibold text-zinc-900 transition-transform group-hover:translate-x-1 dark:text-zinc-50">
                  前往使用 →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/70 bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-6 py-8 text-center text-sm text-zinc-500 sm:flex-row sm:justify-between sm:text-left dark:text-zinc-400">
          <span>🧰 Chu 的小工具箱・持續新增好玩又實用的小工具</span>
          <span>Built with Next.js + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}
