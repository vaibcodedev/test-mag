import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MARKETING_SUBSCRIBE_MUTATION,
  PROFILE_MARKETING_QUERY,
  PROFILE_QUERY,
} from "~/graphql/queries/account-profile.query";
import { accountTestContext, thrownResponse } from "~/lib/account/testing";

import { action, loader } from "./account.profile";

type LoaderArgs = Parameters<typeof loader>[0];
type ActionArgs = Parameters<typeof action>[0];
type Handler = (variables: unknown) => unknown;

const BASE = {
  data: {
    customer: {
      firstName: "Олена",
      lastName: "Коваль",
      emailAddress: { emailAddress: "olena@example.com" },
    },
  },
};
const MARKETING = { data: { customer: { emailAddress: { marketingState: "SUBSCRIBED" } } } };
const READY = new Map<unknown, Handler>([
  [PROFILE_QUERY, () => BASE],
  [PROFILE_MARKETING_QUERY, () => MARKETING],
]);

function load(options: Parameters<typeof accountTestContext>[0] = {}) {
  const test = accountTestContext(options);
  const args = {
    request: new Request("https://ionov.example/account/profile"),
    context: test.context,
    params: {},
  } as unknown as LoaderArgs;
  return { ...test, run: () => loader(args) };
}

function submit(
  fields: Record<string, string>,
  options: Parameters<typeof accountTestContext>[0] = {},
) {
  const test = accountTestContext(options);
  const args = {
    request: new Request("https://ionov.example/account/profile", {
      method: "POST",
      body: new URLSearchParams(fields),
    }),
    context: test.context,
    params: {},
  } as unknown as ActionArgs;
  return { ...test, run: () => action(args) };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /account/profile", () => {
  it("збирає профіль з основного запиту й запиту розсилки", async () => {
    expect(await load({ customer: READY }).run()).toEqual({
      status: "ready",
      profile: {
        firstName: "Олена",
        lastName: "Коваль",
        email: "olena@example.com",
        marketing: "subscribed",
      },
    });
  });

  it.each(["signed-out", "unavailable"] as const)(
    "без входу (%s) відправляє на сторінку кабінету",
    async (session) => {
      const { run, customerGraphql } = load({ session, customer: READY });

      const response = await thrownResponse(run);
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/account");
      expect(customerGraphql).not.toHaveBeenCalled();
    },
  );

  it("збій основного запиту — стан помилки з записом у журнал", async () => {
    const withErrors = load({
      customer: new Map(READY).set(PROFILE_QUERY, () => ({
        data: null,
        errors: [{ message: "Internal error", path: ["customer"] }],
      })),
    });
    const thrown = load({
      customer: new Map(READY).set(PROFILE_QUERY, () => {
        throw new Error("timeout");
      }),
    });

    expect(await withErrors.run()).toEqual({ status: "error" });
    expect(await thrown.run()).toEqual({ status: "error" });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountProfile: Internal error (customer)",
    );
    expect(console.error).toHaveBeenCalledWith("[customer-account] AccountProfile: timeout");
  });

  it("без стану розсилки з API перемикач стає недоступним, решта працює", async () => {
    const { run } = load({
      customer: new Map(READY).set(PROFILE_MARKETING_QUERY, () => ({
        data: null,
        errors: [{ message: "Field 'marketingState' doesn't exist" }],
      })),
    });

    expect(await run()).toEqual({
      status: "ready",
      profile: {
        firstName: "Олена",
        lastName: "Коваль",
        email: "olena@example.com",
        marketing: "unavailable",
      },
    });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountProfileMarketing: Field 'marketingState' doesn't exist (-)",
    );
  });

  it("покупець без імені й пошти: розсилка недоступна", async () => {
    const { run } = load({
      customer: new Map(READY).set(PROFILE_QUERY, () => ({
        data: { customer: { firstName: null, lastName: null, emailAddress: null } },
      })),
    });

    expect(await run()).toEqual({
      status: "ready",
      profile: { firstName: null, lastName: null, email: null, marketing: "unavailable" },
    });
  });
});

describe("POST /account/profile", () => {
  it("без входу відправляє на сторінку кабінету й нічого не зберігає", async () => {
    const { run, customerGraphql } = submit(
      { intent: "profile", firstName: "Олена" },
      { session: "signed-out" },
    );

    const response = await thrownResponse(run);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/account");
    expect(customerGraphql).not.toHaveBeenCalled();
  });

  it("невідомий intent — 400", async () => {
    const { run } = submit({ intent: "something" });

    expect((await thrownResponse(run)).status).toBe(400);
  });

  it("помилки перевірки повертає з введеними значеннями", async () => {
    const { run, customerGraphql } = submit({
      intent: "profile",
      firstName: "  ",
      lastName: "<b>Коваль</b>",
    });

    expect(await run()).toMatchObject({
      intent: "profile",
      ok: false,
      values: { firstName: "", lastName: "<b>Коваль</b>" },
      errors: {
        firstName: "Вкажіть ім'я.",
        lastName: "Прізвище не може містити посилань і символів < >.",
      },
    });
    expect(customerGraphql).not.toHaveBeenCalled();
  });

  it("збій API під час збереження — спокійна відмова без тексту API", async () => {
    const { run } = submit(
      { intent: "marketing", marketing: "subscribe" },
      {
        customer: new Map<unknown, Handler>([
          [
            MARKETING_SUBSCRIBE_MUTATION,
            () => ({
              data: null,
              errors: [{ message: "Access denied", extensions: { code: "ACCESS_DENIED" } }],
            }),
          ],
        ]),
      },
    );

    expect(await run()).toEqual({
      intent: "marketing",
      ok: false,
      target: "subscribe",
      failure: "forbidden",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[customer-account] AccountMarketingSubscribe: Access denied (-)",
    );
  });
});
