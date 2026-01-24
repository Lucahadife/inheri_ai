export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_50%),radial-gradient(circle_at_20%_20%,_rgba(99,102,241,0.25),_transparent_40%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.2),_transparent_45%)]" />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-20">
        <header className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            FairSplit AI
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Turn inheritance conflict into aligned, explainable decisions.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            A collaborative estate workspace that blends market value, emotional
            priorities, and AI‑mediated resolution to help families agree fast.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/20"
              href="/signup?role=executor&next=/setup"
            >
              I’m the executor / planner
            </a>
            <a
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white"
              href="/signup?role=heir&next=/setup"
            >
              We’re heirs organizing the estate
            </a>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Explainable fairness",
              body: "Rules are explicit. AI explains every valuation, trade, and fairness score.",
            },
            {
              title: "Shared visibility",
              body: "Heirs collaborate in real time with preference carts and transparent analytics.",
            },
            {
              title: "Dispute reduction",
              body: "AI proposes swaps and compromise paths based on your agreed rules.",
            },
          ].map((card) => (
            <div
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/50 backdrop-blur"
              key={card.title}
            >
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-white/70">{card.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">
            Built for the moments that matter
          </h2>
          <div className="grid gap-4 text-sm text-white/70 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              AI valuation + document intelligence
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Emotional scoring and scenario carts
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Fairness analytics with acceptance probability
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Dispute mediation and swap proposals
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
