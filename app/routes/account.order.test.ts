import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ORDER_ADJUSTMENTS_QUERY,
  ORDER_QUERY,
  ORDER_SHIPMENTS_QUERY,
} from "~/graphql/queries/account-order.query";
import { accountTestContext, thrownResponse } from "~/lib/account/testing";

import { loader } from "./account.order";

type LoaderArgs = Parameters<typeof loader>[0];

const ORDER = {
  id: "gid://shopify/Order/1005",
  name: "#1005",
  processedAt: "2026-10-28T10:05:00+02:00",
  statusPageUrl: "https://shop.example/orders/1005",
  totalPrice: { amount: "100.0", currencyCode: "UAH" },
  lineItems: { nodes: [], pageInfo: { hasNextPage: false } },
};
const ADJUSTMENTS = { id: ORDER.id, cancelReason: null, refunds: [] };
const SHIPMENT = { id: "gid://shopify/Fulfillment/1", trackingInformation: [] };

function call(id: string, options: Parameters<typeof accountTestContext>[0] = {}) {
  const test = accountTestContext(options);
  const args = {
    request: new Request(`https://ionov.example/account/orders/${id}`),
    context: test.context,
    params: { id },
  } as unknown as LoaderArgs;
  return { ...test, run: () => loader(args) };
}

const READY = new Map<unknown, (variables: unknown) => unknown>([
  [ORDER_QUERY, () => ({ data: { order: ORDER } })],
  [ORDER_ADJUSTMENTS_QUERY, () => ({ data: { order: ADJUSTMENTS } })],
  [
    ORDER_SHIPMENTS_QUERY,
    () => ({ data: { order: { id: ORDER.id, fulfillments: { nodes: [SHIPMENT] } } } }),
  ],
]);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /account/orders/:id", () => {
  it("віддає замовлення з другорядними блоками й запитує його за gid", async () => {
    const { run, customerGraphql } = call("1005", { customer: READY });

    expect(await run()).toEqual({
      status: "ready",
      order: ORDER,
      adjustments: ADJUSTMENTS,
      shipments: [SHIPMENT],
    });
    expect(customerGraphql).toHaveBeenCalledTimes(3);
    for (const [, options] of customerGraphql.mock.calls) {
      expect(options).toEqual({
        accessToken: "token",
        variables: { id: "gid://shopify/Order/1005" },
      });
    }
  });

  it.each(["abc", "gid%3A%2F%2Fshopify%2FOrder%2F1", "1-2", "1".repeat(21)])(
    "параметр, який не є числом, — 404 без запитів: %s",
    async (id) => {
      const { run, customerGraphql } = call(id, { customer: READY });

      expect((await thrownResponse(run)).status).toBe(404);
      expect(customerGraphql).not.toHaveBeenCalled();
    },
  );

  it.each(["signed-out", "unavailable"] as const)(
    "без входу (%s) відправляє на сторінку кабінету зі станом входу",
    async (session) => {
      const { run, customerGraphql } = call("1005", { session, customer: READY });

      const response = await thrownResponse(run);
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/account");
      expect(customerGraphql).not.toHaveBeenCalled();
    },
  );

  it("чуже або неіснуюче замовлення — звичайна 404", async () => {
    const missing = call("1", {
      customer: new Map(READY).set(ORDER_QUERY, () => ({ data: { order: null } })),
    });
    const refused = call("1", {
      customer: new Map(READY).set(ORDER_QUERY, () => ({
        data: null,
        errors: [{ message: "Order not found", path: ["order"] }],
      })),
    });

    expect((await thrownResponse(missing.run)).status).toBe(404);
    expect((await thrownResponse(refused.run)).status).toBe(404);
  });

  it("збій основного запиту — стан помилки, а подробиці лише в журналі сервера", async () => {
    const withErrors = call("1005", {
      customer: new Map(READY).set(ORDER_QUERY, () => ({
        data: null,
        errors: [
          {
            message: "Field 'subtotal' doesn't exist on type 'Order'",
            path: ["order", "subtotal"],
          },
        ],
      })),
    });
    const thrown = call("1005", {
      customer: new Map(READY).set(ORDER_QUERY, () => {
        throw new Error("Customer Account API responded with 500");
      }),
    });

    expect(await withErrors.run()).toEqual({ status: "error" });
    expect(await thrown.run()).toEqual({ status: "error" });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountOrder: Field 'subtotal' doesn't exist on type 'Order' (order.subtotal)",
    );
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountOrder: Customer Account API responded with 500",
    );
  });

  it("збій другорядного запиту прибирає лише свій блок", async () => {
    const { run } = call("1005", {
      customer: new Map(READY)
        .set(ORDER_ADJUSTMENTS_QUERY, () => ({
          data: null,
          errors: [{ message: "Field 'refunds' doesn't exist on type 'Order'" }],
        }))
        .set(ORDER_SHIPMENTS_QUERY, () => {
          throw new Error("timeout");
        }),
    });

    expect(await run()).toEqual({
      status: "ready",
      order: ORDER,
      adjustments: null,
      shipments: null,
    });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountOrderAdjustments: Field 'refunds' doesn't exist on type 'Order' (-)",
    );
    expect(console.error).toHaveBeenCalledWith("[customer-account] AccountOrderShipments: timeout");
  });
});
