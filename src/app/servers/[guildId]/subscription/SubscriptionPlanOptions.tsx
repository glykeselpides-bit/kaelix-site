"use client";

import { useMemo, useState } from "react";

type PlanOption = {
  id: string;
  name: string;
  price: string;
  summary: string;
  features: string[];
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "free",
    name: "Free",
    price: "GBP 0/mo",
    summary: "Basic Kaelix access for getting a server started.",
    features: ["Core dashboard access", "Starter activity tools"],
  },
  {
    id: "core",
    name: "Core",
    price: "GBP 4.99/mo",
    summary: "Useful defaults for active communities.",
    features: ["Activity configuration", "Onboarding controls", "Server logs"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "GBP 18.99/mo",
    summary: "More room for advanced community operations.",
    features: ["Expanded analytics", "Priority setup options", "More automation"],
  },
];

function normalizePlanId(plan: string) {
  const normalized = plan.toLowerCase();

  if (normalized.includes("pro")) {
    return "pro";
  }

  if (normalized.includes("core")) {
    return "core";
  }

  return "free";
}

function getButtonLabel(currentPlanId: string, planId: string) {
  if (currentPlanId === planId) {
    return "Current plan";
  }

  const currentIndex = PLAN_OPTIONS.findIndex((plan) => plan.id === currentPlanId);
  const nextIndex = PLAN_OPTIONS.findIndex((plan) => plan.id === planId);

  return nextIndex > currentIndex ? "Upgrade" : "Select plan";
}

export default function SubscriptionPlanOptions({
  currentPlan,
}: {
  currentPlan: string;
}) {
  const currentPlanId = useMemo(() => normalizePlanId(currentPlan), [currentPlan]);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
          Plan Options
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white">
          Choose a Kaelix tier
        </h2>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm leading-6 text-blue-100">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_OPTIONS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;

          return (
            <article
              key={plan.id}
              className={`flex min-h-full flex-col rounded-2xl border p-5 ${
                isCurrent
                  ? "border-blue-300/50 bg-blue-400/10"
                  : "border-white/10 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {plan.summary}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-bold text-blue-200">
                  {plan.price}
                </span>
              </div>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => setNotice("Checkout is not connected yet.")}
                className={`mt-6 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  isCurrent
                    ? "cursor-not-allowed bg-slate-700 text-slate-300"
                    : "bg-blue-500 text-white hover:bg-blue-400"
                }`}
              >
                {getButtonLabel(currentPlanId, plan.id)}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
