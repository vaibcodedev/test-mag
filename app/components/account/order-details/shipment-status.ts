import type { OrderStatus } from "~/components/account/order-card";

import type { OrderAddress, OrderShipment } from "./order-details.types";

/** Остання подія перевізника (FulfillmentEventStatus). */
const EVENT_STATUS: Record<string, OrderStatus> = {
  ATTEMPTED_DELIVERY: { label: "Була спроба доставки", tone: "attention" },
  CARRIER_PICKED_UP: { label: "Передано перевізнику", tone: "neutral" },
  CONFIRMED: { label: "Підтверджено", tone: "neutral" },
  DELAYED: { label: "Затримується", tone: "attention" },
  DELIVERED: { label: "Доставлено", tone: "positive" },
  FAILURE: { label: "Не вдалося доставити", tone: "attention" },
  IN_TRANSIT: { label: "У дорозі", tone: "neutral" },
  LABEL_PRINTED: { label: "Готуємо до відправлення", tone: "neutral" },
  LABEL_PURCHASED: { label: "Готуємо до відправлення", tone: "neutral" },
  OUT_FOR_DELIVERY: { label: "Кур'єр уже везе", tone: "neutral" },
  PICKED_UP: { label: "Отримано", tone: "positive" },
  READY_FOR_PICKUP: { label: "Готове до видачі", tone: "positive" },
};

/** Стан самого відправлення (FulfillmentStatus): коли подій перевізника ще немає. */
const SHIPMENT_STATUS: Record<string, OrderStatus> = {
  CANCELLED: { label: "Відправлення скасовано", tone: "attention" },
  ERROR: { label: "Відправлення затримується", tone: "attention" },
  FAILURE: { label: "Відправлення затримується", tone: "attention" },
  OPEN: { label: "Готуємо до відправлення", tone: "neutral" },
  PENDING: { label: "Готуємо до відправлення", tone: "neutral" },
  SUCCESS: { label: "Відправлено", tone: "neutral" },
};

const CANCEL_REASON: Record<string, string> = {
  CUSTOMER: "на ваше прохання",
  DECLINED: "оплата не пройшла",
  INVENTORY: "товару не виявилося в наявності",
};

function lookup<Value>(table: Record<string, Value>, code: string | null | undefined) {
  return code && Object.hasOwn(table, code) ? (table[code] ?? null) : null;
}

/**
 * Стан відправлення українською: остання подія перевізника, а без неї — стан самого
 * відправлення. Невідомий код не показуємо, щоб на сторінці не лишався англійський текст.
 */
export function shipmentStatus(
  shipment: Pick<OrderShipment, "latestShipmentStatus" | "status">,
): OrderStatus | null {
  return (
    lookup(EVENT_STATUS, shipment.latestShipmentStatus) ?? lookup(SHIPMENT_STATUS, shipment.status)
  );
}

/** Причина скасування — лише ті, що щось пояснюють покупцеві; решту пропускаємо. */
export function cancelReasonLabel(code: string | null | undefined): string | null {
  return lookup(CANCEL_REASON, code);
}

/** Посилання для відстеження показуємо лише справжнє: http(s). */
export function trackingHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

const HOME_COUNTRY = /^(ukraine|україна|ua)$/i;

/** Адреса рядками: одержувач, вулиця, індекс і місто, область; країну — лише якщо не Україна. */
export function addressLines(address: OrderAddress | null | undefined): string[] {
  if (!address) return [];
  const clean = (value: string | null | undefined) => value?.trim() ?? "";
  const country = clean(address.country);

  return [
    clean(address.name),
    [clean(address.address1), clean(address.address2)].filter(Boolean).join(", "),
    [clean(address.zip), clean(address.city)].filter(Boolean).join(" "),
    clean(address.province),
    HOME_COUNTRY.test(country) ? "" : country,
  ].filter(Boolean);
}

/** Телефон одержувача для показу: `+380671234567` → `+380 67 123 45 67`; інші номери — як є. */
export function formatPhone(value: string | null | undefined): string {
  const phone = (value ?? "").trim();
  const match = phone.match(/^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match ? `+380 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}
