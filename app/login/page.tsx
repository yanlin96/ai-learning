import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isOktaConfigured } from "@/lib/auth";
import { workspaceCallback } from "@/lib/auth-routing";
import { WorkspaceSignInButton } from "@/app/workspace-sign-in-button";
export const metadata = { title: "Sign in | CPA Tools" };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const params = await searchParams;
  const callback = workspaceCallback(params.callbackUrl, process.env.NEXTAUTH_URL);
  if (isOktaConfigured && await getServerSession(authOptions)) redirect(callback);
  return <main className="!pl-0 grid min-h-screen place-items-center bg-[#071329] px-5 text-white">
    <section className="w-full max-w-sm rounded-2xl bg-white p-7 text-[#090d46] shadow-xl">
      <h1 className="m-0 text-2xl font-extrabold">{params.error ? "Sign-in did not finish" : "Connecting to Okta"}</h1>
      {params.error && <p role="alert" className="my-5 text-sm leading-6 text-red-900">Please try again or contact your Okta administrator.</p>}
      {isOktaConfigured ? <WorkspaceSignInButton callbackUrl={callback} autoStart={!params.error}/> : <p role="status" className="mt-5 text-sm leading-6 text-amber-900">Okta setup is not complete. Configure authentication environment variables and restart or redeploy. Workspace access remains locked.</p>}
      <noscript><p className="mt-4 text-sm">Enable JavaScript to start secure sign-in with Okta.</p></noscript>
    </section>
  </main>;
}
