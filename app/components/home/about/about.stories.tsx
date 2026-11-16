import type { Meta, StoryObj } from "@storybook/react-vite";

import { About } from "./about";
import {
  ABOUT_DEMO_DESCRIPTION,
  ABOUT_DEMO_POINTS,
  ABOUT_DEMO_STATS,
  ABOUT_DEMO_TEAM,
} from "./about.demo";

const meta = {
  title: "Home/About",
  component: About,
  parameters: { surface: "page" },
  args: {
    description: ABOUT_DEMO_DESCRIPTION,
    points: ABOUT_DEMO_POINTS,
    team: ABOUT_DEMO_TEAM,
    stats: ABOUT_DEMO_STATS,
  },
} satisfies Meta<typeof About>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutTeam: Story = { args: { team: [] } };
