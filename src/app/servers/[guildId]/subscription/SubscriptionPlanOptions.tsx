"use client";

import Link from "next/link";
import { useMemo } from "react";

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
    features: [
      "Activity configuration",
      "Onboarding controls",
      "Server logs",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "GBP 18.99/mo",
    summary: "More room for advanced community operations.",
    features: [
      "Expanded analytics",
      "Priority setup options",
      "More automation",
    ],
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

  const currentIndex = PLAN_OPTIONS.findIndex(
    (plan) => plan.id === currentPlanId
  );

  const nextIndex = PLAN_OPTIONS.findIndex(
    (plan) => plan.id === planId
  );

  return nextIndex > currentIndex
    ? `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`
    : "Select plan";
}

export default function SubscriptionPlanOptions({
  currentPlan,
  guildId,
}: {
  currentPlan: string;
  guildId: string;
}) {
  const currentPlanId = useMemo(
    () => normalizePlanId(currentPlan),
    [currentPlan]
  );

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            Plan Options
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white">
            Choose a Kaelix tier
          </h2>
        </div>

        <Link
          href={`/checkout?guildId=${guildId}`}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
        >
          Manage plan
        </Link>
      </div>

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
                  <h3 className="text-xl font-bold text-white">
                    {plan.name}
                  </h3>

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

              {isCurrent ? (
                <button
                  disabled
                  className="mt-6 cursor-not-allowed rounded-2xl bg-slate-700 px-5 py-3 text-sm font-bold text-slate-300"
                >
                  Current plan
                </button>
              ) : (
                <Link
                  href={`/checkout?guildId=${guildId}&plan=${plan.id}`}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400"
                >
                  {getButtonLabel(currentPlanId, plan.id)}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}