import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function ServerDashboardPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-36">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
            Server Dashboard
          </p>

          <h1 className="mt-5 text-5xl font-bold md:text-6xl">
            Manage Server
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Kaelix dashboard connection successful.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-slate-400">
            Server ID: <span className="text-slate-200">{guildId}</span>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}