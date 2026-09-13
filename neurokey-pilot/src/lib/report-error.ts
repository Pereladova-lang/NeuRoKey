export function reportClientError(message: string, stack?: string) {
  const payload = JSON.stringify({ message: message.slice(0, 2000), stack: stack?.slice(0, 8000), path: window.location.pathname });
  const sent = navigator.sendBeacon?.("/api/error-report", new Blob([payload], { type: "application/json" }));
  if (!sent) {
    fetch("/api/error-report", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }
}
