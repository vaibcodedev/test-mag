import {
  MARKETING_SUBSCRIBE_MUTATION,
  MARKETING_UNSUBSCRIBE_MUTATION,
  PROFILE_QUERY,
  PROFILE_UPDATE_MUTATION,
} from "~/graphql/queries/account-profile.query";

import {
  isAccessDenied,
  logAccountErrors,
  logAccountFailure,
  optionalAccountData,
  type CustomerAccess,
} from "./api";

/**
 * Редагування профілю: перевірка форми, виклики Customer Account API й переклад його відповідей.
 *
 * Що можна змінити через API 2026-10:
 *  - ім'я та прізвище — `customerUpdate` (`CustomerUpdateInput` має лише ці два поля;
 *    телефон облікового запису API тільки читає, тому в кабінеті його не редагуємо —
 *    покупець вказує номер під час оформлення замовлення);
 *  - розсилка — `customerEmailMarketingSubscribe` / `customerEmailMarketingUnsubscribe`
 *    (без аргументів, діють на пошту покупця, який увійшов).
 *
 * Сирий текст API (`userErrors[].message`) покупцеві не показуємо: лише власні повідомлення.
 */

export type ProfileField = "firstName" | "lastName";
export type ProfileValues = Record<ProfileField, string>;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

/**
 * Чому не вдалося зберегти: `failed` — тимчасовий збій, варто спробувати ще раз; `forbidden` —
 * магазин не дозволив запис (немає права в налаштуваннях Customer Account API), повтор не допоможе.
 */
export type SaveFailure = "failed" | "forbidden";

export type MarketingTarget = "subscribe" | "unsubscribe";

export type ProfileActionResult =
  | { intent: "profile"; ok: true; values: ProfileValues }
  | {
      intent: "profile";
      ok: false;
      values: ProfileValues;
      errors: ProfileErrors;
      failure?: SaveFailure;
    }
  | { intent: "marketing"; ok: true; target: MarketingTarget }
  | { intent: "marketing"; ok: false; target: MarketingTarget; failure: SaveFailure | "no-email" };

type UserError = {
  code?: string | null;
  field?: ReadonlyArray<string> | null;
  message?: string | null;
};

export const NAME_MAX_LENGTH = 60;

const NAME_LABELS = {
  firstName: { required: "Вкажіть ім'я.", subject: "Ім'я" },
  lastName: { required: "Вкажіть прізвище.", subject: "Прізвище" },
} as const;

/** Стан підписки для перемикача. `pending` — покупець ще не підтвердив підписку з листа. */
export type MarketingStatus = "subscribed" | "pending" | "unsubscribed" | "unavailable";

/**
 * `EmailMarketingState` → стан перемикача. Невідомий код, `INVALID`, `REDACTED` і відсутня
 * відповідь означають одне: керувати підпискою зараз не можна.
 */
export function marketingStatus(state: string | null | undefined): MarketingStatus {
  if (state === "SUBSCRIBED") return "subscribed";
  if (state === "PENDING") return "pending";
  if (state === "NOT_SUBSCRIBED" || state === "UNSUBSCRIBED") return "unsubscribed";
  return "unavailable";
}

/** Обрізає краї й зводить повторні пробіли до одного. */
function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function readProfileForm(formData: FormData): ProfileValues {
  return {
    firstName: clean(formData.get("firstName")),
    lastName: clean(formData.get("lastName")),
  };
}

/**
 * Ім'я не перевіряємо суворо: бувають подвійні імена, апострофи, дефіси, латинка. Відсікаємо
 * лише явне сміття — рядок без жодної літери, посилання, HTML — і те, що API однаково відхилить.
 */
function nameError(field: "firstName" | "lastName", value: string, required: boolean) {
  const { required: requiredMessage, subject } = NAME_LABELS[field];
  if (!value) return required ? requiredMessage : null;
  if (value.length > NAME_MAX_LENGTH) {
    return `${subject} задовге: до ${NAME_MAX_LENGTH} символів.`;
  }
  if (/[<>]/.test(value) || /https?:|:\/\/|www\./i.test(value)) {
    return `${subject} не може містити посилань і символів < >.`;
  }
  if (!/\p{L}/u.test(value)) return `${subject} має містити літери.`;
  return null;
}

/** Перевірка на сервері: ім'я обов'язкове, прізвище — ні. */
export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  const firstName = nameError("firstName", values.firstName, true);
  const lastName = nameError("lastName", values.lastName, false);
  if (firstName) errors.firstName = firstName;
  if (lastName) errors.lastName = lastName;
  return errors;
}

/** Перше поле з помилкою в порядку форми: туди переходить фокус. */
export function firstInvalidField(errors: ProfileErrors): ProfileField | null {
  return (["firstName", "lastName"] as const).find((field) => errors[field]) ?? null;
}

type MappedErrors = { errors: ProfileErrors; failure?: SaveFailure };

/** `userErrors` мутації `customerUpdate` → повідомлення біля поля або загальна відмова. */
export function mapCustomerUserErrors(userErrors: readonly UserError[]): MappedErrors {
  const mapped: MappedErrors = { errors: {} };

  for (const error of userErrors) {
    const field = error.field?.at(-1);
    if (field !== "firstName" && field !== "lastName") {
      mapped.failure = "failed";
      continue;
    }
    const { subject } = NAME_LABELS[field];
    mapped.errors[field] =
      error.code === "TOO_LONG"
        ? `${subject} задовге: скоротіть його.`
        : error.code === "CONTAINS_HTML_TAGS" || error.code === "CONTAINS_URL"
          ? `${subject} не може містити посилань і символів < >.`
          : `Магазин не прийняв це значення. Перевірте, чи ${subject.toLowerCase()} написано без зайвих символів.`;
  }

  return mapped;
}

