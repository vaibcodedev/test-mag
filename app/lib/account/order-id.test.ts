import { describe, expect, it } from "vitest";

import { orderIdToParam, orderParamToId, orderPath, orderReorderPath } from "./order-id";

describe("адреса замовлення", () => {
  it("перетворює gid на число для адреси й назад", () => {
    const id = "gid://shopify/Order/6123456789012";

    expect(orderIdToParam(id)).toBe("6123456789012");
    expect(orderParamToId("6123456789012")).toBe(id);
    expect(orderPath(id)).toBe("/account/orders/6123456789012");
    expect(orderReorderPath(id)).toBe("/account/orders/6123456789012/reorder");
  });

  it.each([
    ["порожній рядок", ""],
    ["інший тип ресурсу", "gid://shopify/DraftOrder/1"],
    ["хвіст із параметрами", "gid://shopify/Order/1?key=abc"],
    ["не число", "gid://shopify/Order/abc"],
    ["просто число", "42"],
  ])("не будує адресу з незрозумілого ідентифікатора: %s", (_name, id) => {
    expect(orderIdToParam(id)).toBeNull();
    expect(orderPath(id)).toBeNull();
    expect(orderReorderPath(id)).toBeNull();
  });

  it.each([
    ["порожньо", ""],
    ["undefined", undefined],
    ["літери", "abc"],
    ["gid у параметрі", "gid://shopify/Order/1"],
    ["шлях угору", "../1"],
    ["пробіл", "1 2"],
    ["задовге число", "1".repeat(21)],
    ["від'ємне число", "-1"],
  ])("відкидає параметр адреси, який не є числом: %s", (_name, param) => {
    expect(orderParamToId(param)).toBeNull();
  });
});
