import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Form } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, fieldProps } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  firstInvalidField,
  NAME_MAX_LENGTH,
  type ProfileActionResult,
  type SaveFailure,
} from "~/lib/account/profile";

export type ProfileFormProps = {
  firstName: string;
  lastName: string;
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

/**
 * Форма профілю: ім'я та прізвище. Працює і без JavaScript (звичайний POST на цю ж
 * сторінку), а з ним надсилається без перезавантаження. Помилки приходять із сервера:
 * значення лишаються у формі, фокус переходить на перше поле з помилкою.
 */
export function ProfileForm({
  firstName,
  lastName,
  result = null,
  pending = false,
}: ProfileFormProps) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);

  const failed = result && !result.ok ? result : null;
  const errors = failed?.errors ?? {};
  const invalidField = firstInvalidField(errors);
  const fields = {
    firstName: fieldProps(`${id}-first-name`, { invalid: Boolean(errors.firstName) }),
    lastName: fieldProps(`${id}-last-name`, { invalid: Boolean(errors.lastName) }),
  };

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      // Поля показують збережене: з обрізаними пробілами.
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
