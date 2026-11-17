import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_REORDER_FAILED, DEMO_REORDER_PARTIAL } from "~/components/account/account.fixtures";

import { ReorderButtonView, ReorderNotice } from "./reorder-button";

const meta = {
  title: "Account/ReorderButton",
  component: ReorderButtonView,
  args: { orderName: "#1005" },
} satisfies Meta<typeof ReorderButtonView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Товари додаються в кошик: спінер, повторні натискання не діють. */
export const Pending: Story = { args: { pending: true } };

/** Короткий підпис для картки замовлення в списку. */
export const Compact: Story = { args: { compact: true, variant: "secondary", size: "sm" } };

/** Додано частину товарів: пропущені названо. */
export const PartialNotice: Story = {
  render: () => <ReorderNotice message={DEMO_REORDER_PARTIAL.message} className="max-w-xl" />,
};

/** Додати нічого не вдалося. */
export const FailedNotice: Story = {
  render: () => <ReorderNotice message={DEMO_REORDER_FAILED.message} className="max-w-xl" />,
};

/** Усе додано: такий статус лишається на сторінці замовлення під відкритим кошиком. */
export const SuccessNotice: Story = {
  render: () => (
    <ReorderNotice
      message={{ tone: "success", title: "Товари додано в кошик" }}
      className="max-w-xl"
    />
  ),
};
