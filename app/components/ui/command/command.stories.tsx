import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "./command";

const meta = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {
  render: () => (
    <Command label="Пошук товарів" className="h-auto border border-line">
      <CommandInput placeholder="Що шукаєте?" />
      <CommandList>
        <CommandEmpty>Нічого не знайшли. Перевірте назву.</CommandEmpty>
        <CommandGroup heading="Товари">
          <CommandItem>iPhone 17 Pro</CommandItem>
          <CommandItem>iPhone Air</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/** Поки підказки вантажаться. */
export const Loading: Story = {
  render: () => (
    <Command label="Пошук товарів" shouldFilter={false} className="h-auto border border-line">
      <CommandInput placeholder="Що шукаєте?" />
      <CommandList>
        <CommandLoading className="px-3 py-4">Шукаємо…</CommandLoading>
      </CommandList>
    </Command>
  ),
};

/** unstyled: Command лише обгортає стороннє поле, без тла, радіуса й обрізання. */
export const Unstyled: Story = {
  render: () => (
    <Command unstyled label="Пошук товарів" shouldFilter={false}>
      <input
        aria-label="Запит"
        placeholder="Власне поле всередині Command"
        className="h-11.5 w-full rounded-md border border-line bg-surface px-4 focus-ring"
      />
    </Command>
  ),
};
