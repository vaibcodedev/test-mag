import { CircleAlert } from "lucide-react";
import { useId, type MouseEvent } from "react";
import { Form } from "react-router";

import { SAVE_FAILURE } from "~/components/account/profile-form";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Field, FieldContent, FieldDescription, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { Switch } from "~/components/ui/switch";
import type { MarketingStatus, MarketingTarget, ProfileActionResult } from "~/lib/account/profile";

export type MarketingFormProps = {
  /** Справжній стан підписки з API. */
  status: MarketingStatus;
  /** Пошта, на яку йдуть листи. */
  email?: string | null;
  /** Відповідь action на останнє перемикання. */
  result?: Extract<ProfileActionResult, { intent: "marketing" }> | null;
  /** Що саме зараз зберігається; `null` — нічого. */
  pendingTarget?: MarketingTarget | null;
};

const NO_EMAIL = {
  title: "Не вдалося підписати",
  description: "У вашому кабінеті немає пошти, на яку можна надсилати листи. Напишіть нам.",
};

/**
 * Перемикач розсилки. Показує справжній стан із API й одним рядком каже, на що погоджується
 * покупець. Сам перемикач — кнопка надсилання форми: без JavaScript натискання відправляє
 * звичайний POST, а з ним стан змінюється без перезавантаження.
 */
export function MarketingForm({
  status,
  email,
  result = null,
  pendingTarget = null,
}: MarketingFormProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const unavailable = status === "unavailable";
  const pending = pendingTarget !== null;
  const subscribed = status === "subscribed" || status === "pending";
  // Під час збереження перемикач уже показує те, що обрав покупець.
  const checked = pending ? pendingTarget === "subscribe" : subscribed;
  const failure = result && !result.ok ? result.failure : null;
  const failureText = failure ? (failure === "no-email" ? NO_EMAIL : SAVE_FAILURE[failure]) : null;

  // Повторне натискання, доки запит у дорозі, нічого не надсилає.
  const blockWhilePending = (event: MouseEvent) => {
    if (pending) event.preventDefault();
  };

  return (
    // Без viewTransition: перемикач змінює поточну сторінку на місці.
    <Form
      method="post"
      preventScrollReset
      data-slot="marketing-form"
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="intent" value="marketing" />
      <input type="hidden" name="marketing" value={subscribed ? "unsubscribe" : "subscribe"} />

      <Field orientation="horizontal" data-disabled={unavailable ? "true" : undefined}>
        <FieldContent>
          <FieldLabel htmlFor={id}>Листи про новинки й знижки</FieldLabel>
          <FieldDescription id={descriptionId}>
            {unavailable ? (
              "Керувати розсилкою в кабінеті зараз не можна. Відписатися можна за посиланням у будь-якому нашому листі."
            ) : (
              <>
                Погоджуюсь отримувати листи Ionov Store про новинки, знижки й акції
                {email ? (
                  <>
                    {" "}
                    на <span className="wrap-anywhere text-ink">{email}</span>
                  </>
                ) : null}
                . Відписатися можна будь-коли.
              </>
            )}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={id}
          type="submit"
          checked={checked}
          disabled={unavailable}
          aria-describedby={descriptionId}
          aria-busy={pending || undefined}
          onClick={blockWhilePending}
          className="mt-0.5"
        />
      </Field>

      {/* Статус лишається в розмітці завжди: зчитувач екрана оголошує зміну його вмісту. */}
      <p
        role="status"
        data-slot="marketing-form-status"
        className="flex items-center gap-2 text-small text-ink-2 empty:hidden"
      >
        {pending ? (
          <>
            <Spinner aria-hidden="true" role="presentation" aria-label={undefined} />
            Зберігаємо…
          </>
        ) : failure ? null : status === "pending" ? (
          "Майже готово: підтвердьте підписку за посиланням у листі, який ми надіслали."
        ) : result?.ok ? (
          result.target === "subscribe" ? (
            "Готово: ви підписані на розсилку."
          ) : (
            "Готово: листів більше не надсилатимемо."
          )
        ) : null}
      </p>

      {failureText ? (
        <Alert variant="danger">
          <CircleAlert aria-hidden="true" strokeWidth={2} />
          <AlertTitle>{failureText.title}</AlertTitle>
          <AlertDescription>{failureText.description}</AlertDescription>
        </Alert>
      ) : null}
    </Form>
  );
}
