import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_USED_PRODUCTS } from "~/components/home/home.fixtures";

import { UsedDevices } from "./used-devices";
import { USED_DEVICES_DEMO_CONTENT } from "./used-devices.demo";

const meta = {
  title: "Home/UsedDevices",
  component: UsedDevices,
  parameters: { surface: "page" },
  args: { content: USED_DEVICES_DEMO_CONTENT, products: DEMO_USED_PRODUCTS },
} satisfies Meta<typeof UsedDevices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
