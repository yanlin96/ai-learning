import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendTelegramMessage(
      "✅ <b>Werribee Watch connected</b>\n\nTelegram notifications are configured correctly.",
    );
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send Telegram message";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
