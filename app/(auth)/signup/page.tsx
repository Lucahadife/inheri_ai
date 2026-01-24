import Link from "next/link";

import { signup } from "../actions";

type SignupPageProps = {
  searchParams?: { error?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          FairSplit AI
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Start an estate and invite heirs in minutes.
        </p>
      </div>

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </div>
      ) : null}

      <form className="flex flex-col gap-4" action={signup}>
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
          Sign up
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        Already have an account?{" "}
        <Link className="font-semibold text-zinc-900" href="/login">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}
