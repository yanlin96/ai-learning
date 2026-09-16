"use client";

import { ArrowRight, LogOut } from "lucide-react";
import { signIn, signOut } from "next-auth/react";

export function TrainSignInButton() {
  return (
    <button
      className="train-auth-button primary"
      type="button"
      onClick={() => void signIn("okta", { callbackUrl: "/disruptions" })}
    >
      <span>Sign in or create an account</span><ArrowRight size={17} />
    </button>
  );
}

export function TrainAccount({ name, email }: { name?: string | null; email?: string | null }) {
  const label = name || email || "Signed-in user";
  return (
    <div className="train-account">
      <span aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
      <div><small>SIGNED IN</small><strong>{label}</strong></div>
      <button type="button" onClick={() => void signOut({ callbackUrl: "/login?signedOut=1" })}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
