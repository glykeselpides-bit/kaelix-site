export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        
        <img
          src="/kx_Logo.png"
          alt="Kaelix Logo"
          className="mb-8 h-24 w-24 object-contain"
        />

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          The Premium
          <span className="text-purple-500"> Discord Community OS</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-400 md:text-xl">
          Events. Factions. Points. Activities. Automation.
          <br />
          Everything your community needs — in one system.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button className="rounded-2xl bg-purple-600 px-8 py-4 text-lg font-semibold transition hover:bg-purple-500">
            Add to Discord
          </button>

          <button className="rounded-2xl border border-white/20 px-8 py-4 text-lg font-semibold transition hover:border-purple-500 hover:text-purple-400">
            Join Waitlist
          </button>
        </div>
      </section>
    </main>
  );
}