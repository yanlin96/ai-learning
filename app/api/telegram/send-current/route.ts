import { getLineDisruptions } from "@/lib/disruptions";
import { telegramAlertText } from "@/lib/notification-message";
import { sendTelegramMessage } from "@/lib/telegram";
import { listSubscriptions } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ ok: false, error: "Manual sending is only enabled locally." }, { status: 403 });
  }

  try {
    const subscriptions = (await listSubscriptions()).filter((item) => item.enabled);
    const disruptions = (await Promise.all(
      subscriptions.map((item) => getLineDisruptions(item.lineId)),
    )).flat();

    if (!disruptions.length) {
      return Response.json(
        { ok: false, error: "There are no current travel notices for your lines." },
        { status: 409 },
      );
    }

    await sendTelegramMessage(telegramAlertText(disruptions));
    return Response.json({ ok: true, count: disruptions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send current alerts";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
