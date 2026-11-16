import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "~/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Textarea } from "~/components/ui/textarea";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Олена", "aria-label": "Ім'я" },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true, defaultValue: "35 209900 176148 1" } };

/** Помилка пояснює, що не так і як це виправити. */
export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label htmlFor="story-phone" className="text-small font-semibold">
        Телефон
      </label>
      <Input
        id="story-phone"
        type="tel"
        defaultValue="068 129"
        aria-invalid="true"
        aria-describedby="story-phone-error"
      />
      <p id="story-phone-error" className="text-small text-danger">
        У номері має бути 10 цифр, наприклад 068 129 99 00.
      </p>
    </div>
  ),
};

export const TextareaField: Story = {
  render: () => (
    <Textarea
      aria-label="Коментар до замовлення"
      placeholder="Наприклад, зателефонуйте після 18:00"
    />
  ),
};

export const SearchGroup: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search aria-hidden="true" strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label="Пошук" placeholder="iPhone 17 Pro" />
    </InputGroup>
  ),
};

export const NewsletterGroup: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput
        type="email"
        aria-label="Email для розсилки"
        placeholder="olena@example.com"
        className="ps-4"
      />
      <InputGroupAddon align="end">
        <Button size="sm">
          Підписатися
          <ArrowRight aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  ),
};
