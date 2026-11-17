import type { Meta, StoryObj } from "@storybook/react-vite";

import { STORE_INFO } from "~/lib/content/site";

import { AccountHelp } from "./account-help";

const meta = {
  title: "Account/AccountHelp",
  component: AccountHelp,
  parameters: { surface: "page" },
  args: { store: STORE_INFO },
  decorators: [
    (Story) => (
      <div className="max-w-92">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountHelp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
