import { redirect } from "next/navigation";

/** The audit tool moved to the site root; keep the old URL working. */
export default function WebsiteAuditRedirect(): never {
  redirect("/");
}
