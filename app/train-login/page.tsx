import { ArrowLeft, CheckCircle2, Clock3, Route, ShieldCheck, TrainFront } from "lucide-react";
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
          <span className="train-login-mark"><TrainFront size={30} /></span>
          <p className="eyebrow">MELBOURNE COMMUTER TOOL</p>
          <h1>Know what changes before you leave.</h1>
          <p className="train-login-intro">A quick, read-only view of current disruptions and station notices across the metropolitan network.</p>
          <ul className="train-login-benefits">
            <li><Route size={18} /><span><strong>Every Metro line</strong><small>Search and switch lines in one place</small></span></li>
            <li><Clock3 size={18} /><span><strong>Current travel impact</strong><small>See useful changes without scanning long feeds</small></span></li>
            <li><CheckCircle2 size={18} /><span><strong>Read-only access</strong><small>Nothing is changed in Transport Victoria systems</small></span></li>
          </ul>
        </div>
        <div className="train-login-card">
          <span className="login-shield"><ShieldCheck size={24} /></span>
          <p className="eyebrow">CPA TOOLS ACCOUNT</p>
          <h2>Continue to train status</h2>
          <p className="train-login-card-copy">Sign in or create an account to view live train information. Authentication is handled securely by Okta.</p>
          {error ? <p className="auth-login-error" role="alert">Okta sign-in did not finish. Please try again or contact your Okta administrator.</p> : null}
          {isOktaConfigured ? (
            <TrainSignInButton />
          ) : (
            <div className="auth-setup-note" role="status">
              <strong>Okta setup is not complete yet.</strong>
              <span>Add the required authentication environment variables listed in <code>.env.example</code>, then restart the app.</span>
            </div>
          )}
          <div className="login-trust"><ShieldCheck size={17} /><span><strong>Protected by Okta</strong><small>CPA Tools never receives or stores your password.</small></span></div>
          <a className="login-back" href="/"><ArrowLeft size={15} /> Back to Website Audit</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
