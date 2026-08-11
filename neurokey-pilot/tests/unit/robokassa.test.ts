import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import { createCheckoutUrl, verifyResultSignature } from "@/lib/robokassa";

const CONFIG = { merchantLogin: "shop-1", password1: "pass1" };
const PASSWORD2 = "pass2";

function md5(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

describe("createCheckoutUrl", () => {
  it("signs the link with MerchantLogin:OutSum:InvId:Password1:Shp_parentId=...", () => {
    const url = createCheckoutUrl(299, "Подписка NeuRoKey", 42, "parent-1", CONFIG);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://auth.robokassa.ru/Merchant/Index.aspx");
    expect(parsed.searchParams.get("MerchantLogin")).toBe("shop-1");
    expect(parsed.searchParams.get("OutSum")).toBe("299.00");
    expect(parsed.searchParams.get("InvId")).toBe("42");
    expect(parsed.searchParams.get("Shp_parentId")).toBe("parent-1");
    const expected = md5("shop-1:299.00:42:pass1:Shp_parentId=parent-1");
    expect(parsed.searchParams.get("SignatureValue")).toBe(expected);
  });

  it("adds IsTest=1 when isTest is set", () => {
    const url = createCheckoutUrl(299, "d", 1, "p", { ...CONFIG, isTest: true });
    expect(new URL(url).searchParams.get("IsTest")).toBe("1");
  });

  it("omits IsTest when not set", () => {
    const url = createCheckoutUrl(299, "d", 1, "p", CONFIG);
    expect(new URL(url).searchParams.has("IsTest")).toBe(false);
  });
});

describe("verifyResultSignature", () => {
  it("accepts a validly signed result, case-insensitively", () => {
    const sig = md5(`299.00:42:${PASSWORD2}:Shp_parentId=parent-1`);
    expect(verifyResultSignature("299.00", "42", "parent-1", sig.toUpperCase(), PASSWORD2)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(verifyResultSignature("299.00", "42", "parent-1", "not-the-real-signature", PASSWORD2)).toBe(false);
  });
});
