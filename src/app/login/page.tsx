import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginButton from "@/components/LoginButton";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
            Login
          </p>

          <h1 className="mt-5 text-5xl font-black">
            Manage Kaelix with Discord.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Log in with Discord to manage your servers, configure Kaelix
            settings, and access dashboard tools.
          </p>

          <LoginButton />

        </section>
      </main>

      <Footer />
    </>
  );
}