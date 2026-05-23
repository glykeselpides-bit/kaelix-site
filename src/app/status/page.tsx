import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
            Docs
          </p>

          <h1 className="mt-5 text-5xl font-bold md:text-6xl">
            Documentation is coming soon.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Kaelix documentation, setup guides, integrations,
            onboarding tutorials, and command references will live here.
          </p>

          <a
            href="https://discord.gg/2PYbjwmHRX"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:scale-[1.03] hover:bg-blue-500"
          >
            Join Community
          </a>
        </section>
      </div>
    </main>
  );
}