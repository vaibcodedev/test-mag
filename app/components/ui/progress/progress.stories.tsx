import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "./progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: { value: 64, tone: "light", "aria-label": "До безкоштовної доставки" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    tone: { control: "inline-radio", options: ["light", "on-dark"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кошик: скільки лишилося до безкоштовної доставки. */
export const FreeDelivery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <p id="story-progress-delivery" className="text-small text-ink-2">
        Ще 1 080 ₴ до безкоштовної доставки
      </p>
      <Progress {...args} aria-label={undefined} aria-labelledby="story-progress-delivery" />
    </div>
  ),
};

export const Complete: Story = { args: { value: 100, "aria-label": "Доставка безкоштовна" } };

export const OnInk: Story = {
  args: { tone: "on-dark", value: 40, "aria-label": "Залишилося товарів за акцією" },
  parameters: { surface: "ink" },
};
