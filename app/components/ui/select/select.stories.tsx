import type { Meta, StoryObj } from "@storybook/react-vite";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  args: { defaultValue: "popular" },
  render: (args) => (
    <div className="max-w-xs">
      <Select {...args}>
        <SelectTrigger aria-label="Сортування">
          <SelectValue placeholder="Сортування" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="popular">Спочатку популярні</SelectItem>
          <SelectItem value="price-asc">Спочатку дешевші</SelectItem>
          <SelectItem value="price-desc">Спочатку дорожчі</SelectItem>
          <SelectItem value="new">Спочатку новинки</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placeholder: Story = { args: { defaultValue: undefined } };

export const Disabled: Story = { args: { disabled: true } };
