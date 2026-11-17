import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MARKETING_SUBSCRIBE_MUTATION,
  MARKETING_UNSUBSCRIBE_MUTATION,
  PROFILE_PHONE_MUTATION,
  PROFILE_PHONE_QUERY,
  PROFILE_QUERY,
  PROFILE_UPDATE_MUTATION,
} from "~/graphql/queries/account-profile.query";

import type { CustomerAccess } from "./api";
import {
  firstInvalidField,
  mapCustomerUserErrors,
  mapMarketingUserErrors,
  mapPhoneUserErrors,
  marketingStatus,
  readProfileForm,
  runProfileAction,
  validateProfile,
} from "./profile";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("readProfileForm", () => {
  it("обрізає краї й зайві пробіли всередині", () => {
    expect(
      readProfileForm(form({ firstName: "  Олена ", lastName: "Коваль   Петренко", phone: " " })),
    ).toEqual({ firstName: "Олена", lastName: "Коваль Петренко", phone: "" });
  });

  it("відсутні поля читає як порожні", () => {
    expect(readProfileForm(new FormData())).toEqual({ firstName: "", lastName: "", phone: "" });
  });
});

describe("validateProfile", () => {
  it("приймає звичайні й незвичні імена та нормалізує телефон", () => {
    for (const firstName of ["Олена", "Анна-Марія", "Мар'яна", "Д’Артаньян", "John", "Ян"]) {
      expect(validateProfile({ firstName, lastName: "", phone: "" })).toEqual({
        errors: {},
        phone: null,
      });
    }
    expect(
      validateProfile({ firstName: "Олена", lastName: "Коваль", phone: "(067) 123-45-67" }),
    ).toEqual({ errors: {}, phone: "+380671234567" });
  });

  it("вимагає ім'я, прізвище й телефон лишає необов'язковими", () => {
    expect(validateProfile({ firstName: "", lastName: "", phone: "" }).errors).toEqual({
      firstName: "Вкажіть ім'я.",
    });
  });

  it.each([
    ["самі цифри", "12345", "Ім'я має містити літери."],
    ["самі знаки", "---", "Ім'я має містити літери."],
    ["посилання", "www.spam.example", "Ім'я не може містити посилань і символів < >."],
    ["HTML", "<b>Олена</b>", "Ім'я не може містити посилань і символів < >."],
    ["задовге", "О".repeat(61), "Ім'я задовге: до 60 символів."],
  ])("відсікає сміття в імені: %s", (_name, firstName, message) => {
    expect(validateProfile({ firstName, lastName: "", phone: "" }).errors.firstName).toBe(message);
  });

  it("перевіряє прізвище за тими самими правилами й називає його в повідомленні", () => {
    expect(
      validateProfile({ firstName: "Олена", lastName: "http://x.example", phone: "" }).errors,
    ).toEqual({ lastName: "Прізвище не може містити посилань і символів < >." });
  });

  it("незрозумілий телефон — помилка з прикладом формату", () => {
    const { errors, phone } = validateProfile({ firstName: "Олена", lastName: "", phone: "12345" });

    expect(phone).toBeNull();
    expect(errors.phone).toBe("Перевірте номер: потрібні код оператора й сім цифр, як у прикладі.");
  });
});

describe("firstInvalidField", () => {
  it("повертає перше поле з помилкою в порядку форми", () => {
    expect(firstInvalidField({ phone: "x", lastName: "y" })).toBe("lastName");
    expect(firstInvalidField({ phone: "x" })).toBe("phone");
    expect(firstInvalidField({})).toBeNull();
  });
});

