import Link from "next/link";

/** Shown in place of a dashboard section the server's plan doesn't include. */
export default function PlanLockedNotice({
  guildId,
  feature,
  planName,
  children,
}: {
  guildId: string;
  feature: string;
  planName: string;
  children?: React.ReactNode;
}) {
  const plan = planName.toLowerCase() === "core" ? "core" : "pro";

  return (
    <div className="rounded-3xl border border-amber-300/20 bg-amber-300/5 p-6">
      <p className="font-bold text-amber-100">
        {"\u{1F512}"} {feature} is included from the {planName} plan.
      </p>
      {children ? <div className="mt-2 text-sm leading-6 text-slate-300">{children}</div> : null}
      <Link
        href={planName === "Elite" ? "/pricing" : `/checkout?guildId=${guildId}&plan=${plan}`}
        className="mt-5 inline-flex rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
      >
        See plans
      </Link>
    </div>
  );
}
