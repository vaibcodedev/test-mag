import {
  MARKETING_SUBSCRIBE_MUTATION,
  MARKETING_UNSUBSCRIBE_MUTATION,
  PROFILE_PHONE_MUTATION,
  PROFILE_PHONE_QUERY,
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
import { normalizePhone } from "./phone";

/**
 * Редагування профілю: перевірка форми, виклики Customer Account API й переклад його відповідей.
 *
 * Що можна змінити через API 2026-10:
 *  - ім'я та прізвище — `customerUpdate` (`CustomerUpdateInput` має лише ці два поля);
 *  - телефон — тільки в адресі: `customerAddressUpdate(address: { phoneNumber })`, формат E.164.
 *    Телефон самого облікового запису (`Customer.phoneNumber`) API лише читає, тому кабінет
 *    редагує номер основної адреси доставки — той, за яким дзвонить кур'єр;
 *  - розсилка — `customerEmailMarketingSubscribe` / `customerEmailMarketingUnsubscribe`
 *    (без аргументів, діють на пошту покупця, який увійшов).
 *
 * Сирий текст API (`userErrors[].message`) покупцеві не показуємо: лише власні повідомлення.
 */

export type ProfileField = "firstName" | "lastName" | "phone";
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
export const PHONE_HINT = "Наприклад, 067 123 45 67 або +380 67 123 45 67.";

const NAME_LABELS = {
  firstName: { required: "Вкажіть ім'я.", subject: "Ім'я" },
  lastName: { required: "Вкажіть прізвище.", subject: "Прізвище" },
} as const;

const PHONE_INVALID = "Перевірте номер: потрібні код оператора й сім цифр, як у прикладі.";
const PHONE_REJECTED = "Магазин не прийняв цей номер. Перевірте його й спробуйте ще раз.";
const PHONE_WITHOUT_ADDRESS =
  "Номер зберігається разом з адресою доставки, а її ще немає. Він з'явиться тут після першого замовлення.";
const PHONE_UNAVAILABLE = "Зараз номер зберегти не вдалося. Спробуйте ще раз за хвилину.";

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
    phone: clean(formData.get("phone")),
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

export type ProfileValidation = {
  errors: ProfileErrors;
  /** Номер у форматі E.164; `null` — поле порожнє (або з помилкою). */
  phone: string | null;
};

/** Перевірка на сервері. Порожній телефон — не помилка: поле необов'язкове. */
export function validateProfile(values: ProfileValues): ProfileValidation {
  const errors: ProfileErrors = {};
  const firstName = nameError("firstName", values.firstName, true);
  const lastName = nameError("lastName", values.lastName, false);
  if (firstName) errors.firstName = firstName;
  if (lastName) errors.lastName = lastName;

  const phone = normalizePhone(values.phone);
  if (!phone.ok && phone.reason === "invalid") errors.phone = PHONE_INVALID;

  return { errors, phone: phone.ok ? phone.value : null };
}

/** Перше поле з помилкою в порядку форми: туди переходить фокус. */
export function firstInvalidField(errors: ProfileErrors): ProfileField | null {
  return (["firstName", "lastName", "phone"] as const).find((field) => errors[field]) ?? null;
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

const PHONE_CODES = new Set(["PHONE_NUMBER_NOT_VALID", "INVALID", "INVALID_FOR_COUNTRY"]);

/** `userErrors` мутації `customerAddressUpdate`, якою зберігається телефон. */
export function mapPhoneUserErrors(userErrors: readonly UserError[]): MappedErrors {
  const mapped: MappedErrors = { errors: {} };

  for (const error of userErrors) {
    const aboutPhone =
      error.code === "PHONE_NUMBER_NOT_VALID" ||
      (error.field?.at(-1) === "phoneNumber" && PHONE_CODES.has(error.code ?? ""));
    if (aboutPhone) mapped.errors.phone = PHONE_REJECTED;
    else mapped.failure = "failed";
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
  /** Поле телефону було у формі. Вимкнене поле не надсилається — тоді номер не чіпаємо. */
  phoneSubmitted: boolean,
): Promise<ProfileActionResult> {
  const invalid = (errors: ProfileErrors, failure?: SaveFailure): ProfileActionResult => ({
    intent: "profile",
    ok: false,
    values,
    errors,
    failure,
  });

  const { errors, phone } = validateProfile(values);
  if (Object.keys(errors).length > 0) return invalid(errors);

  // Поточні значення: зберігаємо лише те, що справді змінилось, і не чіпаємо решту.
  const [current, address] = await Promise.all([
    optionalAccountData("AccountProfile (action)", () =>
      client.graphql(PROFILE_QUERY, { accessToken }),
    ),
    optionalAccountData("AccountProfilePhone (action)", () =>
      client.graphql(PROFILE_PHONE_QUERY, { accessToken }),
    ),
  ]);
  const defaultAddress = address?.customer.defaultAddress ?? null;
  const currentPhone = normalizePhone(defaultAddress?.phoneNumber);
  const phoneChanged = phoneSubmitted && phone !== (currentPhone.ok ? currentPhone.value : null);

  // Телефон іде першим: якщо магазин його не прийме, ім'я не збережеться наполовину.
  if (phoneChanged) {
    // Адресу не вдалося прочитати: чи є вона, невідомо, тож і номер зберегти нікуди.
    if (!address) return invalid({ phone: PHONE_UNAVAILABLE });
    if (!defaultAddress) return invalid({ phone: PHONE_WITHOUT_ADDRESS });

    const saved = await mutate("AccountProfilePhoneUpdate", () =>
      client.graphql(PROFILE_PHONE_MUTATION, {
        accessToken,
        variables: { addressId: defaultAddress.id, address: { phoneNumber: phone } },
      }),
    );
    if ("failure" in saved) return invalid({}, saved.failure);

    const userErrors = saved.data.customerAddressUpdate?.userErrors ?? [];
    logUserErrors("AccountProfilePhoneUpdate", userErrors);
    if (userErrors.length > 0) {
      const mapped = mapPhoneUserErrors(userErrors);
      return invalid(mapped.errors, mapped.failure);
    }
  }

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
 * Обробка форми профілю. `intent=profile` зберігає ім'я, прізвище й телефон,
 * `intent=marketing` перемикає підписку (`marketing=subscribe|unsubscribe`).
 * Невідомий `intent` → `null` (маршрут відповідає 400).
 */
export async function runProfileAction(
  access: CustomerAccess,
  formData: FormData,
): Promise<ProfileActionResult | null> {
  const intent = formData.get("intent");

  if (intent === "profile") {
    return saveProfile(access, readProfileForm(formData), formData.has("phone"));
  }

  if (intent === "marketing") {
    const target = formData.get("marketing");
    if (target === "subscribe" || target === "unsubscribe") return saveMarketing(access, target);
  }

  return null;
}
