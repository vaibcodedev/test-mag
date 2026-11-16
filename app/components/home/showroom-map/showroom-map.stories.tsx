import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShowroomMap } from "./showroom-map";
import { SHOWROOM_MAP_DEMO_STORE } from "./showroom-map.demo";

const meta = {
  title: "Home/ShowroomMap",
  component: ShowroomMap,
  parameters: { surface: "ink" },
  args: { store: SHOWROOM_MAP_DEMO_STORE },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ShowroomMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Вузька висока колонка: схема обрізається з боків, позначка лишається на місці. */
export const Tall: Story = { args: { className: "aspect-auto h-144 max-w-sm" } };
