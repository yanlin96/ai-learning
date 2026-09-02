import "server-only";

export function getCronSecret() {
  return process.env.CRON_SECRET?.replace(/[^\x21-\x7e]/g, "") ?? "";
}

export function isAuthorizedCronRequest(request: Request) {
  const secret = getCronSecret();
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
