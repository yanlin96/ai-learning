import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { getLineDisruptions } from "@/lib/disruptions";
import { telegramAlertText } from "@/lib/notification-message";
import { sendTelegramMessage } from "@/lib/telegram";
import { listSubscriptions } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const melbourneTime = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    const due = (await listSubscriptions()).filter(
      (item) => item.enabled && item.reminderTime === melbourneTime,
    );
    if (!due.length) {
      return Response.json({ ok: true, sent: false, reason: "No reminders due", melbourneTime });
    }
    const disruptions = (await Promise.all(due.map((item) => getLineDisruptions(item.lineId)))).flat();
    if (!disruptions.length) {
      return Response.json({ ok: true, sent: false, reason: "No matching disruptions" });
    }

    await sendTelegramMessage(telegramAlertText(disruptions));
    return Response.json({ ok: true, sent: true, count: disruptions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduled check failed";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
