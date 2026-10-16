// Proveedores de pago con logo oficial (spec 014). `PaymentMethod.provider`
// guarda el `name`; los valores antiguos escritos a mano se reconocen por
// coincidencia (“nequi”, “BANCOLOMBIA ahorros”).

export type PaymentProviderId = "bancolombia" | "nequi" | "paypal" | "pse";

export interface PaymentProvider {
  id: PaymentProviderId;
  name: string;
  logo: string;
  /** Etiqueta y ejemplo del campo “número o identificador” en el panel. */
  accountLabel: string;
  accountPlaceholder: string;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: "bancolombia",
    name: "Bancolombia",
    logo: "/payment-logos/bancolombia.svg",
    accountLabel: "Número de cuenta",
    accountPlaceholder: "Ahorros 123-456789-00",
  },
  {
    id: "nequi",
    name: "Nequi",
    logo: "/payment-logos/nequi.svg",
    accountLabel: "Número Nequi",
    accountPlaceholder: "300 123 4567",
  },
  {
    id: "paypal",
    name: "PayPal",
    logo: "/payment-logos/paypal.svg",
    accountLabel: "Correo de PayPal",
    accountPlaceholder: "pagos@tucorreo.com",
  },
  {
    id: "pse",
    name: "PSE",
    logo: "/payment-logos/pse.jpg",
    accountLabel: "Enlace o referencia de pago",
    accountPlaceholder: "https://… o referencia",
  },
];

export function getPaymentProvider(value?: string | null): PaymentProvider | null {
  const text = String(value || "").toLowerCase();
  if (!text) return null;
  return (
    PAYMENT_PROVIDERS.find(provider => text === provider.id) ||
    // “pse” es corto: solo cuenta como palabra suelta.
    PAYMENT_PROVIDERS.find(provider => (provider.id === "pse" ? /\bpse\b/.test(text) : text.includes(provider.id))) ||
    null
  );
}

/** Proveedores reconocidos de una lista de métodos, sin repetir y en orden. */
export function uniqueProviders(methods: { provider?: string | null; title?: string | null }[]): PaymentProvider[] {
  const seen = new Set<PaymentProviderId>();
  const result: PaymentProvider[] = [];
  for (const method of methods) {
    const provider = getPaymentProvider(method.provider || method.title);
    if (provider && !seen.has(provider.id)) {
      seen.add(provider.id);
      result.push(provider);
    }
  }
  return result;
}
