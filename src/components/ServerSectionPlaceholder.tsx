import Link from "next/link";

export default async function ServerSectionPlaceholder({
  params,
  title,
  description,
  children,
}: {
  params: Promise<{ guildId: string }>;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const { guildId } = await params;

  return (
    <section>
      <Link
        href={`/servers/${guildId}`}
        className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300 hover:text-blue-200"
      >
        Back to Dashboard
      </Link>

      <h1 className="mt-8 text-5xl font-bold md:text-6xl">{title}</h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
        {description}
      </p>

      <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-500">
        <span>Server ID</span>
        <span className="truncate font-mono text-slate-400">{guildId}</span>
      </div>

      <div className="mt-8">
        {children ?? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <p className="text-slate-300">
              This dashboard section is coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
