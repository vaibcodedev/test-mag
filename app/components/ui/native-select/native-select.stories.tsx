import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "~/components/ui/label";

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select";

const meta = {
  title: "UI/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  args: { "aria-label": "Сортування", defaultValue: "popular" },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="popular">Спочатку популярні</NativeSelectOption>
      <NativeSelectOption value="price-asc">Спочатку дешевші</NativeSelectOption>
      <NativeSelectOption value="price-desc">Спочатку дорожчі</NativeSelectOption>
      <NativeSelectOption value="new">Спочатку новинки</NativeSelectOption>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sorting: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = { args: { "aria-invalid": true } };

/** Відділення для самовивозу та доставки, згруповані за способом. */
export const WithGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="story-native-delivery">Спосіб доставки</Label>
      <NativeSelect id="story-native-delivery" name="delivery" defaultValue="showroom">
        <NativeSelectOptGroup label="Вінниця">
          <NativeSelectOption value="showroom">Самовивіз із шоуруму</NativeSelectOption>
          <NativeSelectOption value="courier">Кур&apos;єр по місту</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Україна">
          <NativeSelectOption value="np-branch">Нова пошта, відділення</NativeSelectOption>
          <NativeSelectOption value="np-locker">Нова пошта, поштомат</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </div>
  ),
};