describe("переклад userErrors", () => {
  it("customerUpdate: помилка поля стає повідомленням біля поля, без тексту API", () => {
    const mapped = mapCustomerUserErrors([
      { code: "TOO_LONG", field: ["input", "firstName"], message: "First name is too long" },
      { code: "CONTAINS_URL", field: ["input", "lastName"], message: "Last name contains URL" },
    ]);

    expect(mapped).toEqual({
      errors: {
        firstName: "Ім'я задовге: скоротіть його.",
        lastName: "Прізвище не може містити посилань і символів < >.",
      },
    });
  });

  it("customerUpdate: невідомий код поля — нейтральне пояснення, помилка без поля — загальна відмова", () => {
    expect(
      mapCustomerUserErrors([{ code: "BRAND_NEW", field: ["input", "firstName"], message: "Nope" }])
        .errors.firstName,
    ).toBe("Магазин не прийняв це значення. Перевірте, чи ім'я написано без зайвих символів.");
    expect(
      mapCustomerUserErrors([{ code: "CUSTOMER_DOES_NOT_EXIST", field: null, message: "Gone" }]),
    ).toEqual({ errors: {}, failure: "failed" });
  });

  it("customerAddressUpdate: відхилений номер — помилка поля телефону", () => {
    const byCode = mapPhoneUserErrors([
      { code: "PHONE_NUMBER_NOT_VALID", field: ["address"], message: "Phone number is not valid" },
    ]);
    const byField = mapPhoneUserErrors([
      { code: "INVALID", field: ["address", "phoneNumber"], message: "Invalid" },
    ]);

    expect(byCode.errors.phone).toMatch(/Магазин не прийняв цей номер/);
    expect(byCode.errors.phone).not.toMatch(/not valid/i);
    expect(byField.errors.phone).toBe(byCode.errors.phone);
    expect(byCode.failure).toBeUndefined();
  });

  it("customerAddressUpdate: інші помилки адреси — загальна відмова", () => {
    expect(
      mapPhoneUserErrors([
        { code: "ADDRESS_ID_DOES_NOT_EXIST", field: ["addressId"], message: "x" },
      ]),
    ).toEqual({ errors: {}, failure: "failed" });
  });

  it("розсилка: «уже підписано» — це успіх, немає пошти — окрема причина", () => {
    expect(mapMarketingUserErrors([{ code: "CUSTOMER_ALREADY_SUBSCRIBED" }])).toBe("ok");
    expect(mapMarketingUserErrors([{ code: "EMAIL_ADDRESS_NOT_FOUND" }])).toBe("no-email");
    expect(mapMarketingUserErrors([{ code: "FAILED_TO_SUBSCRIBE" }])).toBe("failed");
    expect(mapMarketingUserErrors([{ code: "SOMETHING_NEW" }])).toBe("failed");
  });
});

describe("marketingStatus", () => {
  it("зводить стани API до станів перемикача", () => {
    expect(marketingStatus("SUBSCRIBED")).toBe("subscribed");
    expect(marketingStatus("PENDING")).toBe("pending");
    expect(marketingStatus("NOT_SUBSCRIBED")).toBe("unsubscribed");
    expect(marketingStatus("UNSUBSCRIBED")).toBe("unsubscribed");
    for (const state of ["INVALID", "REDACTED", "SOMETHING_NEW", null, undefined]) {
      expect(marketingStatus(state)).toBe("unavailable");
    }
  });
});

type Handler = (variables: unknown) => unknown;

/** Клієнт Customer Account API, який відповідає за документом запиту. */
function mockAccess(handlers: Map<unknown, Handler>) {
  const graphql = vi.fn(async (document: unknown, options: { variables?: unknown }) => {
    const handler = handlers.get(document);
    if (!handler) throw new Error("unexpected document");
    return handler(options.variables);
  });
  const access = { client: { graphql }, accessToken: "token" } as unknown as CustomerAccess;
  const calls = (document: unknown) => graphql.mock.calls.filter(([doc]) => doc === document);
  return { access, graphql, calls };
}

const CURRENT = {
  data: { customer: { firstName: "Олена", lastName: "Коваль", emailAddress: null } },
};
const ADDRESS = {
  data: {
    customer: {
      defaultAddress: { id: "gid://shopify/CustomerAddress/7", phoneNumber: "+380671234567" },
    },
  },
};
const NAME_OK = {
  data: { customerUpdate: { customer: { firstName: "x", lastName: "y" }, userErrors: [] } },
};
const PHONE_OK = {
  data: {
    customerAddressUpdate: { customerAddress: { id: "a", phoneNumber: "p" }, userErrors: [] },
  },
};

const PROFILE_FORM = {
  intent: "profile",
  firstName: " Олена ",
  lastName: "Коваль",
  phone: "067 123 45 67",
};

