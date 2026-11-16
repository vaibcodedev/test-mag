import type { Meta, StoryObj } from "@storybook/react-vite";
import { SHOWROOM_LINK, STORE_INFO } from "~/lib/content/site";

import { ContactCard } from "./contact-card";

const meta = {
  title: "Content/ContactCard",
  component: ContactCard,
  parameters: { surface: "page" },
  args: { store: STORE_INFO },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithShowroomLink: Story = { args: { showroomLink: SHOWROOM_LINK } };
