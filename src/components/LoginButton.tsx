"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Starts a Discord login once. Every login stores a one-time check in the browser; a second
 * click (or a second tab) replaces it, and the first login then fails with "Code challenge
 * failed". So after the first click the button stays disabled.
 */
export default function LoginButton({
  callbackUrl = "/dashboard",
  label = "Log in with Discord",
  className = "mt-10 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70",
}: {
  callbackUrl?: string;
  label?: string;
  className?: string;
}) {
  const [started, setStarted] = useState(false);

  return (
    <button
      type="button"
      disabled={started}
      onClick={() => {
        if (started) return;
        setStarted(true);
        void signIn("discord", { callbackUrl: callbackUrl === "current" ? window.location.href : callbackUrl });
      }}
      className={className}
    >
      {started ? "Opening Discord…" : label}
    </button>
  );
}
