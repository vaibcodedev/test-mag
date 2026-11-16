import type { Meta, StoryObj } from "@storybook/react-vite";

import { IphoneLineup } from "./iphone-lineup";
import { DEMO_IPHONE_LINEUP } from "./iphone-lineup.demo";

const meta = {
  title: "Home/IphoneLineup",
  component: IphoneLineup,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { models: DEMO_IPHONE_LINEUP },
} satisfies Meta<typeof IphoneLineup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLink: Story = { args: { link: null } };
