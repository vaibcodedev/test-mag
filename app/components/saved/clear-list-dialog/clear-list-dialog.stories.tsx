import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClearListDialog } from "./clear-list-dialog";

/** Натисніть кнопку, щоб відкрити діалог підтвердження. */
const meta = {
  title: "Saved/ClearListDialog",
  component: ClearListDialog,
  args: {
    triggerLabel: "Очистити обране",
    title: "Очистити обране?",
    description: "Усі товари зникнуть зі списку. Повернути їх можна буде лише вручну.",
    confirmLabel: "Так, очистити",
    onConfirm: () => {},
  },
} satisfies Meta<typeof ClearListDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wishlist: Story = {};

export const Compare: Story = {
  args: {
    triggerLabel: "Очистити порівняння",
    title: "Очистити порівняння?",
    description: "Усі товари зникнуть із таблиці порівняння.",
  },
};
