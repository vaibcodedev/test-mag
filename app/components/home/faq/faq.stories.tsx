import type { Meta, StoryObj } from "@storybook/react-vite";

import { Faq } from "./faq";
import { FAQ_DEMO_DESCRIPTION, FAQ_DEMO_ITEMS } from "./faq.demo";

const meta = {
  title: "Home/Faq",
  component: Faq,
  parameters: { surface: "page" },
  args: { description: FAQ_DEMO_DESCRIPTION, items: FAQ_DEMO_ITEMS },
} satisfies Meta<typeof Faq>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
