import type { ReactNode } from "react";

/** Shared workspace rhythm; report bodies keep their domain-specific UI. */
export function PageContent({ children }: { children: ReactNode }) {
  return <section className="mx-auto w-[calc(100%_-_32px)] max-w-[1080px] pt-6 pb-12 text-slate-700 selection:bg-blue-100 selection:text-[#090d46] [&_input]:caret-[#00539d] [&_textarea]:caret-[#00539d] [&_a]:underline-offset-4 [&_strong]:tabular-nums sm:w-[calc(100%_-_48px)] sm:pt-8">{children}</section>;
}

export function PageHeading({ title, description, actions, icon }: {
  eyebrow?: string; title: ReactNode; description: string;
  actions?: ReactNode; icon?: ReactNode; compact?: boolean;
}) {
  return <header className="mb-6 border-b border-slate-200 pb-5">
    <div className="flex items-start gap-3">
      {icon && <span className="mt-1 shrink-0 text-[#00539d]" aria-hidden="true">{icon}</span>}
      <h1 className="m-0 max-w-none text-[clamp(28px,2.4vw,36px)] leading-tight font-extrabold tracking-[-.02em] text-balance text-[#090d46]">{title}</h1>
    </div>
    <p className="mt-2 mb-0 max-w-[72ch] text-sm leading-6 text-slate-600">{description}</p>
    {actions && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-lg [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-[#00539d]">{actions}</div>}
  </header>;
}
