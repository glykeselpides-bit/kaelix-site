"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  { id: "core", name: "Core", price: 4.99 },
  { id: "pro", name: "Pro", price: 18.99 },
];

const addOns = [
  { id: "setup", name: "Premium Setup", price: 29.99 },
  { id: "analytics", name: "Advanced Analytics", price: 9.99 },
  { id: "automation", name: "Custom Automation", price: 14.99 },
  { id: "visuals", name: "Custom Visuals", price: 19.99 },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const startingPlan = searchParams.get("plan")?.toLowerCase() || "";

  const [selectedPlan, setSelectedPlan] = useState(startingPlan);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

  const selectedAddOnData = addOns.filter((addOn) =>
    selectedAddOns.includes(addOn.id)
  );

  const total = useMemo(() => {
    const planTotal = selectedPlanData?.price || 0;
    const addOnsTotal = selectedAddOnData.reduce(
      (sum, addOn) => sum + addOn.price,
      0
    );

    return planTotal + addOnsTotal;
  }, [selectedPlanData, selectedAddOnData]);

  function toggleAddOn(id: string) {
    setSelectedAddOns((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
          Checkout
        </p>

        <h1 className="mt-5 text-5xl font-black">Build your basket.</h1>

        <p className="mt-5 max-w-2xl text-slate-400">
          Choose one plan, add as many add-ons as you want, or purchase add-ons
          only.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold">Choose one plan</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() =>
                      setSelectedPlan(selectedPlan === plan.id ? "" : plan.id)
                    }
                    className={`rounded-3xl border p-6 text-left transition ${
                      selectedPlan === plan.id
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-blue-400/40"
                    }`}
                  >
                    <div className="text-xl font-bold">{plan.name}</div>
                    <div className="mt-3 text-2xl font-black text-blue-300">
                      £{plan.price}/mo
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold">Add-ons</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {addOns.map((addOn) => (
                  <button
                    key={addOn.id}
                    onClick={() => toggleAddOn(addOn.id)}
                    className={`rounded-3xl border p-6 text-left transition ${
                      selectedAddOns.includes(addOn.id)
                        ? "border-blue-400 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-blue-400/40"
                    }`}
                  >
                    <div className="text-lg font-bold">{addOn.name}</div>
                    <div className="mt-3 text-xl font-black text-blue-300">
                      £{addOn.price}/mo
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold">Basket</h2>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              {selectedPlanData && (
                <div className="flex justify-between gap-4">
                  <span>{selectedPlanData.name}</span>
                  <span>£{selectedPlanData.price}/mo</span>
                </div>
              )}

              {selectedAddOnData.map((addOn) => (
                <div key={addOn.id} className="flex justify-between gap-4">
                  <span>{addOn.name}</span>
                  <span>£{addOn.price}/mo</span>
                </div>
              ))}

              {!selectedPlanData && selectedAddOnData.length === 0 && (
                <p className="text-slate-500">Nothing selected yet.</p>
              )}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>£{total.toFixed(2)}/mo</span>
              </div>
            </div>

            <button className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-500">
              Continue to Payment
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />

      <Suspense fallback={null}>
        <CheckoutContent />
      </Suspense>

      <Footer />
    </>
  );
}