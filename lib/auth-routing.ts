export function workspaceCallback(input?: string, siteOrigin?: string) {
  if (input && /^https?:\/\//i.test(input) && siteOrigin) {
    try {
      const target = new URL(input);
      if (target.origin !== new URL(siteOrigin).origin || target.username || target.password) return "/";
      input = target.pathname + target.search + target.hash;
    } catch { return "/"; }
  }
  if (!input || !input.startsWith("/") || input.startsWith("//") || /[\\\u0000-\u0020]/.test(input)) return "/";
  try {
    const decoded = decodeURIComponent(input);
    if (decoded.startsWith("//") || /[\\\u0000-\u0020]/.test(decoded)) return "/";
    const path = new URL(input, "https://workspace.invalid");
    const decodedPath = new URL(decoded, "https://workspace.invalid").pathname;
    if ([path.pathname, decodedPath].some((value) => ["/login", "/train-login", "/api"].includes(value) || value.startsWith("/api/") || value.startsWith("/_next/"))) return "/";
    return path.pathname + path.search + path.hash;
  } catch { return "/"; }
}
export function isAuthenticationEntry(path: string) {
  return path === "/login" || path === "/train-login" || path === "/api/auth" || path.startsWith("/api/auth/");
}
