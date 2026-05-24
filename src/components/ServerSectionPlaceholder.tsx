export default async function ServerSectionPlaceholder({
  params,
  title,
  description,
}: {
  params: Promise<{ guildId: string }>;
  title: string;
  description: string;
}) {
  const { guildId } = await params;

  return (
    <>
      <h1 className="text-5xl font-bold md:text-6xl">{title}</h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
        {description}
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400">
        Server ID: <span className="text-slate-200">{guildId}</span>
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <p className="text-slate-300">
          This dashboard section is coming soon.
        </p>
      </div>
    </>
  );
}
