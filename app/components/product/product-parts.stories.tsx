import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ColorSwatches, type ColorSwatch } from "~/components/product/color-swatches";
import { CompareButton } from "~/components/product/compare-button";
import { InstallmentChip } from "~/components/product/installment-chip";
import { StockStatus } from "~/components/product/stock-status";
import { UsedGrade } from "~/components/product/used-grade";
import { WishlistButton } from "~/components/product/wishlist-button";

/** Демо-значення метаполя custom.color_swatches: дані товару, а не кольори інтерфейсу. */
const COLORS: ColorSwatch[] = [
  { name: "Синій титан", hex: "#3c4a5e" },
  { name: "Срібний", hex: "#e3e4e5" },
  { name: "Космічний помаранчевий", hex: "#f77e2d" },
];

const meta = {
  title: "Product/Деталі товару",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Installment: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <InstallmentChip price={{ amount: "119999", currencyCode: "UAH" }} />
      <InstallmentChip price={{ amount: "49999", currencyCode: "UAH" }} months={24} showIcon />
    </div>
  ),
};

export const Stock: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StockStatus available delivery="доставимо завтра" />
      <StockStatus available={false} />
    </div>
  ),
};

export const Used: Story = { render: () => <UsedGrade batteryHealth={91} /> };

function SwatchPicker({ onDark = false }: { onDark?: boolean }) {
  const [color, setColor] = useState(COLORS[0]?.name);
  return <ColorSwatches colors={COLORS} value={color} onChange={setColor} onDark={onDark} />;
}

export const Swatches: Story = { render: () => <SwatchPicker /> };

/** На ink кільце вибору lime. */
export const SwatchesOnInk: Story = {
  parameters: { surface: "ink" },
  render: () => <SwatchPicker onDark />,
};

export const SwatchList: Story = { render: () => <ColorSwatches colors={COLORS} /> };

function Toggles() {
  const [wishlisted, setWishlisted] = useState(true);
  const [compared, setCompared] = useState(false);
  return (
    <div className="flex gap-2">
      <WishlistButton
        productTitle="iPhone 17 Pro"
        active={wishlisted}
        onClick={() => setWishlisted((value) => !value)}
      />
      <CompareButton
        productTitle="iPhone 17 Pro"
        active={compared}
        onClick={() => setCompared((value) => !value)}
      />
    </div>
  );
}

export const WishlistAndCompare: Story = {
  parameters: { surface: "page" },
  render: () => <Toggles />,
};
