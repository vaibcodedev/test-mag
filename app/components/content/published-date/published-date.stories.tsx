import type { Meta, StoryObj } from "@storybook/react-vite";
import { PublishedDate } from "./published-date";

const meta = {
  title: "Content/PublishedDate",
  component: PublishedDate,
  args: { value: "2026-11-18T09:00:00+02:00", className: "text-small text-muted-foreground" },
} satisfies Meta<typeof PublishedDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
