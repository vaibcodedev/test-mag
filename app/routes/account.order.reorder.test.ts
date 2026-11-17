import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ORDER_REORDER_QUERY } from "~/graphql/queries/account-order.query";
import { accountTestContext } from "~/lib/account/testing";

import { loader } from "./account.order.reorder";

type LoaderArgs = Parameters<typeof loader>[0];

const variantId = (id: number) => `gid://shopify/ProductVariant/${id}`;

function orderLine(title: string, variant: number | null, quantity = 1) {
  return {
    id: `gid://shopify/LineItem/${title}`,
    title,
    variantTitle: null,
    quantity,
    variantId: variant === null ? null : variantId(variant),
  };
}

function variant(id: number, availableForSale = true) {
  return {
    __typename: "ProductVariant",
    id: variantId(id),
    availableForSale,
    title: "Default Title",
    price: { amount: "100.0", currencyCode: "UAH" },
    image: null,
    selectedOptions: [],
    product: { title: `Товар ${id}`, handle: `product-${id}` },
  };
}

function orderResponse(lines: ReturnType<typeof orderLine>[]) {
  return {
    data: {
      order: {
        id: "gid://shopify/Order/1005",
        name: "#1005",
        lineItems: { nodes: lines, pageInfo: { hasNextPage: false } },
      },
    },
  };
}

function call(id: string, options: Parameters<typeof accountTestContext>[0] = {}) {
  const test = accountTestContext(options);
  const args = {
    request: new Request(`https://ionov.example/account/orders/${id}/reorder`),
    context: test.context,
    params: { id },
  } as unknown as LoaderArgs;
  return { ...test, response: loader(args) };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /account/orders/:id/reorder", () => {
  it("повертає рядки кошика й пропущені позиції, відповідь не кешується", async () => {
    const { response, storefrontGraphql } = call("1005", {
      customer: new Map([
        [
          ORDER_REORDER_QUERY,
          () =>
            orderResponse([
              orderLine("iPhone", 1, 2),
              orderLine("Годинник", 2),
              orderLine("Чохол", 3),
              orderLine("Налаштування", null),
            ]),
        ],
      ]),
      // Варіанта 3 вітрина не знає: на його місці null.
      storefront: () => ({ data: { nodes: [variant(1), variant(2, false), null] } }),
    });

    const result = await response;
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await result.json()).toEqual({
      lines: [
        {
          merchandiseId: variantId(1),
          quantity: 2,
          preview: {
            id: variantId(1),
            price: { amount: "100.0", currencyCode: "UAH" },
            title: "Default Title",
            image: null,
            selectedOptions: [],
            product: { title: "Товар 1", handle: "product-1" },
          },
        },
      ],
      skipped: [
        { title: "Годинник", reason: "sold-out" },
        { title: "Чохол", reason: "gone" },
        { title: "Налаштування", reason: "gone" },
      ],
    });
    expect(storefrontGraphql.mock.calls[0]?.[1]).toEqual({
      variables: { ids: [variantId(1), variantId(2), variantId(3)] },
    });
  });

  it("замовлення без варіантів не ходить у Storefront API", async () => {
    const { response, storefrontGraphql } = call("1005", {
      customer: new Map([[ORDER_REORDER_QUERY, () => orderResponse([orderLine("Послуга", null)])]]),
    });

    expect(await (await response).json()).toEqual({
      lines: [],
      skipped: [{ title: "Послуга", reason: "gone" }],
    });
    expect(storefrontGraphql).not.toHaveBeenCalled();
  });

  it("параметр, який не є числом, — 404 без запитів", async () => {
    const { response, customerGraphql } = call("abc");

    expect((await response).status).toBe(404);
    expect(customerGraphql).not.toHaveBeenCalled();
  });

  it.each(["signed-out", "unavailable"] as const)(
    "без входу (%s) відповідає 401",
    async (session) => {
      const { response, customerGraphql } = call("1005", { session });
      const result = await response;

      expect(result.status).toBe(401);
      expect(result.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await result.json()).toEqual({ error: expect.any(String) });
      expect(customerGraphql).not.toHaveBeenCalled();
    },
  );

  it("чуже замовлення — 404, збій Customer Account API — 502 без тексту API", async () => {
    const missing = call("1", {
      customer: new Map([[ORDER_REORDER_QUERY, () => ({ data: { order: null } })]]),
    });
    const failed = call("1005", {
      customer: new Map([
        [
          ORDER_REORDER_QUERY,
          () => ({ data: null, errors: [{ message: "Internal error. Request ID: secret-1" }] }),
        ],
      ]),
    });
    const thrown = call("1005", {
      customer: new Map([
        [
          ORDER_REORDER_QUERY,
          () => {
            throw new Error("network");
          },
        ],
      ]),
    });

    expect((await missing.response).status).toBe(404);
    const result = await failed.response;
    expect(result.status).toBe(502);
    expect(JSON.stringify(await result.json())).not.toContain("secret-1");
    expect((await thrown.response).status).toBe(502);
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountOrderReorder: Internal error. Request ID: secret-1 (-)",
    );
  });

  it("збій Storefront API — 502: невідомі варіанти не можна вважати знятими з продажу", async () => {
    const customer = new Map([
      [ORDER_REORDER_QUERY, () => orderResponse([orderLine("iPhone", 1)])],
    ]);
    const withErrors = call("1005", {
      customer,
      storefront: () => ({ data: { nodes: [null] }, errors: [{ message: "Throttled" }] }),
    });
    const thrown = call("1005", {
      customer,
      storefront: () => {
        throw new Error("network");
      },
    });

    for (const { response } of [withErrors, thrown]) {
      const result = await response;
      expect(result.status).toBe(502);
      expect(await result.json()).toEqual({
        error: "Не вдалося перевірити наявність товарів. Спробуйте ще раз.",
      });
    }
  });
});
