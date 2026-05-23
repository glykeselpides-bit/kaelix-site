"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const planData: Record<string, { name: string; price: string }> = {
  free: { name: "Free", price: "£0" },
  core: { name: "Core", price: "£4.99/mo" },
  pro: { name: "Pro", price: "£18.99/mo" },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan")?.toLowerCase() || "free";
  const plan = planData[selectedPlan] || planData.free;

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
            Checkout
          </p>

          <h1 className="mt-5 text-5xl font-black">{plan.name}</h1>

          <div className="mt-4 text-3xl font-bold text-blue-300">
            {plan.price}
          </div>

          <p className="mt-6 text-slate-400">
            Stripe integration and subscription management will be connected here soon.
          </p>

          <button className="mt-10 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-500">
            Continue to Payment
          </button>
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