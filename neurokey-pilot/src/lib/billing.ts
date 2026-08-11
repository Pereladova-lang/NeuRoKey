export type BillingEvent = { type: "payment_succeeded"; invoiceId: string } | { type: "cancel_requested" };

const THIRTY_DAYS_MS = 30 * 864e5;
const GRACE_MS = 3 * 864e5;

/** Event-driven transitions: a Robokassa payment came in, or the parent asked to cancel. */
export function nextSubscriptionState(
  event: BillingEvent,
  now: Date,
): { status: string; paymentMethodId?: string; nextBillingAt?: Date } {
  if (event.type === "payment_succeeded") {
    return { status: "active", paymentMethodId: event.invoiceId, nextBillingAt: new Date(now.getTime() + THIRTY_DAYS_MS) };
  }
  return { status: "canceled" };
}

/**
 * Time-driven decay: Robokassa payments here are one-off (no recurring
 * auto-charge — see project memory on the YooKassa→Robokassa swap), so
 * nothing tells us a renewal failed. Instead each parent-portal visit
 * checks whether `nextBillingAt` has quietly passed and, after it has,
 * whether the 3-day grace window has too.
 */
export function reconcileExpiry(
  sub: { status: string; nextBillingAt: Date | null },
  now: Date,
): { status: string } | null {
  if (!sub.nextBillingAt) return null;
  if (sub.status === "active" && now.getTime() > sub.nextBillingAt.getTime()) {
    return { status: "past_due" };
  }
  if (sub.status === "past_due" && now.getTime() > sub.nextBillingAt.getTime() + GRACE_MS) {
    return { status: "expired" };
  }
  return null;
}
