import Link from "next/link";

type ScenariosPageProps = {
  params: { estateId: string };
};

export default function ScenariosPage({ params }: ScenariosPageProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-16 text-white">
      <h1 className="text-3xl font-semibold">Scenarios</h1>
      <p className="text-sm text-white/60">
        Scenario carts now live inside Preferences for a more cohesive flow.
      </p>
      <Link
        className="w-fit rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"
        href={`/estates/${params.estateId}/preferences`}
      >
        Go to preferences
      </Link>
    </div>
  );
}
