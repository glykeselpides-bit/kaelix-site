import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginButton from "@/components/LoginButton";

// Auth.js sends failed logins here as /login?error=<type>.
function loginProblem(error: string | undefined) {
  if (!error) return null;
  if (error === "AccessDenied") {
    return {
      title: "The Discord login was cancelled.",
      body: "No problem. Log in again whenever you're ready.",
    };
  }
  return {
    title: "Your Discord login didn't finish.",
    body:
      "This usually happens when a login is started twice (a double-click, or two Kaelix tabs), or when your " +
      "phone switches to the Discord app and comes back in a different browser. Close any other Kaelix tabs and " +
      "try once more. On a phone, it helps to open joinkaelix.com in your main browser rather than inside Discord.",
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const problem = loginProblem(error);

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

          {problem ? (
            <div role="alert" className="mx-auto mt-10 max-w-2xl rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-left">
              <p className="font-semibold text-amber-100">{problem.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{problem.body}</p>
            </div>
          ) : null}

          <LoginButton label={problem ? "Try again" : "Log in with Discord"} />

        </section>
      </main>

      <Footer />
    </>
  );
}