import { Bot, CheckCircle2, Link2Off, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { AuditForm } from "@/app/audit-form";
import { SiteHeader } from "@/app/site-header";
import { SiteFooter } from "@/app/site-footer";
import { DailyBrief } from "@/app/daily-brief";

export default function WebsiteAuditPage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell audit-page audit-home">
        <DailyBrief />
        <div className="audit-launch">
          <header className="audit-hero-copy">
            <div className="hero-kicker"><ScanSearch size={16} /> Website quality, made clear</div>
            <h1>Find what is quietly <em>hurting your website.</em></h1>
            <p>Paste a URL and get a practical check of broken links, technical SEO, and AI crawler access—with the fixes prioritised for you.</p>
            <div className="hero-benefits">
              <span><CheckCircle2 size={15} /> No signup</span>
              <span><ShieldCheck size={15} /> Read-only checks</span>
              <span><Sparkles size={15} /> Clear next actions</span>
            </div>
          </header>
          <aside className="result-preview" aria-label="Example audit result">
            <div className="preview-glow" />
            <div className="preview-window">
              <div className="preview-bar"><i /><i /><i /><span>example.com</span><b>EXAMPLE REPORT</b></div>
              <div className="preview-heading"><span><Bot size={18} /></span><div><small>WEBSITE HEALTH</small><strong>Good foundation. 3 fixes recommended.</strong></div></div>
              <div className="preview-scores">
                <div><small>SEO</small><strong>84</strong><i><b style={{ width: "84%" }} /></i></div>
                <div><small>AI visibility</small><strong>91</strong><i><b style={{ width: "91%" }} /></i></div>
              </div>
              <div className="preview-finding"><Link2Off size={16} /><span><strong>3 links need attention</strong><small>Includes 1 high-priority internal link</small></span><b>FIX FIRST</b></div>
              <div className="preview-ok"><CheckCircle2 size={15} /> JavaScript content rendered successfully</div>
            </div>
          </aside>
          <AuditForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
