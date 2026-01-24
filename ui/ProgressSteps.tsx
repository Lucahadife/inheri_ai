type Step = {
  title: string;
  status: "complete" | "incomplete";
  description?: string;
};

type ProgressStepsProps = {
  steps: Step[];
};

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="grid gap-3">
      {steps.map((step) => (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            step.status === "complete"
              ? "border-emerald-400/30 bg-emerald-500/10"
              : "border-white/10 bg-white/5"
          }`}
          key={step.title}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white">{step.title}</span>
            <span className="text-xs uppercase tracking-wide text-white/60">
              {step.status === "complete" ? "Complete" : "Next"}
            </span>
          </div>
          {step.description ? (
            <p className="mt-2 text-xs text-white/60">{step.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
