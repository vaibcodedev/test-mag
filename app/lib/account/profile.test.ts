import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MARKETING_SUBSCRIBE_MUTATION,
  MARKETING_UNSUBSCRIBE_MUTATION,
  PROFILE_QUERY,
  PROFILE_UPDATE_MUTATION,
} from "~/graphql/queries/account-profile.query";

import type { CustomerAccess } from "./api";
import {
  firstInvalidField,
  mapCustomerUserErrors,
  mapMarketingUserErrors,
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
    expect(readProfileForm(form({ firstName: "  Олена ", lastName: "Коваль   Петренко" }))).toEqual(
      { firstName: "Олена", lastName: "Коваль Петренко" },
    );
  });

  it("відсутні поля читає як порожні, зайві — не бере", () => {
    expect(readProfileForm(new FormData())).toEqual({ firstName: "", lastName: "" });
    expect(readProfileForm(form({ firstName: "Олена", phone: "067 123 45 67" }))).toEqual({
      firstName: "Олена",
      lastName: "",
    });
  });
});

describe("validateProfile", () => {
  it("приймає звичайні й незвичні імена", () => {
    for (const firstName of ["Олена", "Анна-Марія", "Мар'яна", "Д’Артаньян", "John", "Ян"]) {
      expect(validateProfile({ firstName, lastName: "" })).toEqual({});
    }
    expect(validateProfile({ firstName: "Олена", lastName: "Коваль-Петренко" })).toEqual({});
  });

  it("вимагає ім'я, прізвище лишає необов'язковим", () => {
    expect(validateProfile({ firstName: "", lastName: "" })).toEqual({
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
    expect(validateProfile({ firstName, lastName: "" }).firstName).toBe(message);
  });

  it("перевіряє прізвище за тими самими правилами й називає його в повідомленні", () => {
    expect(validateProfile({ firstName: "Олена", lastName: "http://x.example" })).toEqual({
      lastName: "Прізвище не може містити посилань і символів < >.",
    });
  });
});

describe("firstInvalidField", () => {
  it("повертає перше поле з помилкою в порядку форми", () => {
    expect(firstInvalidField({ lastName: "y", firstName: "x" })).toBe("firstName");
    expect(firstInvalidField({ lastName: "y" })).toBe("lastName");
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
const NAME_OK = {
  data: { customerUpdate: { customer: { firstName: "x", lastName: "y" }, userErrors: [] } },
};

const PROFILE_FORM = { intent: "profile", firstName: " Олена ", lastName: "Коваль" };
const RENAMED_FORM = { ...PROFILE_FORM, firstName: "Олеся" };

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
      form({ intent: "profile", firstName: "", lastName: "www.spam.example" }),
    );

    expect(result).toEqual({
      intent: "profile",
      ok: false,
      values: { firstName: "", lastName: "www.spam.example" },
      errors: {
        firstName: "Вкажіть ім'я.",
        lastName: "Прізвище не може містити посилань і символів < >.",
      },
      failure: undefined,
    });
    expect(graphql).not.toHaveBeenCalled();
  });

  it("нічого не змінилось: мутації немає, результат успішний", async () => {
    const { access, calls } = mockAccess(
      new Map<unknown, Handler>([[PROFILE_QUERY, () => CURRENT]]),
    );

    const result = await runProfileAction(access, form(PROFILE_FORM));

    expect(result).toEqual({
      intent: "profile",
      ok: true,
      values: { firstName: "Олена", lastName: "Коваль" },
    });
    expect(calls(PROFILE_UPDATE_MUTATION)).toHaveLength(0);
  });

  it("зберігає нове ім'я; порожнє прізвище надсилає як null", async () => {
    const { access, graphql, calls } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [PROFILE_UPDATE_MUTATION, () => NAME_OK],
      ]),
    );

    const result = await runProfileAction(
      access,
      form({ intent: "profile", firstName: "Олеся", lastName: "" }),
    );

    expect(result).toEqual({
      intent: "profile",
      ok: true,
      values: { firstName: "Олеся", lastName: "" },
    });
    expect(calls(PROFILE_UPDATE_MUTATION)[0]?.[1]).toEqual({
      accessToken: "token",
      variables: { input: { firstName: "Олеся", lastName: null } },
    });
    // Лише читання профілю й одна мутація: адрес і телефону форма не чіпає.
    expect(graphql).toHaveBeenCalledTimes(2);
  });

  it("userErrors імені стають помилками полів без тексту API й потрапляють у журнал", async () => {
    const { access } = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
        [
          PROFILE_UPDATE_MUTATION,
          () => ({
            data: {
              customerUpdate: {
                customer: null,
                userErrors: [
                  {
                    code: "TOO_LONG",
                    field: ["input", "firstName"],
                    message: "First name is too long",
                  },
                ],
              },
            },
          }),
        ],
      ]),
    );

    const result = await runProfileAction(access, form(RENAMED_FORM));

    expect(result).toMatchObject({
      intent: "profile",
      ok: false,
      values: { firstName: "Олеся", lastName: "Коваль" },
      errors: { firstName: "Ім'я задовге: скоротіть його." },
    });
    expect(JSON.stringify(result)).not.toMatch(/too long/i);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[customer-account\] AccountProfileUpdate userErrors: TOO_LONG /),
    );
  });

  it("відмова через права доступу — «forbidden», тимчасовий збій — «failed»; обидва в журналі", async () => {
    const denied = mockAccess(
      new Map<unknown, Handler>([
        [PROFILE_QUERY, () => CURRENT],
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
        [
          PROFILE_UPDATE_MUTATION,
          () => {
            throw new Error("Customer Account API responded with 500");
          },
        ],
      ]),
    );

    expect(await runProfileAction(denied.access, form(RENAMED_FORM))).toMatchObject({
      ok: false,
      errors: {},
      failure: "forbidden",
    });
    expect(await runProfileAction(broken.access, form(RENAMED_FORM))).toMatchObject({
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
