import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Free",
    price: "£0",
    description: "Perfect for smaller communities getting started with Kaelix.",
    features: [
      "Up to 60 server members",
      "10 events/month",
      "3 active activities",
      "1 preset Kaelix faction pack",
      "Server notifications only",
    ],
    activities: "Riddle, Would You Rather, True or False",
    button: "Start Free",
    highlight: false,
  },
  {
    name: "Core",
    price: "£4.99/mo",
    description: "Built for active growing communities that need structure and engagement.",
    features: [
      "Up to 200 server members",
      "30 events/month",
      "8 active activities",
      "Custom factions up to 4",
      "DM notifications",
      "Weekly server summary",
      "Achievement & activity alerts",
    ],
    activities:
      "Quiz, Cipher, Hidden Word, Story Chain, Caption This",
    button: "Upgrade to Core",
    highlight: true,
  },
  {
    name: "Pro",
    price: "£18.99/mo",
    description: "Advanced systems for larger and highly active communities.",
    features: [
      "Up to 1,000 server members",
      "100 events/month",
      "16 active activities",
      "Full activity library",
      "Faction activity battles",
      "Analytics & progression systems",
      "Expanded faction systems",
    ],
    activities: "All Activities Included",
    button: "Go Pro",
    highlight: false,
  },
  {
    name: "Elite",
    price: "£48.99+/mo",
    description: "Enterprise-grade infrastructure for massive communities and networks.",
    features: [
      "Unlimited server members",
      "Unlimited events",
      "Unlimited/custom factions",
      "Custom systems & integrations",
      "Priority/direct support",
      "Custom branding",
      "Full custom activity shop",
    ],
    activities: "Everything Included",
    button: "Contact Kaelix",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black bg-[url('/banner2.png')] bg-cover bg-center text-white">
      <div className="min-h-screen bg-black/70">
        <Navbar />

        <section className="mx-auto max-w-6xl px-6 pb-24 pt-36">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-blue-300">
              Pricing
            </p>

            <h1 className="mt-5 text-4xl font-bold md:text-5xl">
              Built for every community stage.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              From smaller friend groups to massive structured communities,
              Kaelix scales with your server.
            </p>
          </div>

          <div className="mt-20 grid gap-8 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[32px] border p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-blue-400/40 ${
                  plan.highlight
                    ? "border-blue-400/50 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.12)]"
                    : "border-white/10 bg-black/50"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute right-6 top-6 rounded-full border border-blue-400/40 bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Most Popular
                  </div>
                )}

                <h2 className="text-3xl font-bold">{plan.name}</h2>

                <div className="mt-4 text-4xl font-bold text-white">
                  {plan.price}
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {plan.description}
                </p>

                <div className="mt-8">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
                    Included
                  </p>

                  <ul className="space-y-3 text-sm text-slate-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="text-blue-400">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
                    Activities
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {plan.activities}
                  </p>
                </div>

                <button
                  className={`mt-auto rounded-2xl px-6 py-4 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-white/15 bg-white/5 text-white hover:border-blue-400 hover:bg-blue-500/10"
                  }`}
                >
                  {plan.button}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}