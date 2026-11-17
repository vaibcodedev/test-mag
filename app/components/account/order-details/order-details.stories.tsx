import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DEMO_ORDER_ADJUSTMENTS,
  DEMO_ORDER_DETAILS,
  DEMO_ORDER_REFUNDED,
  DEMO_ORDER_REFUNDED_ADJUSTMENTS,
  DEMO_ORDER_SHIPMENT_WITHOUT_TRACKING,
  DEMO_ORDER_SHIPMENTS,
  DEMO_ORDER_SINGLE,
  DEMO_ORDER_SINGLE_ADJUSTMENTS,
  DEMO_REORDER_FAILED,
  DEMO_REORDER_PARTIAL,
} from "~/components/account/account.fixtures";
import { STORE_INFO } from "~/lib/content/site";

import { OrderDetails } from "./order-details";

const meta = {
  title: "Account/OrderDetails",
  component: OrderDetails,
  parameters: { surface: "page" },
  args: {
    store: STORE_INFO,
    order: DEMO_ORDER_DETAILS,
    adjustments: DEMO_ORDER_ADJUSTMENTS,
    shipments: DEMO_ORDER_SHIPMENTS,
  },
} satisfies Meta<typeof OrderDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Багато позицій, знижки (промокод і безкоштовна доставка), два відправлення. */
export const ManyItems: Story = {};

/** Одна позиція, платна доставка, відправлень ще немає. */
export const OneItem: Story = {
  args: {
    order: DEMO_ORDER_SINGLE,
    adjustments: DEMO_ORDER_SINGLE_ADJUSTMENTS,
    shipments: [],
  },
};

/** Скасоване замовлення: причина скасування й повернення коштів двома частинами. */
export const CancelledWithRefunds: Story = {
  args: {
    order: DEMO_ORDER_REFUNDED,
    adjustments: DEMO_ORDER_REFUNDED_ADJUSTMENTS,
    shipments: [],
  },
};

/** Відправлення без номера для відстеження; невідомий код події не показуємо. */
export const NoTracking: Story = {
  args: {
    order: DEMO_ORDER_SINGLE,
    adjustments: DEMO_ORDER_SINGLE_ADJUSTMENTS,
    shipments: DEMO_ORDER_SHIPMENT_WITHOUT_TRACKING,
  },
};

/** Магазин не віддав другорядні дані: лишаються товари, сума й допомога. */
export const CoreOnly: Story = { args: { adjustments: null, shipments: null } };

/** «Повторити замовлення» в роботі: кнопка зі спінером, повторні натискання не діють. */
export const ReorderPending: Story = {
  args: { reorderState: { pending: true, outcome: null } },
};

/** Додано частину: пропущені позиції названо. */
export const ReorderPartial: Story = {
  args: { reorderState: { pending: false, outcome: DEMO_REORDER_PARTIAL } },
};

/** Нічого додати не вдалося: кошик не відкривається. */
export const ReorderFailed: Story = {
  args: {
    order: DEMO_ORDER_REFUNDED,
    adjustments: DEMO_ORDER_REFUNDED_ADJUSTMENTS,
    shipments: [],
    reorderState: { pending: false, outcome: DEMO_REORDER_FAILED },
  },
};
