import type { Meta, StoryObj } from "@storybook/react-vite";

import { getFallbackPage } from "~/lib/content/pages";

import { ContentSections } from "./content-body";
import { RichText } from "./rich-text";

/** Приклад HTML, який редактор Shopify віддає для сторінки чи статті. */
const SHOPIFY_HTML = `
  <p>Цей текст приходить із адмінки Shopify як HTML без класів. <strong>Важливе</strong> виділяється насиченістю, а <a href="/pages/warranty">посилання</a> — кольором дії та підкресленням.</p>
  <h2>Заголовок розділу</h2>
  <p>Абзац під заголовком. Рядок не довший за колонку читання, тому текст легко пробігти очима навіть на великому екрані.</p>
  <h3>Підзаголовок</h3>
  <ul>
    <li>Нова пошта: відділення, поштомат або кур'єр.</li>
    <li>Кур'єр по Вінниці.</li>
    <li>Самовивіз із шоуруму.
      <ul><li>Вкладений пункт списку.</li></ul>
    </li>
  </ul>
  <ol>
    <li>Додайте товар у кошик.</li>
    <li>Оберіть спосіб оплати.</li>
    <li>Підтвердьте замовлення.</li>
  </ol>
  <blockquote><p>Цитата або важлива примітка, яку варто помітити.</p></blockquote>
  <table>
    <thead><tr><th>Техніка</th><th>Гарантія</th><th>Куди звертатися</th></tr></thead>
    <tbody>
      <tr><td>Нова</td><td>12 місяців</td><td>У шоурум або поштою</td></tr>
      <tr><td>Вживана</td><td>6 місяців</td><td>У шоурум або поштою</td></tr>
    </tbody>
  </table>
  <figure>
    <img src="https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747/2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a.png" alt="" width="928" height="1152" loading="lazy">
    <figcaption>Підпис під фото.</figcaption>
  </figure>
  <hr>
  <h4>Дрібний заголовок</h4>
  <p>Завершальний абзац із <code>кодом</code> усередині.</p>
`;

const meta = {
  title: "Content/RichText",
  component: RichText,
  tags: ["autodocs"],
  parameters: { surface: "surface" },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** HTML із Shopify: заголовки, списки, цитата, таблиця, фото. */
export const ShopifyHtml: Story = { args: { html: SHOPIFY_HTML } };

/** Запасний вміст сервісної сторінки — та сама типографіка для структурованих даних. */
export const FallbackSections: Story = {
  render: () => <ContentSections sections={getFallbackPage("warranty")?.sections ?? []} />,
};

/** Зайвий h1 з адмінки показується як h2. */
export const ExtraHeadingOne: Story = {
  args: { html: "<h1>Другий h1 з адмінки</h1><p>На сторінці він стає заголовком розділу.</p>" },
};
