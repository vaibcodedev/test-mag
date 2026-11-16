import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { size: "md", tone: "ink" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["ink", "page"] },
  },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>ОК</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const PageTone: Story = { args: { tone: "page" } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>ОК</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>ОК</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>ОК</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/** Автор відгуку з позначкою «перевірений покупець». */
export const ReviewAuthor: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>ОК</AvatarFallback>
        <AvatarBadge>
          <Check aria-hidden="true" strokeWidth={2} />
        </AvatarBadge>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-card-title text-ink">Олена Коваль</span>
        <span className="text-caption text-muted-foreground">Купила iPhone 17 Pro</span>
      </div>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup role="img" aria-label="Олена, Тарас, Ірина та ще 12 покупців">
      <Avatar>
        <AvatarFallback>ОК</AvatarFallback>
      </Avatar>
      <Avatar tone="page">
        <AvatarFallback>ТМ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>ІШ</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+12</AvatarGroupCount>
    </AvatarGroup>
  ),
};
