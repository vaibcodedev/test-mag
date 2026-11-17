import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountShortcutsView } from "./account-shortcuts";

/**
 * На сайті числа бере AccountShortcuts зі сторів обраного, порівняння та кошика;
 * тут вони задаються пропами.
 */
const meta = {
  title: "Account/AccountShortcuts",
  component: AccountShortcutsView,
  parameters: { surface: "page" },
  args: { wishlistCount: 3, compareCount: 2, cartCount: 1 },
  decorators: [
    (Story) => (
      <div className="max-w-92">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountShortcutsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCounts: Story = {};

/** Порожні списки: лічильників немає. */
export const Empty: Story = { args: { wishlistCount: 0, compareCount: 0, cartCount: 0 } };
