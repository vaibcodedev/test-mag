import type { Meta, StoryObj } from "@storybook/react-vite";

import { Services } from "./services";
import { SERVICES_DEMO_CONTENT } from "./services.demo";

const meta = {
  title: "Home/Services",
  component: Services,
  parameters: { surface: "page" },
  args: { content: SERVICES_DEMO_CONTENT },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
