import "server-only";

import type { Disruption } from "@/lib/disruptions";
import { SOURCE_URL } from "@/lib/disruptions";
import { escapeTelegramHtml } from "@/lib/telegram";

export function telegramAlertText(disruptions: Disruption[]) {
  const items = disruptions.map((item, index) => [
    `${item.severity === "major" ? "🚌" : "ℹ️"} <b>${index + 1}. ${escapeTelegramHtml(item.detail)}</b>`,
    `🗓 ${escapeTelegramHtml(item.period)}`,
    item.description ? escapeTelegramHtml(item.description) : "Allow extra travel time and follow station announcements.",
  ].join("\n"));

  return [
    `⚠️ <b>Your commute: ${disruptions.length} useful ${disruptions.length === 1 ? "update" : "updates"}</b>`,
    "",
    ...items.flatMap((item, index) => index ? ["", item] : [item]),
    "",
    `<a href="${SOURCE_URL}">Official Transport Victoria updates</a>`,
  ].join("\n");
}
