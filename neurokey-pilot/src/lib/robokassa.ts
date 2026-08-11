import { createHash } from "crypto";

const DEFAULT_BASE_URL = "https://auth.robokassa.ru/Merchant/Index.aspx";

export type RobokassaCheckoutConfig = {
  merchantLogin: string;
  password1: string;
  isTest?: boolean;
  baseUrl?: string;
};

function md5(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

/**
 * Builds the Robokassa checkout link. Robokassa has no payment-creation API —
 * the link itself, signed with Password #1, is the payment. `parentId` rides
 * as the `Shp_parentId` custom param, echoed back verbatim on the ResultURL
 * webhook so it can be matched to a subscription without a separate payments
 * table.
 */
export function createCheckoutUrl(
  amount: number,
  description: string,
  invId: number,
  parentId: string,
  config: RobokassaCheckoutConfig,
): string {
  const outSum = amount.toFixed(2);
  const signature = md5(`${config.merchantLogin}:${outSum}:${invId}:${config.password1}:Shp_parentId=${parentId}`);

  const params = new URLSearchParams({
    MerchantLogin: config.merchantLogin,
    OutSum: outSum,
    InvId: String(invId),
    Description: description,
    SignatureValue: signature,
    Culture: "ru",
    Shp_parentId: parentId,
  });
  if (config.isTest) params.set("IsTest", "1");

  return `${config.baseUrl ?? DEFAULT_BASE_URL}?${params.toString()}`;
}

/** Verifies a ResultURL webhook's SignatureValue against Password #2. */
export function verifyResultSignature(
  outSum: string,
  invId: string,
  parentId: string,
  signatureValue: string,
  password2: string,
): boolean {
  const expected = md5(`${outSum}:${invId}:${password2}:Shp_parentId=${parentId}`);
  return expected.toLowerCase() === signatureValue.toLowerCase();
}
