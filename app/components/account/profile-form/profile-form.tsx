import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Form } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  fieldProps,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { formatPhone } from "~/lib/account/phone";
import {
  firstInvalidField,
  NAME_MAX_LENGTH,
  PHONE_HINT,
  type ProfileActionResult,
  type ProfileField,
  type SaveFailure,
} from "~/lib/account/profile";

/**
 * Телефон у кабінеті — це номер основної адреси доставки: інакше API його не змінює.
 * `no-address` — адреси ще немає, `unavailable` — магазин не віддав адресу.
 */
export type ProfilePhone =
  { status: "editable"; value: string } | { status: "no-address" } | { status: "unavailable" };

export type ProfileFormProps = {
  firstName: string;
  lastName: string;
  phone: ProfilePhone;
  /** Відповідь action на останнє надсилання цієї форми. */
  result?: Extract<ProfileActionResult, { intent: "profile" }> | null;
  /** Форма надсилається: кнопка показує спінер і не приймає повторних натискань. */
  pending?: boolean;
};

export const SAVE_FAILURE: Record<SaveFailure, { title: string; description: string }> = {
  failed: {
    title: "Не вдалося зберегти",
    description: "Спробуйте ще раз за хвилину. Введені дані лишилися у формі.",
  },
  forbidden: {
    title: "Не вдалося зберегти",
    description:
      "Зараз змінити ці дані в кабінеті не можна. Напишіть нам у Telegram або зателефонуйте — оновимо їх вручну.",
  },
};

const PHONE_NOTES: Record<Exclude<ProfilePhone["status"], "editable">, string> = {
  "no-address":
    "Номер зберігається разом з адресою доставки. Він з'явиться тут після першого замовлення.",
  unavailable: "Зараз номер змінити не вдасться. Напишіть нам — оновимо його вручну.",
};

/**
 * Форма профілю: ім'я, прізвище, телефон. Працює і без JavaScript (звичайний POST на цю ж
 * сторінку), а з ним надсилається без перезавантаження. Помилки приходять із сервера:
 * значення лишаються у формі, фокус переходить на перше поле з помилкою.
 */
export function ProfileForm({
  firstName,
  lastName,
  phone,
  result = null,
  pending = false,
}: ProfileFormProps) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const ids: Record<ProfileField, string> = {
    firstName: `${id}-first-name`,
    lastName: `${id}-last-name`,
    phone: `${id}-phone`,
  };

  const failed = result && !result.ok ? result : null;
  const errors = failed?.errors ?? {};
  const invalidField = firstInvalidField(errors);
  const phoneEditable = phone.status === "editable";
  const fields = {
    firstName: fieldProps(ids.firstName, { invalid: Boolean(errors.firstName) }),
    lastName: fieldProps(ids.lastName, { invalid: Boolean(errors.lastName) }),
    phone: fieldProps(ids.phone, { invalid: Boolean(errors.phone), description: true }),
  };

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      // Поля показують збережене: з обрізаними пробілами й номером у звичному записі.
      form.current?.reset();
      return;
    }
    const field = firstInvalidField(result.errors);
    if (field) form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
  }, [result]);

  return (
    // Без viewTransition: форма змінює поточну сторінку на місці.
    <Form ref={form} method="post" preventScrollReset noValidate data-slot="profile-form">
      <input type="hidden" name="intent" value="profile" />
      <FieldGroup>
        {failed?.failure ? (
          <Alert variant="danger">
            <CircleAlert aria-hidden="true" strokeWidth={2} />
            <AlertTitle>{SAVE_FAILURE[failed.failure].title}</AlertTitle>
            <AlertDescription>{SAVE_FAILURE[failed.failure].description}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field {...fields.firstName.field}>
            <FieldLabel {...fields.firstName.label}>Ім&apos;я</FieldLabel>
            <Input
              {...fields.firstName.control}
              name="firstName"
              autoComplete="given-name"
              maxLength={NAME_MAX_LENGTH * 2}
              defaultValue={failed?.values.firstName ?? firstName}
              // Без JavaScript фокус на поле з помилкою ставить сам браузер.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={invalidField === "firstName"}
            />
            <FieldError {...fields.firstName.error}>{errors.firstName}</FieldError>
          </Field>
          <Field {...fields.lastName.field}>
            <FieldLabel {...fields.lastName.label}>Прізвище</FieldLabel>
            <Input
              {...fields.lastName.control}
              name="lastName"
              autoComplete="family-name"
              maxLength={NAME_MAX_LENGTH * 2}
              defaultValue={failed?.values.lastName ?? lastName}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={invalidField === "lastName"}
            />
            <FieldError {...fields.lastName.error}>{errors.lastName}</FieldError>
          </Field>
        </div>

        <Field {...fields.phone.field} data-disabled={phoneEditable ? undefined : "true"}>
          <FieldLabel {...fields.phone.label}>Телефон для доставки</FieldLabel>
          <Input
            {...fields.phone.control}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={!phoneEditable}
            defaultValue={
              failed && phoneEditable
                ? failed.values.phone
                : phone.status === "editable"
                  ? formatPhone(phone.value)
                  : ""
            }
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={invalidField === "phone"}
          />
          <FieldDescription {...fields.phone.description}>
            {phone.status === "editable"
              ? `${PHONE_HINT} За цим номером зв'яжеться кур'єр або відділення.`
              : PHONE_NOTES[phone.status]}
          </FieldDescription>
          <FieldError {...fields.phone.error}>{errors.phone}</FieldError>
        </Field>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button type="submit" loading={pending}>
            Зберегти зміни
          </Button>
          {/* Статус лишається в розмітці завжди: зчитувач екрана оголошує зміну його вмісту. */}
          <p
            role="status"
            data-slot="profile-form-status"
            className="flex items-center gap-2 text-small font-semibold text-ink"
          >
            {pending ? (
              "Зберігаємо…"
            ) : result?.ok ? (
              <>
                <CircleCheck aria-hidden="true" strokeWidth={2} className="size-5 text-success" />
                Зміни збережено
              </>
            ) : null}
          </p>
        </div>
      </FieldGroup>
    </Form>
  );
}
