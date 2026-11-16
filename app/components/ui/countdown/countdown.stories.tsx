import type { Meta, StoryObj } from "@storybook/react-vite";

import { Countdown } from "./countdown";

const DAY = 24 * 60 * 60 * 1000;

/** Дати рахуються від моменту відкриття Storybook, щоб відлік завжди був живий. */
const inFuture = (ms: number) => new Date(Date.now() + ms).toISOString();

const meta = {
  title: "UI/Countdown",
  component: Countdown,
  tags: ["autodocs"],
  parameters: { surface: "ink" },
  args: { endsAt: inFuture(3 * DAY + 5 * 60 * 60 * 1000), tone: "ink" },
  argTypes: {
    tone: { control: "inline-radio", options: ["ink", "light"] },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnInk: Story = {};

export const Light: Story = { args: { tone: "light" }, parameters: { surface: "surface" } };

export const LastSeconds: Story = { args: { endsAt: inFuture(15 * 1000) } };

export const Finished: Story = { args: { endsAt: "2026-01-01T00:00:00+02:00" } };

export const CustomLabel: Story = { args: { label: "Знижки діють ще" } };
