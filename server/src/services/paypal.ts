import { config } from "../config.js";

type PayPalAccessToken = { access_token: string };

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = config.paypal;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal no configurado. Define PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth falló: ${text}`);
  }

  const data = (await res.json()) as PayPalAccessToken;
  return data.access_token;
}

export async function createPayPalOrder(total: number, currency = "USD") {
  const token = await getAccessToken();
  const res = await fetch(`${config.paypal.apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: total.toFixed(2),
          },
          description: "Pedido PlatoYa",
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo crear la orden PayPal: ${text}`);
  }

  return res.json() as Promise<{ id: string; status: string }>;
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const token = await getAccessToken();
  const res = await fetch(
    `${config.paypal.apiBase}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo capturar PayPal: ${text}`);
  }

  return res.json() as Promise<{
    id: string;
    status: string;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ status: string }> };
    }>;
  }>;
}

/** Modo demo cuando no hay credenciales PayPal */
export function isPayPalConfigured() {
  return Boolean(config.paypal.clientId && config.paypal.clientSecret);
}
