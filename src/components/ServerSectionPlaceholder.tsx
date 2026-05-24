import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

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
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto max-w-5xl px-6 pb-24 pt-36">
          <Link
            href={`/servers/${guildId}`}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300 hover:text-blue-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-8 text-5xl font-bold md:text-6xl">{title}</h1>

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
        </section>
      </div>

      <Footer />
    </main>
  );
}