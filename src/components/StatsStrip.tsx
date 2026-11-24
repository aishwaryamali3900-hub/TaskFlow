interface StatsStripProps {
  total: number;
  completed: number;
  pending: number;
}

export function StatsStrip({ total, completed, pending }: StatsStripProps) {
  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section
      aria-label="Task statistics"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">Total Tasks</div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {total}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {completionRate}% done
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">Pending Tasks</div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-3xl font-bold text-amber-600 font-mono tabular-nums">
            {pending}
          </div>
          <div className="text-xs text-slate-500">Active queue</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500">
          Completed Tasks
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="text-3xl font-bold text-emerald-600 font-mono tabular-nums">
            {completed}
          </div>
          <div className="text-xs text-slate-500">Finished</div>
        </div>
      </div>
    </section>
  );
}
