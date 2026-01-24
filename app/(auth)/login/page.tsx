import Link from "next/link";

import { login } from "../actions";

type LoginPageProps = {
  searchParams?: { error?: string; notice?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          FairSplit AI
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Access your estates and allocation scenarios.
        </p>
      </div>

      {searchParams?.notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {searchParams.notice}
        </div>
      ) : null}

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </div>
      ) : null}

      <form className="flex flex-col gap-4" action={login}>
        <label className="text-sm font-medium text-zinc-700">
          Email
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Password
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm"
            name="password"
            type="password"
            required
          />
        </label>
        <button
          className="mt-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Log in
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        New here?{" "}
        <Link className="font-semibold text-zinc-900" href="/signup">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
