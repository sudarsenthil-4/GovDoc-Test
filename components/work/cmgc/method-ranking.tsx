import type { MultiMethodResult } from "@/lib/usecases/cmgc-pde/types";

type Props = { multiMethod: MultiMethodResult };

export function MethodRanking({ multiMethod }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <h3 className="text-base font-semibold text-[var(--color-ink)]">Method ranking</h3>
      <div className="overflow-x-auto rounded-md border border-[var(--color-line)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-cream-soft)] text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)]">
            <tr>
              <th className="text-left p-2 w-10">#</th>
              <th className="text-left p-2">Method</th>
              <th className="text-right p-2 w-28">Score</th>
              <th className="text-left p-2 w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {multiMethod.method_scores.map((m) => (
              <tr
                key={m.method}
                data-testid={`method-row-${m.method}`}
                className={`border-t border-[var(--color-line)] align-top ${m.blocked ? "opacity-60" : ""}`}
              >
                <td className="p-2 font-mono">#{m.rank}</td>
                <td className="p-2">
                  <div className="font-medium text-[var(--color-ink)]">{m.method}</div>
                  {m.key_factors_reasoning && (
                    <p className="mt-1 text-xs text-[var(--color-ink-mute)]">
                      {m.key_factors_reasoning}
                    </p>
                  )}
                  {m.key_factors.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.key_factors.map((kf, i) => (
                        <span
                          key={i}
                          className="rounded border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-1.5 py-0.5 text-[11px] text-[var(--color-ink-mute)]"
                        >
                          {kf}
                        </span>
                      ))}
                    </div>
                  )}
                  {(m.pros.length > 0 || m.cons.length > 0) && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]">
                        Pros / Cons
                      </summary>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {m.pros.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                              Pros
                            </h4>
                            <ul className="list-disc pl-5 text-[var(--color-ink-soft)]">
                              {m.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                        {m.cons.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                              Cons
                            </h4>
                            <ul className="list-disc pl-5 text-[var(--color-ink-soft)]">
                              {m.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                  {m.block_reasons.length > 0 && (
                    <ul className="mt-1.5 list-disc pl-5 text-xs text-destructive/80">
                      {m.block_reasons.map((br, i) => <li key={i}>{br}</li>)}
                    </ul>
                  )}
                </td>
                <td className="p-2 text-right font-medium">{m.score.toFixed(4)}</td>
                <td className="p-2">
                  {m.blocked ? (
                    <span
                      data-testid={`blocked-${m.method}`}
                      className="rounded border border-destructive/30 bg-destructive/5 px-1.5 py-0.5 text-[11px] font-medium text-destructive"
                    >
                      Blocked
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--color-ink-mute)]">Eligible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
