import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasGraphqlErrors,
  logGraphqlErrors,
  optionalData,
  redirectToFirstPageOnError,
  requireData,
  requireEntity,
  upstreamErrorResponse,
  withoutCursor,
} from "./errors";

const ERRORS = [{ message: "Internal error. Request ID: secret-123", path: ["product", "title"] }];

function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

let log: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  log = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logGraphqlErrors", () => {
  it("пише текст і шлях помилки в журнал і каже, чи були помилки", () => {
    expect(logGraphqlErrors("ProductPage", { errors: ERRORS })).toBe(true);
    expect(log).toHaveBeenCalledWith(
      "[storefront] ProductPage: Internal error. Request ID: secret-123 (product.title)",
    );
  });

  it("без помилок мовчить", () => {
    expect(logGraphqlErrors("ProductPage", {})).toBe(false);
    expect(logGraphqlErrors("ProductPage", { errors: [] })).toBe(false);
    expect(hasGraphqlErrors({ errors: null })).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });
});

describe("upstreamErrorResponse", () => {
  it("відповідь 502 українською, без кешування й без тексту магазину", async () => {
    const response = upstreamErrorResponse();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toMatch(/Магазин тимчасово не відповідає/);
    expect(upstreamErrorResponse(503).status).toBe(503);
  });
});

describe("requireData", () => {
  it("повертає дані, коли помилок немає", () => {
    expect(requireData("Q", { data: { shop: 1 } })).toEqual({ shop: 1 });
    expect(log).not.toHaveBeenCalled();
  });

  it("часткові дані з помилками повертає і пише помилки в журнал", () => {
    expect(requireData("Q", { data: { shop: null }, errors: ERRORS })).toEqual({ shop: null });
    expect(log).toHaveBeenCalledOnce();
  });

  it("без даних кидає 502 і не розкриває текст помилки магазину", async () => {
    const error = thrown(() => requireData("Q", { data: null, errors: ERRORS }));

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("відповідь без даних і без помилок — теж 502", () => {
    const error = thrown(() => requireData("Q", { data: undefined }));

    expect((error as Response).status).toBe(502);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("відповідь без даних"));
  });
});

describe("requireEntity", () => {
  type Data = { product: { title: string } | null };
  const pick = (data: Data) => data.product;

  it("сутність є — повертає її", () => {
    expect(requireEntity("P", { data: { product: { title: "iPhone" } } }, pick)).toEqual({
      title: "iPhone",
    });
  });

  it("сутності немає й помилок немає — null (маршрут відповідає 404)", () => {
    expect(requireEntity<Data, Data["product"]>("P", { data: { product: null } }, pick)).toBeNull();
    expect(log).not.toHaveBeenCalled();
  });

  it("сутності немає, а помилки є — 502, а не 404", () => {
    const error = thrown(() =>
      requireEntity<Data, Data["product"]>("P", { data: { product: null }, errors: ERRORS }, pick),
    );

    expect((error as Response).status).toBe(502);
  });

  it("відповідь без даних — 502 і з помилками, і без них", () => {
    for (const result of [{ data: null, errors: ERRORS }, { data: null }]) {
      const error = thrown(() => requireEntity<Data, Data["product"]>("P", result, pick));
      expect((error as Response).status).toBe(502);
    }
  });

  it("сутність є, а помилка в другорядному полі — повертає сутність і пише в журнал", () => {
    const result = { data: { product: { title: "iPhone" } }, errors: ERRORS };

    expect(requireEntity("P", result, pick)).toEqual({ title: "iPhone" });
    expect(log).toHaveBeenCalledOnce();
  });
});

describe("optionalData", () => {
  it("повертає дані", async () => {
    expect(await optionalData("R", async () => ({ data: { items: [1] } }))).toEqual({ items: [1] });
  });

  it("помилки GraphQL пише в журнал і повертає те, що прийшло", async () => {
    expect(
      await optionalData<{ items: null }>("R", async () => ({ data: null, errors: ERRORS })),
    ).toBeNull();
    expect(
      await optionalData("R", async () => ({ data: { items: null }, errors: ERRORS })),
    ).toEqual({ items: null });
    expect(log).toHaveBeenCalledTimes(2);
  });

  it("збій мережі не кидає далі", async () => {
    const data = await optionalData<unknown>("R", async () => {
      throw new Error("network");
    });

    expect(data).toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("R"), expect.any(Error));
  });
});

describe("withoutCursor", () => {
  it("прибирає after і before, решту параметрів лишає", () => {
    expect(withoutCursor("https://sad.example/search?q=mac&after=abc&sort_by=price")).toBe(
      "/search?q=mac&sort_by=price",
    );
    expect(withoutCursor(new URL("https://sad.example/blogs/blog?before=abc"))).toBe("/blogs/blog");
  });

  it("без курсора повертає null", () => {
    expect(withoutCursor("https://sad.example/search?q=mac")).toBeNull();
  });
});

describe("redirectToFirstPageOnError", () => {
  it("помилка й курсор в адресі — перехід 302 на першу сторінку", () => {
    const error = thrown(() =>
      redirectToFirstPageOnError(
        "SearchPage",
        { errors: [{ message: "invalid cursor" }] },
        "https://sad.example/search?q=x&after=garbage",
      ),
    );

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(302);
    expect((error as Response).headers.get("Location")).toBe("/search?q=x");
  });

  it("без курсора або без помилок нічого не робить", () => {
    expect(
      thrown(() =>
        redirectToFirstPageOnError("S", { errors: ERRORS }, "https://sad.example/search?q=x"),
      ),
    ).toBeUndefined();
    expect(
      thrown(() => redirectToFirstPageOnError("S", {}, "https://sad.example/search?q=x&after=abc")),
    ).toBeUndefined();
  });
});