describe("runProfileAction", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("невідомий intent повертає null і не ходить в API", async () => {
    const { access, graphql } = mockAccess(new Map());

    expect(await runProfileAction(access, form({ intent: "delete-everything" }))).toBeNull();
    expect(
      await runProfileAction(access, form({ intent: "marketing", marketing: "maybe" })),
    ).toBeNull();
    expect(graphql).not.toHaveBeenCalled();
  });

  it("помилки перевірки повертає з введеними значеннями й не ходить в API", async () => {
    const { access, graphql } = mockAccess(new Map());

    const result = await runProfileAction(
      access,
      form({ intent: "profile", firstName: "", lastName: "Коваль", phone: "абв" }),
    );

    expect(result).toEqual({
      intent: "profile",
      ok: false,
      values: { firstName: "", lastName: "Коваль", phone: "абв" },
      errors: { firstName: "Вкажіть ім'я.", phone: expect.stringMatching(/Перевірте номер/) },
      failure: undefined,
    });
    expect(graphql).not.toHaveBeenCalled();
  });

  it("нічого не змінилось: мутацій немає, результат успішний", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
      ]),
    );

    const result = await runProfileAction(access, form(PROFILE_FORM));

    expect(result).toEqual({
      intent: "profile",
      ok: true,
      values: { firstName: "Олена", lastName: "Коваль", phone: "067 123 45 67" },
    });
    expect(calls(PROFILE_UPDATE_MUTATION)).toHaveLength(0);
    expect(calls(PROFILE_PHONE_MUTATION)).toHaveLength(0);
  });

  it("зберігає нове ім'я й телефон основної адреси у форматі E.164", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [PROFILE_UPDATE_MUTATION, () => NAME_OK],
        [PROFILE_PHONE_MUTATION, () => PHONE_OK],
      ]),
    );

    const result = await runProfileAction(
      access,
      form({ intent: "profile", firstName: "Олеся", lastName: "", phone: "(050) 111-22-33" }),
    );

    expect(result?.ok).toBe(true);
    expect(calls(PROFILE_PHONE_MUTATION)[0]?.[1]).toEqual({
      accessToken: "token",
      variables: {
        addressId: "gid://shopify/CustomerAddress/7",
        address: { phoneNumber: "+380501112233" },
      },
    });
    expect(calls(PROFILE_UPDATE_MUTATION)[0]?.[1]).toEqual({
      accessToken: "token",
      variables: { input: { firstName: "Олеся", lastName: null } },
    });
  });

  it("порожнє поле телефону прибирає номер з адреси", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [PROFILE_PHONE_MUTATION, () => PHONE_OK],
      ]),
    );

    const result = await runProfileAction(access, form({ ...PROFILE_FORM, phone: "" }));

    expect(result?.ok).toBe(true);
    expect(calls(PROFILE_PHONE_MUTATION)[0]?.[1]).toMatchObject({
      variables: { address: { phoneNumber: null } },
    });
  });

  it("вимкнене поле телефону не надсилається — номер в адресі не чіпаємо", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
      ]),
    );

    const result = await runProfileAction(
      access,
      form({ intent: "profile", firstName: "Олена", lastName: "Коваль" }),
    );

    expect(result?.ok).toBe(true);
    expect(calls(PROFILE_PHONE_MUTATION)).toHaveLength(0);
  });

  it("без адреси доставки телефон зберегти нікуди: помилка поля, ім'я не змінюється", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ({ data: { customer: { defaultAddress: null } } })],
      ]),
    );

    const result = await runProfileAction(access, form({ ...PROFILE_FORM, firstName: "Олеся" }));

    expect(result).toMatchObject({
      ok: false,
      errors: { phone: expect.stringMatching(/разом з адресою доставки/) },
    });
    expect(calls(PROFILE_UPDATE_MUTATION)).toHaveLength(0);
  });

  it("userErrors телефону стають помилкою поля; ім'я після цього не зберігається", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [
          PROFILE_PHONE_MUTATION,
          () => ({
            data: {
              customerAddressUpdate: {
                customerAddress: null,
                userErrors: [
                  {
                    code: "PHONE_NUMBER_NOT_VALID",
                    field: ["address", "phoneNumber"],
                    message: "Phone number is not valid",
                  },
                ],
              },
            },
          }),
        ],
      ]),
    );

    const result = await runProfileAction(
      access,
      form({ ...PROFILE_FORM, firstName: "Олеся", phone: "050 111 22 33" }),
    );

    expect(result).toMatchObject({
      intent: "profile",
      ok: false,
      values: { firstName: "Олеся", phone: "050 111 22 33" },
      errors: { phone: expect.stringMatching(/Магазин не прийняв цей номер/) },
    });
    expect(JSON.stringify(result)).not.toMatch(/not valid/i);
    expect(calls(PROFILE_UPDATE_MUTATION)).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[customer-account\] AccountProfilePhoneUpdate userErrors: /),
    );
  });

  it("відмова через права доступу — «forbidden», тимчасовий збій — «failed»; обидва в журналі", async () => {
    const denied = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [
          PROFILE_UPDATE_MUTATION,
          () => ({
            data: null,
            errors: [
              {
                message: "Access denied for customerUpdate field.",
                path: ["customerUpdate"],
                extensions: { code: "ACCESS_DENIED" },
              },
            ],
          }),
        ],
      ]),
    );
    const broken = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [
          PROFILE_UPDATE_MUTATION,
          () => {
            throw new Error("Customer Account API responded with 500");
          },
        ],
      ]),
    );
    const renamed = form({ ...PROFILE_FORM, firstName: "Олеся" });

    expect(await runProfileAction(denied.access, renamed)).toMatchObject({
      ok: false,
      errors: {},
      failure: "forbidden",
    });
    expect(await runProfileAction(broken.access, renamed)).toMatchObject({
      ok: false,
      errors: {},
      failure: "failed",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountProfileUpdate: Access denied for customerUpdate field. (customerUpdate)",
    );
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountProfileUpdate: Customer Account API responded with 500",
    );
  });

  it("якщо поточний профіль прочитати не вдалося, ім'я все одно зберігається", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => ({ data: null, errors: [{ message: "boom" }] })],
        [PROFILE_PHONE_QUERY, () => ADDRESS],
        [PROFILE_UPDATE_MUTATION, () => NAME_OK],
      ]),
    );

    const result = await runProfileAction(access, form(PROFILE_FORM));

    expect(result?.ok).toBe(true);
    expect(calls(PROFILE_UPDATE_MUTATION)).toHaveLength(1);
  });

  it("розсилка: викликає потрібну мутацію й повертає, що саме зроблено", async () => {
    const payload = (name: string) => ({
      data: { [name]: { emailAddress: { marketingState: "SUBSCRIBED" }, userErrors: [] } },
    });
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([
        [MARKETING_SUBSCRIBE_MUTATION, () => payload("customerEmailMarketingSubscribe")],
        [MARKETING_UNSUBSCRIBE_MUTATION, () => payload("customerEmailMarketingUnsubscribe")],
      ]),
    );

    expect(
      await runProfileAction(access, form({ intent: "marketing", marketing: "subscribe" })),
    ).toEqual({ intent: "marketing", ok: true, target: "subscribe" });
    expect(
      await runProfileAction(access, form({ intent: "marketing", marketing: "unsubscribe" })),
    ).toEqual({ intent: "marketing", ok: true, target: "unsubscribe" });
    expect(calls(MARKETING_SUBSCRIBE_MUTATION)).toHaveLength(1);
    expect(calls(MARKETING_UNSUBSCRIBE_MUTATION)).toHaveLength(1);
  });

  it("розсилка: userErrors і відмова в доступі дають спокійний стан без тексту API", async () => {
    const { access } = mockAccess(
      new Map<unknown, Handler>([
        [
          MARKETING_SUBSCRIBE_MUTATION,
          () => ({
            data: {
              customerEmailMarketingSubscribe: {
                emailAddress: null,
                userErrors: [
                  { code: "FAILED_TO_SUBSCRIBE", field: null, message: "Subscription failed" },
                ],
              },
            },
          }),
        ],
        [
          MARKETING_UNSUBSCRIBE_MUTATION,
          () => {
            throw Object.assign(new Error("Customer Account API responded with 403"), {
              status: 403,
            });
          },
        ],
      ]),
    );

    expect(
      await runProfileAction(access, form({ intent: "marketing", marketing: "subscribe" })),
    ).toEqual({ intent: "marketing", ok: false, target: "subscribe", failure: "failed" });
    expect(
      await runProfileAction(access, form({ intent: "marketing", marketing: "unsubscribe" })),
    ).toEqual({ intent: "marketing", ok: false, target: "unsubscribe", failure: "forbidden" });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountMarketingUnsubscribe: Customer Account API responded with 403 (HTTP 403)",
    );
  });
});
