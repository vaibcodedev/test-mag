import type { Money } from "~/lib/format";

/** Позиція на сторінці замовлення. */
export type OrderDetailsLine = {
  id: string;
  title: string;
  variantTitle?: string | null;
  quantity: number;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  /** Ціна за одиницю без знижок. */
  price?: Money | null;
  /** Сума позиції. */
  totalPrice?: Money | null;
  /** Знижка саме на цю позицію. */
  totalDiscount?: Money | null;
};

export type OrderAddress = {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  zip?: string | null;
  province?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
};

/** Основні дані замовлення: без них сторінку не зібрати. */
export type OrderDetailsData = {
  id: string;
  /** Номер замовлення, як у листі: «#1001». */
  name: string;
  processedAt: string;
  cancelledAt?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  /** Сторінка стану в Shopify: там відстеження й повернення. */
  statusPageUrl: string;
  totalPrice: Money;
  /** Сума товарів: без доставки й податків, уже зі знижками. */
  subtotal?: Money | null;
  totalShipping?: Money | null;
  totalTax?: Money | null;
  shippingAddress?: OrderAddress | null;
  lineItems: {
    nodes: readonly OrderDetailsLine[];
    /** У замовленні понад сто позицій: показано перші. */
    pageInfo?: { hasNextPage: boolean } | null;
  };
};

/** Значення знижки: сума або відсоток. */
export type OrderDiscountValue =
  | { __typename: "MoneyV2"; amount: string; currencyCode: string }
  | { __typename: "PricingPercentageValue"; percentage: number }
  | { __typename?: string };

export type OrderDiscount = {
  /** LINE_ITEM — знижка на товари, SHIPPING_LINE — на доставку. */
  targetType?: string | null;
  /** Промокод. */
  code?: string | null;
  /** Назва автоматичної чи ручної знижки. */
  title?: string | null;
  value?: OrderDiscountValue | null;
};

export type OrderRefund = {
  id: string;
  createdAt?: string | null;
  /** Номер повернення товару, якщо кошти повернули за ним. */
  returnName?: string | null;
  totalRefunded: Money;
};

/** Знижки, спосіб доставки, скасування, повернення коштів. `null` — API їх не віддав. */
export type OrderAdjustments = {
  cancelReason?: string | null;
  totalRefunded?: Money | null;
  shippingLine?: { title?: string | null } | null;
  discountApplications?: { nodes: readonly OrderDiscount[] } | null;
  refunds?: readonly OrderRefund[] | null;
};

export type OrderTracking = {
  company?: string | null;
  number?: string | null;
  url?: string | null;
};

export type OrderShipment = {
  id: string;
  createdAt?: string | null;
  estimatedDeliveryAt?: string | null;
  /** Остання подія перевізника: IN_TRANSIT, DELIVERED … */
  latestShipmentStatus?: string | null;
  /** Стан самого відправлення: SUCCESS, CANCELLED … */
  status?: string | null;
  trackingInformation?: readonly OrderTracking[] | null;
  fulfillmentLineItems?: {
    nodes: ReadonlyArray<{
      id: string;
      quantity?: number | null;
      lineItem: { id: string; title: string };
    }>;
  } | null;
};
