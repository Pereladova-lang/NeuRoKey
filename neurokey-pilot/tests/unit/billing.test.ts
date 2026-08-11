import { describe, it, expect } from "vitest";
import { nextSubscriptionState, reconcileExpiry } from "@/lib/billing";

const now = new Date("2026-07-15T10:00:00Z");

describe("nextSubscriptionState", () => {
  it("payment_succeeded → active, nextBillingAt +30d, stores invoiceId", () => {
    const next = nextSubscriptionState({ type: "payment_succeeded", invoiceId: "42" }, now);
    expect(next.status).toBe("active");
    expect(next.paymentMethodId).toBe("42");
    expect(next.nextBillingAt?.getTime()).toBe(now.getTime() + 30 * 864e5);
  });

  it("cancel_requested → canceled", () => {
    expect(nextSubscriptionState({ type: "cancel_requested" }, now).status).toBe("canceled");
  });
});

describe("reconcileExpiry", () => {
  it("active past nextBillingAt → past_due", () => {
    const sub = { status: "active", nextBillingAt: new Date(now.getTime() - 1000) };
    expect(reconcileExpiry(sub, now)).toEqual({ status: "past_due" });
  });

  it("active before nextBillingAt → no change", () => {
    const sub = { status: "active", nextBillingAt: new Date(now.getTime() + 1000) };
    expect(reconcileExpiry(sub, now)).toBeNull();
  });

  it("past_due within 3-day grace → no change", () => {
    const sub = { status: "past_due", nextBillingAt: new Date(now.getTime() - 2 * 864e5) };
    expect(reconcileExpiry(sub, now)).toBeNull();
  });

  it("past_due beyond 3-day grace → expired", () => {
    const sub = { status: "past_due", nextBillingAt: new Date(now.getTime() - 4 * 864e5) };
    expect(reconcileExpiry(sub, now)).toEqual({ status: "expired" });
  });

  it("trial/expired/canceled statuses are left alone", () => {
    expect(reconcileExpiry({ status: "trial", nextBillingAt: null }, now)).toBeNull();
    expect(reconcileExpiry({ status: "expired", nextBillingAt: new Date(0) }, now)).toBeNull();
  });
});
