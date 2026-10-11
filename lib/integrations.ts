/** Future integration boundaries. No external calls are made by this demo. */
export interface DemoPaymentProvider {
  kind: "demo";
  topUp(input: {
    userId: string;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<{ ledgerEntryId: string }>;
}
export interface FulfillmentProvider {
  request(input: {
    openingId: string;
    userId: string;
    simulated: true;
  }): Promise<{ requestId: string; status: "requested" }>;
}
export interface IdentityProvider {
  kind: "demo" | "external";
  verify(
    userId: string,
  ): Promise<{ status: "not_required_for_demo" | "pending" | "verified" }>;
}
export interface VaultProvider {
  lookup(
    cardId: string,
  ): Promise<{ locationReference: string; simulated: boolean }>;
}
