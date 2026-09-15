import { redirect } from "next/navigation";

export default async function IndexPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  redirect(url ? `/website-audit?url=${encodeURIComponent(url)}` : "/website-audit");
}
