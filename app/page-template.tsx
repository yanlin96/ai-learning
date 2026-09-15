import type { ReactNode } from "react";

/** Shared workspace rhythm; report bodies keep their domain-specific UI. */
export function PageContent({ children }: { children: ReactNode }) {
  return <section className="mx-auto w-[calc(100%_-_32px)] max-w-[1080px] pt-7 pb-16 sm:w-[calc(100%_-_48px)] sm:pt-10">{children}</section>;
}

export function PageHeading({ eyebrow, title, description, actions, icon, compact = false }: {
  eyebrow: string; title: ReactNode; description: string;
  actions?: ReactNode; icon?: ReactNode; compact?: boolean;
}) {
  return <header className="mb-7">
    <p className="m-0 mb-3 text-xs font-extrabold tracking-widest text-[#00539d] uppercase">{eyebrow}</p>
    <div className="flex items-start gap-3">
      {icon && <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#00539d]">{icon}</span>}
      <h1 className={`m-0 max-w-none leading-tight text-[#090d46] ${compact ? "text-[clamp(28px,3vw,40px)]" : "text-[clamp(32px,3.5vw,48px)]"}`}>{title}</h1>
    </div>
    <p className="mt-4 mb-0 max-w-[760px] text-base leading-7 text-slate-600">{description}</p>
    {actions && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">{actions}</div>}
  </header>;
}
