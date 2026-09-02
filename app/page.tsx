import { AlertTriangle, ArrowUpRight, BellRing, CalendarDays, CheckCircle2, Clock3, TrainFront } from "lucide-react";
import { getWerribeeDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { SendAlertButton } from "@/app/send-alert-button";
import { listSubscriptions } from "@/lib/subscriptions";
import { SiteHeader } from "@/app/site-header";
import { SiteFooter } from "@/app/site-footer";

export const dynamic = "force-dynamic";

const melbourneTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

export default async function Home() {
  const subscriptions = await listSubscriptions();
  let disruptions = [] as Awaited<ReturnType<typeof getWerribeeDisruptions>>;
  let unavailable = false;

  try {
    disruptions = await getWerribeeDisruptions();
  } catch {
    unavailable = true;
  }

  const hasWarnings = disruptions.length > 0;

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <SiteHeader />

      <section className="hero shell" id="top">
        <div className="eyebrow">MELBOURNE COMMUTES, WITHOUT THE SURPRISES</div>
        <h1>Know before<br />you <em>go.</em></h1>
        <p className="intro">Choose the train lines that matter to you, set one reminder time for each, and see useful service and station updates in one place.</p>

        <div className={`status-card ${hasWarnings ? "warning" : "clear"}`}>
          <div className="status-head">
            <span className="status-icon">
              {unavailable ? <AlertTriangle size={26} /> : hasWarnings ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
            </span>
            <div>
              <p className="label">CURRENT STATUS</p>
              <h2>{unavailable ? "Unable to check right now" : hasWarnings ? `${disruptions.length} service ${disruptions.length === 1 ? "change" : "changes"}` : "All clear on the line"}</h2>
            </div>
            <span className="updated">Checked {melbourneTime.format(new Date())}</span>
          </div>

          {hasWarnings ? (
            <div className="disruption-list">
              {disruptions.map((item) => (
                <article className="disruption" key={item.id}>
                  <span className={`severity ${item.severity}`}>{item.severity === "major" ? "SERVICE CHANGE" : "NOTICE"}</span>
                  <h3>{item.detail}</h3>
                  {item.description && <p className="disruption-description">{item.description}</p>}
                  <p><CalendarDays size={16} /> {item.period}</p>
                  <p><TrainFront size={16} /> {item.line}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="status-copy">{unavailable ? "Open the official source below for the latest information." : "No planned disruptions are listed right now. Your usual journey should run as expected."}</p>
          )}

          <a className="source-link" href={SOURCE_URL} target="_blank" rel="noreferrer">
            View official Transport Victoria updates <ArrowUpRight size={17} />
          </a>
          {hasWarnings && <SendAlertButton />}
        </div>
      </section>

      <section className="schedule shell">
        <div className="schedule-copy">
          <span className="small-icon"><BellRing size={20} /></span>
          <div>
            <p className="label">YOUR CHECK-IN</p>
            <h2>Your line, your time.</h2>
            <p>Each enabled line has one daily reminder time. We only contact you when there&apos;s something worth knowing.</p>
          </div>
        </div>
        <div className="days">
          <div><span>LINES</span><strong>{subscriptions.filter((item) => item.enabled).length}</strong><small>ON</small></div>
          <div><span>TIMEZONE</span><strong>AEDT</strong><small>AEST</small></div>
          <p><Clock3 size={15} /> Melbourne time</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
