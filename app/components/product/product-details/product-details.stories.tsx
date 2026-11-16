import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProductDetails } from "./product-details";

const DESCRIPTION_HTML =
  "<p>iPhone 17 Pro з титановим корпусом і дисплеєм 6,3 дюйма. Чип A19 Pro тримає заряд до 33 годин відео.</p><h3>Що в комплекті</h3><ul><li>iPhone</li><li>Кабель USB-C</li></ul>";

const meta = {
  title: "Product/ProductDetails",
  component: ProductDetails,
  parameters: { surface: "page" },
  args: {
    descriptionHtml: DESCRIPTION_HTML,
    specs: ["Дисплей: 6,3″ OLED", "Чип: A19 Pro", "Камера: 48 Мп", "Face ID"],
  },
} satisfies Meta<typeof ProductDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Вживаний пристрій: гарантія коротша, текст про перевірку. */
export const Used: Story = { args: { used: true } };

/** Опис і характеристики порожні: лишаються тільки умови доставки, оплати й гарантії. */
export const ConditionsOnly: Story = { args: { descriptionHtml: null, specs: [] } };
