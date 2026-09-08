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
          <a href="/website-audit">Website audit</a>
        </div>
      </nav>
    </header>
  );
}
