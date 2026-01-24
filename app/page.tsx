export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <main className="w-full max-w-3xl px-6 py-24">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                FairSplit AI
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight">
                Fair, explainable inheritance planning.
              </h1>
            </div>
            <p className="text-lg text-zinc-600">
              Combine market value estimates with heir emotional preferences to
              generate allocation plans that are transparent and balanced.
            </p>
            <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 px-4 py-3">
                Estates, assets, and member roles
              </div>
              <div className="rounded-2xl border border-zinc-200 px-4 py-3">
                Preferences, scenarios, and fairness tables
              </div>
              <div className="rounded-2xl border border-zinc-200 px-4 py-3">
                Explainable allocation engine
              </div>
              <div className="rounded-2xl border border-zinc-200 px-4 py-3">
                AI helpers with validated outputs
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                href="/signup"
              >
                Create account
              </a>
              <a
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
                href="/login"
              >
                Log in
              </a>
            </div>
            <p className="text-sm text-zinc-500">
              v1 is in active development. See `docs/overview.md` for the full
              scope.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
