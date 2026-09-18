export function consumeAssistantRun(params: URLSearchParams) {
  if (params.get("run") !== "1" || params.get("source") !== "assistant") return false;
  const clean = new URLSearchParams(params);
  clean.delete("run");
  clean.delete("source");
  const query = clean.toString();
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  return true;
}
