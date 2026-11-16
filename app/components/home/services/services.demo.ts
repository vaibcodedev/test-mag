import type { ServicesContent } from "./services";

/**
 * TODO(реальний магазин): тексти читати з метаоб'єктів `home_services` (банери trade-in
 * та оплати частинами) і `service_card` (іконка, заголовок, підпис, посилання).
 */
export const SERVICES_DEMO_CONTENT: ServicesContent = {
  title: "Trade-in, розстрочка і сервіс",
  description: "Допомагаємо не лише вибрати техніку, а й зручно за неї заплатити та налаштувати.",
  tradeIn: {
    title: "Trade-in: здайте старий пристрій",
    maxDiscount: { amount: "24500", currencyCode: "UAH" },
    discountCaption: "знижки на новий пристрій",
    text: "Оцінимо ваш iPhone, iPad, Mac чи Watch за 15 хвилин у шоурумі або попередньо в Telegram за фото.",
    link: { title: "Оцінити мій пристрій", to: "/pages/trade-in" },
  },
  installments: {
    payments: 25,
    title: "без переплат",
    text: "Оплата частинами 0%: оформлюємо за кілька хвилин у застосунку банку, без довідок і першого внеску.",
    banks: ["monobank", "ПриватБанк"],
    banksLabel: "Банки, з якими працюємо",
    link: { title: "Умови оплати частинами", to: "/pages/installments" },
  },
  cards: [
    {
      icon: "data-transfer",
      title: "Перенесення даних",
      text: "Перенесемо фото, контакти й застосунки зі старого телефона, поки ви п'єте каву.",
      to: "/pages/contacts",
    },
    {
      icon: "protection",
      title: "Скло й чохол",
      text: "Підберемо під вашу модель і наклеїмо скло рівно, без пилу та бульбашок.",
      to: "/collections/accessories",
    },
    {
      icon: "warranty",
      title: "Гарантія без біганини",
      text: "Щось не так — приносьте або надсилайте нам. Із сервісним центром спілкуємося самі.",
      to: "/pages/warranty",
    },
    {
      icon: "gift",
      title: "Подарункові сертифікати",
      text: "На будь-яку суму від 500 ₴. Надішлемо на пошту або роздрукуємо в шоурумі.",
      to: "/pages/contacts",
    },
  ],
};
