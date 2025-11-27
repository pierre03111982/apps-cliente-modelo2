import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SalesConfig } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSalesConfig(raw?: Partial<SalesConfig> | null): SalesConfig {
  const integrations = raw?.integrations ?? {}
  return {
    enabled: Boolean(raw?.enabled),
    payment_gateway: raw?.payment_gateway === "mercadopago" ? "mercadopago" : "manual_whatsapp",
    shipping_provider: raw?.shipping_provider ?? "none",
    origin_zip: raw?.origin_zip ?? "",
    manual_contact:
      raw?.manual_contact ??
      raw?.salesWhatsapp ??
      raw?.whatsappLink ??
      raw?.manual_contact ??
      null,
    fixed_shipping_price:
      typeof raw?.fixed_shipping_price === "number"
        ? raw.fixed_shipping_price
        : null,
    checkout_url: raw?.checkout_url ?? raw?.checkoutLink ?? raw?.ecommerceUrl ?? null,
    integrations: {
      mercadopago_public_key: integrations.mercadopago_public_key ?? null,
      mercadopago_access_token: integrations.mercadopago_access_token ?? null,
      melhor_envio_token: integrations.melhor_envio_token ?? null,
    },
    whatsappLink: raw?.whatsappLink,
    ecommerceUrl: raw?.ecommerceUrl,
    salesWhatsapp: raw?.salesWhatsapp,
    checkoutLink: raw?.checkoutLink,
  }
}
