import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BOT_INVITE_URL,
  DISCORD_STORE_URL,
  planStoreUrl,
  toBuyablePlan,
} from "@/lib/discordStore";

/**
 * Where every "Choose plan" / "Upgrade" button lands. Kaelix is sold through
 * Discord only, so this page sends people to the Discord store and explains
 * the in-server way to buy. No payment happens on this site.
 */

const plans = [
  {
    id: "core" as const,
    name: "Core",
    price: "£4.99/mo",
    summary: "For active, growing communities.",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "£18.99/mo",
    summary: "For larger, highly active communities.",
  },
];

const steps = [
  {
    title: "Add Kaelix to your server",
    body: "Skip this if Kaelix is already in your server.",
  },
  {
    title: "Run /settings",
    body: "In any channel of your server, as a server admin.",
  },
  {
    title: "Open Plan & Access",
    body: "It shows your server's current plan and the plans you can buy.",
  },
  {
    title: "Pick a plan and pay in Discord",
    body: "Discord handles the payment. Your server's plan unlocks automatically once it goes through.",
  },
];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; guildId?: string }>;
}) {
  const { plan, guildId } = await searchParams;
  const selected = toBuyablePlan(plan);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
            Upgrade
          </p>

          <h1 className="mt-5 text-4xl font-black md:text-5xl">
            Kaelix plans are bought through Discord.
          </h1>

          <p className="mt-5 max-w-2xl leading-7 text-slate-400">
            Payment, receipts and monthly renewals are all handled by Discord,
            and the plan is attached to the server you choose at checkout. Your
            server&apos;s plan unlocks automatically once the payment goes
            through.
          </p>

          <div className="mt-6 max-w-2xl rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-amber-100">
            <span className="font-semibold">Server admins only.</span> A plan
            applies to the whole server, so only its admins (members with the{" "}
            <span className="font-semibold">Manage Server</span> permission)
            can buy one. If you&apos;re not an admin, ask one of them to
            upgrade.
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-bold">Buy on the Discord store</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {plans.map((p) => {
                const highlighted = selected === p.id;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col rounded-3xl border p-6 ${
                      highlighted
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="text-xl font-bold">{p.name}</div>
                      <div className="text-xl font-black text-blue-300">
                        {p.price}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">{p.summary}</p>

                    <a
                      href={planStoreUrl(p.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 rounded-2xl px-6 py-3 text-center text-sm font-semibold transition ${
                        highlighted
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "border border-white/15 bg-white/5 text-white hover:border-blue-400 hover:bg-blue-500/10"
                      }`}
                    >
                      Buy {p.name} on Discord
                    </a>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {guildId
                ? "When Discord asks which server the plan is for, pick the server you came from. "
                : "Discord will ask which server the plan is for. "}
              The final price is shown at Discord checkout, in your local
              currency. You can also{" "}
              <a
                href={DISCORD_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline-offset-4 hover:underline"
              >
                browse the whole Kaelix store
              </a>
              .
            </p>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-bold">Or buy from inside your server</h2>

            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 text-sm font-bold text-blue-200">
                    {i + 1}
                  </span>

                  <div>
                    <div className="font-bold">{step.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {step.body}
                    </p>

                    {i === 0 && (
                      <a
                        href={BOT_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-blue-300 underline-offset-4 hover:underline"
                      >
                        Add Kaelix to Discord
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold">Changing or cancelling</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Subscriptions are managed in Discord, under User Settings →
                Subscriptions. If you cancel, your server keeps the plan until
                the end of the period you&apos;ve paid for.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold">Need Elite?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Elite is set up for each community individually.{" "}
                <a
                  href="mailto:hello@joinkaelix.com"
                  className="text-blue-300 underline-offset-4 hover:underline"
                >
                  Contact us
                </a>{" "}
                or see the full comparison on the{" "}
                <Link
                  href="/pricing"
                  className="text-blue-300 underline-offset-4 hover:underline"
                >
                  pricing page
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
