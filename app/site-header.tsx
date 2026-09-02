import { TrainFront } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="Line Watch Melbourne home">
          <span className="brand-mark"><TrainFront size={19} strokeWidth={2.4} /></span>
          <span>Line Watch Melbourne</span>
        </a>
        <div className="nav-actions">
          <a href="/">Service updates</a>
          <a href="/reminders">My reminders</a>
          <a href="/website-audit">Website audit</a>
          <span className="live-pill"><i /> Live monitoring</span>
        </div>
      </nav>
    </header>
  );
}