/**
 * `userErrors` підписки. «Уже підписано» — не помилка: стан збігається з тим, чого хотів
 * покупець. Немає пошти — окремий випадок: підписувати нікуди.
 */
export function mapMarketingUserErrors(
  userErrors: readonly UserError[],
): "ok" | SaveFailure | "no-email" {
  const codes = userErrors.map((error) => error.code);
  if (codes.every((code) => code === "CUSTOMER_ALREADY_SUBSCRIBED")) return "ok";
  return codes.includes("EMAIL_ADDRESS_NOT_FOUND") ? "no-email" : "failed";
}

type Outcome<Data> = { data: Data } | { failure: SaveFailure };

/** Мутація: помилки GraphQL і збій запиту пишемо в журнал і зводимо до причини відмови. */
async function mutate<Data>(
  label: string,
  request: () => Promise<{ data: Data | null; errors?: Parameters<typeof logAccountErrors>[1] }>,
): Promise<Outcome<Data>> {
  try {
    const { data, errors } = await request();
    if (logAccountErrors(label, errors) || !data) {
      return { failure: isAccessDenied(errors ?? []) ? "forbidden" : "failed" };
    }
    return { data };
  } catch (error) {
    logAccountFailure(label, error);
    return { failure: isAccessDenied(error) ? "forbidden" : "failed" };
  }
}

function logUserErrors(label: string, userErrors: readonly UserError[]): void {
  if (userErrors.length === 0) return;
  console.error(
    `[customer-account] ${label} userErrors: ${userErrors
      .map(
        (error) => `${error.code ?? "-"} ${error.message ?? ""} (${error.field?.join(".") ?? "-"})`,
      )
      .join("; ")}`,
  );
}

async function saveProfile(
  { client, accessToken }: CustomerAccess,
  values: ProfileValues,
): Promise<ProfileActionResult> {
  const invalid = (errors: ProfileErrors, failure?: SaveFailure): ProfileActionResult => ({
    intent: "profile",
    ok: false,
    values,
    errors,
    failure,
  });

  const errors = validateProfile(values);
  if (Object.keys(errors).length > 0) return invalid(errors);

  // Поточні значення: якщо нічого не змінилось, мутацію не викликаємо.
  const current = await optionalAccountData("AccountProfile (action)", () =>
    client.graphql(PROFILE_QUERY, { accessToken }),
  );

  const nameChanged =
    !current ||
    (current.customer.firstName ?? "") !== values.firstName ||
    (current.customer.lastName ?? "") !== values.lastName;

  if (nameChanged) {
    const saved = await mutate("AccountProfileUpdate", () =>
      client.graphql(PROFILE_UPDATE_MUTATION, {
        accessToken,
        variables: {
          input: { firstName: values.firstName, lastName: values.lastName || null },
        },
      }),
    );
    if ("failure" in saved) return invalid({}, saved.failure);

    const userErrors = saved.data.customerUpdate?.userErrors ?? [];
    logUserErrors("AccountProfileUpdate", userErrors);
    if (userErrors.length > 0) {
      const mapped = mapCustomerUserErrors(userErrors);
      return invalid(mapped.errors, mapped.failure);
    }
  }

  return { intent: "profile", ok: true, values };
}

async function saveMarketing(
  { client, accessToken }: CustomerAccess,
  target: MarketingTarget,
): Promise<ProfileActionResult> {
  const saved =
    target === "subscribe"
      ? await mutate("AccountMarketingSubscribe", async () => {
          const { data, errors } = await client.graphql(MARKETING_SUBSCRIBE_MUTATION, {
            accessToken,
          });
          return { data: data?.customerEmailMarketingSubscribe ?? null, errors };
        })
      : await mutate("AccountMarketingUnsubscribe", async () => {
          const { data, errors } = await client.graphql(MARKETING_UNSUBSCRIBE_MUTATION, {
            accessToken,
          });
          return { data: data?.customerEmailMarketingUnsubscribe ?? null, errors };
        });

  if ("failure" in saved) return { intent: "marketing", ok: false, target, failure: saved.failure };

  logUserErrors(`AccountMarketing (${target})`, saved.data.userErrors);
  const mapped = mapMarketingUserErrors(saved.data.userErrors);
  return mapped === "ok"
    ? { intent: "marketing", ok: true, target }
    : { intent: "marketing", ok: false, target, failure: mapped };
}

/**
 * Обробка форми профілю. `intent=profile` зберігає ім'я та прізвище,
 * `intent=marketing` перемикає підписку (`marketing=subscribe|unsubscribe`).
 * Невідомий `intent` → `null` (маршрут відповідає 400).
 */
export async function runProfileAction(
  access: CustomerAccess,
  formData: FormData,
): Promise<ProfileActionResult | null> {
  const intent = formData.get("intent");

  if (intent === "profile") return saveProfile(access, readProfileForm(formData));

  if (intent === "marketing") {
    const target = formData.get("marketing");
    if (target === "subscribe" || target === "unsubscribe") return saveMarketing(access, target);
  }

  return null;
}
