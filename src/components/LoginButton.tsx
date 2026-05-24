"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
      className="mt-10 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-500"
    >
      Log in with Discord
    </button>
  );
}