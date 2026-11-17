import { describe, expect, it } from "vitest";

import { addressLines, cancelReasonLabel, shipmentStatus, trackingHref } from "./shipment-status";

describe("shipmentStatus", () => {
  it("бере останню подію перевізника, а без неї — стан відправлення", () => {
    expect(shipmentStatus({ latestShipmentStatus: "IN_TRANSIT", status: "SUCCESS" })).toEqual({
      label: "У дорозі",
      tone: "neutral",
    });
    expect(shipmentStatus({ latestShipmentStatus: null, status: "SUCCESS" })).toEqual({
      label: "Відправлено",
      tone: "neutral",
    });
    expect(shipmentStatus({ latestShipmentStatus: "DELIVERED" })?.tone).toBe("positive");
  });

  it("невідомі коди не показує: англійський текст на сторінку не потрапляє", () => {
    expect(shipmentStatus({ latestShipmentStatus: "TELEPORTED", status: "WARPED" })).toBeNull();
    expect(shipmentStatus({ latestShipmentStatus: "TELEPORTED", status: "SUCCESS" })?.label).toBe(
      "Відправлено",
    );
    expect(shipmentStatus({ latestShipmentStatus: "toString" })).toBeNull();
    expect(shipmentStatus({})).toBeNull();
  });
});

describe("cancelReasonLabel", () => {
  it("пояснює лише зрозумілі покупцеві причини", () => {
    expect(cancelReasonLabel("CUSTOMER")).toBe("на ваше прохання");
    expect(cancelReasonLabel("INVENTORY")).toBe("товару не виявилося в наявності");
    expect(cancelReasonLabel("FRAUD")).toBeNull();
    expect(cancelReasonLabel("OTHER")).toBeNull();
    expect(cancelReasonLabel(null)).toBeNull();
  });
});

describe("trackingHref", () => {
  it("пропускає лише http(s)", () => {
    expect(trackingHref("https://novaposhta.ua/tracking/?cargo_number=5900")).toBe(
      "https://novaposhta.ua/tracking/?cargo_number=5900",
    );
    expect(trackingHref("javascript:alert(1)")).toBeNull();
    expect(trackingHref("не адреса")).toBeNull();
    expect(trackingHref(null)).toBeNull();
  });
});

describe("addressLines", () => {
  it("складає адресу рядками й не дописує Україну", () => {
    expect(
      addressLines({
        name: "Олена Коваль",
        address1: "вул. Соборна, 12",
        address2: "кв. 5",
        city: "Вінниця",
        zip: "21050",
        province: "Вінницька область",
        country: "Ukraine",
      }),
    ).toEqual(["Олена Коваль", "вул. Соборна, 12, кв. 5", "21050 Вінниця", "Вінницька область"]);
  });

  it("іншу країну називає, порожні частини пропускає", () => {
    expect(addressLines({ address1: "ul. Długa 1", city: "Kraków", country: "Poland" })).toEqual([
      "ul. Długa 1",
      "Kraków",
      "Poland",
    ]);
    expect(addressLines(null)).toEqual([]);
    expect(addressLines({ name: "  " })).toEqual([]);
  });
});
