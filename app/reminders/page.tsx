import { BellRing } from "lucide-react";
import { ReminderManager } from "@/app/reminder-manager";
import { SecretGate } from "@/app/secret-gate";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { listSubscriptions } from "@/lib/subscriptions";
import { getTrainLines } from "@/lib/train-lines";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const [subscriptions, trainLines] = await Promise.all([
    listSubscriptions(),
    getTrainLines(),
  ]);

  return (
    <main>
      <SiteHeader />
      <SecretGate>
        <section className="page-intro shell">
          <span className="page-icon"><BellRing size={22} /></span>
          <div>
            <p className="eyebrow">REMINDER SETTINGS</p>
            <h1>Make every line<br /><em>yours.</em></h1>
            <p>Search Melbourne&apos;s official train catalog and choose one daily check-in time for every line you care about.</p>
          </div>
        </section>
        <ReminderManager initialSubscriptions={subscriptions} lines={trainLines} />
      </SecretGate>
      <SiteFooter />
    </main>
  );
}
