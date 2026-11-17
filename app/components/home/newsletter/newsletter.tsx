import { CircleAlert, CircleCheck } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

import { Section, SectionHeader, type SectionProps } from "~/components/layout/section";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel, fieldProps } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export type NewsletterContent = {
  title: string;
  description: string;
  emailLabel: string;
  /** Приклад адреси в полі: «olena@example.com». */
  emailPlaceholder: string;
  submitLabel: string;
  /** Підказка під полем: як часто пишемо і як відписатися. */
  hint: string;
  errors: {
    /** Поле порожнє. */
    empty: string;
    /** Адреса записана неправильно. */
    invalid: string;
    /** onSubmit завершився помилкою. */
    failed: string;
  };
  successTitle: string;
  successText: string;
  /**
   * Чесне повідомлення, коли розсилку ще не підключено (форма без `onSubmit`):
   * адресу ми не зберегли, тож про підписку не звітуємо.
   */
  pending: string;
  /** Підпис посилання на Telegram поруч із `pending`. */
  pendingLinkLabel: string;
};

export type NewsletterProps = Omit<SectionProps, "id" | "children" | "content" | "onSubmit"> & {
  id?: string;
  content: NewsletterContent;
  /**
   * Викликається з перевіреною адресою. Якщо повертає Promise, кнопка показує завантаження;
   * відхилений Promise показує помилку `content.errors.failed`, а підтвердження з'являється
   * лише після успішного завершення.
   *
   * Без `onSubmit` підписки не існує: форма нічого не надсилає, не показує підтвердження,
   * а після правильної адреси виводить `content.pending` і лишає адресу в полі.
   */
  onSubmit?: (email: string) => void | Promise<void>;
  /** Посилання на Telegram магазину для повідомлення `content.pending`. */
  telegramUrl?: string;
};

type Status = "idle" | "submitting" | "success";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): "empty" | "invalid" | null {
  const email = value.trim();
  if (email === "") return "empty";
  return EMAIL_PATTERN.test(email) ? null : "invalid";
}

/** Підписка на розсилку: ink-панель із полем пошти та кнопкою lime. */
export function Newsletter({
  id = "newsletter",
  content,
  onSubmit,
  telegramUrl,
  ...props
}: NewsletterProps) {
  const fieldId = useId();
  const noticeId = `${fieldId}-notice`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  /** Розсилку не підключено, а адресу введено правильно: показуємо `content.pending`. */
  const [notice, setNotice] = useState(false);

  function showError(message: string) {
    setError(message);
    inputRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const value = email.trim();
    const problem = validateEmail(value);
    if (problem) {
      showError(content.errors[problem]);
      return;
    }

    setError(null);
    // Немає обробника — немає й підписки: кажемо про це прямо й нічого не надсилаємо.
    if (!onSubmit) {
      setNotice(true);
      return;
    }

    setStatus("submitting");
    try {
      await onSubmit(value);
      setStatus("success");
    } catch {
      setStatus("idle");
      showError(content.errors.failed);
    }
  }

  function handleChange(value: string) {
    setEmail(value);
    setNotice(false);
    // Після першої помилки перевіряємо під час введення, щоб підказка зникла, щойно адресу виправлено.
    if (error) {
      const problem = validateEmail(value);
      setError(problem ? content.errors[problem] : null);
    }
  }

  const field = fieldProps(fieldId, { invalid: Boolean(error), description: true });
  // Спершу помилка або повідомлення, потім підказка: у такому порядку їх зачитує читач екрана.
  const describedBy = [error ? field.error.id : notice ? noticeId : null, field.description.id]
    .filter(Boolean)
    .join(" ");

  return (
    <Section id={id} {...props}>
      <Card size="panel" tone="ink" className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
        <SectionHeader
          sectionId={id}
          title={content.title}
          description={content.description}
          onDark
          className="mb-0 min-w-0"
        />

        {status === "success" ? (
          <Alert
            ref={(node) => node?.focus()}
            tabIndex={-1}
            variant="on-dark"
            className="min-w-0 focus-ring-on-ink"
          >
            <CircleCheck aria-hidden="true" strokeWidth={2} />
            <AlertTitle>{content.successTitle}</AlertTitle>
            <AlertDescription>{content.successText}</AlertDescription>
          </Alert>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="min-w-0">
            <Field {...field.field} onDark>
              <FieldLabel {...field.label}>{content.emailLabel}</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  ref={inputRef}
                  {...field.control}
                  aria-describedby={describedBy}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(event) => handleChange(event.target.value)}
                  placeholder={content.emailPlaceholder}
                  onDark
                  className="sm:flex-1"
                />
                <Button
                  type="submit"
                  variant="lime"
                  loading={status === "submitting"}
                  className="w-full sm:w-auto"
                >
                  {content.submitLabel}
                </Button>
              </div>
              <FieldError {...field.error} className="flex items-start gap-2">
                {error ? (
                  <>
                    <CircleAlert
                      aria-hidden="true"
                      strokeWidth={2}
                      className="mt-0.5 size-4 shrink-0"
                    />
                    {error}
                  </>
                ) : null}
              </FieldError>
              {notice ? (
                <Alert id={noticeId} variant="on-dark">
                  <AlertDescription className="text-surface">
                    {content.pending}
                    {telegramUrl ? (
                      <>
                        {" "}
                        <a
                          href={telegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-sm font-semibold focus-ring-on-ink"
                        >
                          {content.pendingLinkLabel}
                        </a>
                      </>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}
              <FieldDescription {...field.description}>{content.hint}</FieldDescription>
            </Field>
          </form>
        )}
      </Card>
    </Section>
  );
}
