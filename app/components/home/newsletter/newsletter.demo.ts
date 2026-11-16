import type { NewsletterContent } from "./newsletter";

/**
 * TODO(реальний магазин): тексти читати з метаоб'єкта `home_newsletter`
 * (заголовок, опис, підписи поля й кнопки, підказка, повідомлення про помилки та успіх).
 */
export const NEWSLETTER_DEMO_CONTENT: NewsletterContent = {
  title: "Знижки й новинки — раз на тиждень",
  description:
    "Один лист щоп'ятниці: що подешевшало, що привезли нового і на що варто зачекати. Без щоденних розсилок.",
  emailLabel: "Електронна пошта",
  emailPlaceholder: "olena@example.com",
  submitLabel: "Підписатися",
  hint: "Відписатися можна в один клік у будь-якому листі.",
  errors: {
    empty: "Поле порожнє. Введіть адресу електронної пошти, наприклад olena@example.com.",
    invalid:
      "В адресі бракує символу «@» або домену після нього. Перевірте її: має бути як olena@example.com.",
    failed:
      "Не вдалося оформити підписку. Спробуйте ще раз за хвилину або напишіть нам у Telegram.",
  },
  successTitle: "Готово, ви підписані",
  successText: "Перший лист надішлемо найближчої п'ятниці.",
  pending: "Розсилку ще налаштовуємо. Напишіть нам у Telegram — додамо вас до списку вручну.",
  pendingLinkLabel: "Відкрити Telegram",
};
