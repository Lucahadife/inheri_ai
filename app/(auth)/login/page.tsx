import Link from "next/link";

import { login } from "../actions";

type LoginPageProps = {
  searchParams?:
    | { error?: string; notice?: string; next?: string }
    | Promise<{ error?: string; notice?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          FairSplit AI
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Log in</h1>
        <p className="mt-2 text-sm text-white/60">
          Access your estates and allocation scenarios.
        </p>
      </div>

      {resolvedSearchParams?.notice ? (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {resolvedSearchParams.notice}
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <form className="flex flex-col gap-4" action={login}>
        <input type="hidden" name="next" value={resolvedSearchParams?.next} />
        <label className="text-sm text-white/70">
          Email
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="text-sm text-white/70">
          Password
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            name="password"
            type="password"
            required
          />
        </label>
        <button
          className="mt-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
          type="submit"
        >
          Log in
        </button>
      </form>

      <p className="text-sm text-white/60">
        New here?{" "}
        <Link className="font-semibold text-white" href="/signup">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
