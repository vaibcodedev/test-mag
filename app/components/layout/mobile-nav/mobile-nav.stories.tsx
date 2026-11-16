import type { Meta, StoryObj } from "@storybook/react-vite";
import { CATALOG_LINKS } from "~/lib/content/site";

import { MobileNav } from "./mobile-nav";

/** Бургер-меню: натисніть кнопку, щоб відкрити шухляду з каталогом і контактами. */
const meta = {
  title: "Layout/MobileNav",
  component: MobileNav,
  args: { categories: CATALOG_LINKS },
  decorators: [
    (Story) => (
      <div className="ps-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
