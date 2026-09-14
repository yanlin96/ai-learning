import { ShieldCheck, TrainFront } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { TrainSignInButton } from "@/app/train-auth-controls";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TrainLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = isOktaConfigured ? await getServerSession(authOptions) : null;
  if (session) redirect("/disruptions");

  return (
    <main>
      <SiteHeader />
      <section className="train-login shell">
        <div className="train-login-visual">
          <span><TrainFront size={32} /></span>
          <p>Melbourne train status</p>
        </div>
        <div className="train-login-card">
          <span className="login-shield"><ShieldCheck size={24} /></span>
          <p className="eyebrow">SECURE ACCESS</p>
          <h1>Sign in to check<br />your train line.</h1>
          <p>Train status is available to signed-in users. Authentication is handled securely by Okta; this website never receives your password.</p>
          {error ? <p className="auth-login-error" role="alert">Okta sign-in did not finish. Please try again or contact your Okta administrator.</p> : null}
          {isOktaConfigured ? (
            <TrainSignInButton />
          ) : (
            <div className="auth-setup-note" role="status">
              <strong>Okta setup is not complete yet.</strong>
              <span>Add the required authentication environment variables listed in <code>.env.example</code>, then restart the app.</span>
            </div>
          )}
          <a href="/">Back to Website Audit</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
