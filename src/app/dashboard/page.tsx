import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import DashboardGate from "@/components/DashboardGate";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
            Dashboard
          </p>

          <h1 className="mt-5 text-4xl font-bold sm:text-5xl md:text-6xl">
            Your Kaelix dashboard.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Log in with Discord to manage your servers: settings, activities,
            factions, AutoMod, welcome messages, leveling, Autopilot, alerts
            and insights.
          </p>

          <DashboardGate />
        </section>
      </div>
     <Footer />
   </main>
  );
}