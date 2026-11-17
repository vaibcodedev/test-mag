import { describe, expect, it } from "vitest";

import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    "+380671234567",
    "+380 67 123 45 67",
    "+38 (067) 123-45-67",
    "380671234567",
    "0671234567",
    "067 123 45 67",
    "(067) 123-45-67",
    "067.123.45.67",
    "8 067 123 45 67",
    "671234567",
    "00380671234567",
    "  067 123 45 67  ",
  ])("зводить український номер до E.164: %s", (input) => {
    expect(normalizePhone(input)).toEqual({ ok: true, value: "+380671234567" });
  });

  it("приймає номер іншої країни лише з плюсом і кодом країни", () => {
    expect(normalizePhone("+48 601 234 567")).toEqual({ ok: true, value: "+48601234567" });
    expect(normalizePhone("0048 601 234 567")).toEqual({ ok: true, value: "+48601234567" });
  });

  it.each([null, undefined, "", "   ", "( ) -"])(
    "порожнє поле — це не помилка формату: %s",
    (input) => {
      expect(normalizePhone(input)).toEqual({ ok: false, reason: "empty" });
    },
  );

  it.each([
    ["літери", "067 123 45 6x"],
    ["закороткий", "067 123 45"],
    ["задовгий", "067 123 45 67 8"],
    ["код оператора з нуля", "+380 07 123 45 67"],
    ["плюс посередині", "067+1234567"],
    ["самий плюс", "+"],
    ["закороткий міжнародний", "+48 601"],
    ["задовгий міжнародний", "+1234567890123456"],
    ["текст", "подзвоніть мені"],
  ])("відкидає те, що не є номером: %s", (_name, input) => {
    expect(normalizePhone(input)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("formatPhone", () => {
  it("розбиває український номер на групи", () => {
    expect(formatPhone("+380671234567")).toBe("+380 67 123 45 67");
  });

  it("інші номери й порожнє значення лишає як є", () => {
    expect(formatPhone("+48601234567")).toBe("+48601234567");
    expect(formatPhone(null)).toBe("");
    expect(formatPhone("  ")).toBe("");
  });
});
