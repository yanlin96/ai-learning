import Link from "next/link";
import { Search } from "lucide-react";

export const fieldClass = "box-border min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-[#090d46] placeholder:text-slate-500 focus:border-[#00539d] focus:outline-2 focus:outline-offset-2 focus:outline-[#00539d] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
export const primaryActionClass = "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-[#00539d] px-5 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-[#003f78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none";

export function HistoryEmptyState({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10">
    <h2 className="m-0 text-xl font-bold text-[#090d46]">{title}</h2>
    <p className="mt-2 mb-5 max-w-[65ch] text-sm leading-6 text-slate-600">{description}</p>
    <Link className={primaryActionClass} href={href}>{action}</Link>
  </div>;
}

export function HistorySearch({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label className="relative block min-w-0 basis-full sm:flex-1">
    <span className="sr-only">{label}</span>
    <Search className="pointer-events-none absolute top-4 left-3 text-slate-500" size={18} aria-hidden="true" />
    <input className={fieldClass + " pl-10"} type="search" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />
  </label>;
}
