import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./container";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { surface: "page" },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Контейнер тримає вміст у межах 1440px і додає бічні поля. */
export const Default: Story = {
  render: () => (
    <Container>
      <div className="rounded-lg bg-surface p-6 text-body text-ink-2">
        Вміст сторінки: не ширший за 1440px, з полями з боків.
      </div>
    </Container>
  ),
};
