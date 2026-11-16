import type { Meta, StoryObj } from "@storybook/react-vite";

import { Showroom } from "./showroom";
import {
  SHOWROOM_DEMO_DELIVERY,
  SHOWROOM_DEMO_DESCRIPTION,
  SHOWROOM_DEMO_STORE,
} from "./showroom.demo";

const meta = {
  title: "Home/Showroom",
  component: Showroom,
  parameters: { surface: "page" },
  args: {
    description: SHOWROOM_DEMO_DESCRIPTION,
    store: SHOWROOM_DEMO_STORE,
    delivery: SHOWROOM_DEMO_DELIVERY,
  },
} satisfies Meta<typeof Showroom>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
