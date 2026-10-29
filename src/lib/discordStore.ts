/**
 * Kaelix plans are sold through Discord only (Discord Premium Apps), so every
 * "buy" button on the site sends people to the Discord store.
 */

export const KAELIX_APP_ID = "1506753052173139968";

export const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${KAELIX_APP_ID}&permissions=8&integration_type=0&scope=bot+applications.commands`;

export const DISCORD_STORE_URL = `https://discord.com/application-directory/${KAELIX_APP_ID}/store`;

export type BuyablePlan = "core" | "pro";

export function toBuyablePlan(value: string | null | undefined): BuyablePlan | null {
  const plan = value?.toLowerCase();
  return plan === "core" || plan === "pro" ? plan : null;
}

export function planStoreUrl(plan: BuyablePlan | null): string {
  if (!plan) {
    return DISCORD_STORE_URL;
  }

  const sku = (plan === "core" ? process.env.KAELIX_SKU_CORE : process.env.KAELIX_SKU_PRO)?.trim();

  return sku && /^\d+$/.test(sku) ? `${DISCORD_STORE_URL}/${sku}` : DISCORD_STORE_URL;
}