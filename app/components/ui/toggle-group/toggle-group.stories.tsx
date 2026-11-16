import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart, Scale } from "lucide-react";
import { useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const MEMORY = ["128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"];
const COLORS = [
  { name: "Синій титан", hex: "#3c4a5e" },
  { name: "Срібний", hex: "#e3e4e5" },
  { name: "Космічний помаранчевий", hex: "#f77e2d" },
];

const meta = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  args: { type: "single" },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Вибір пам'яті на сторінці товару. Недоступний варіант вимкнений. */
export const Memory: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="256 ГБ" aria-label="Пам'ять">
      {MEMORY.map((option) => (
        <ToggleGroupItem key={option} value={option} disabled={option === "1 ТБ"}>
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};

function ColorPicker({ onDark = false }: { onDark?: boolean }) {
  const [color, setColor] = useState(COLORS[0]?.name ?? "");

  return (
    <div className="flex flex-col gap-1">
      <p className="text-small">
        <span className={onDark ? "text-on-ink-muted" : "text-ink-2"}>Колір: </span>
        {color}
      </p>
      <ToggleGroup
        type="single"
        variant="swatch"
        onDark={onDark}
        value={color}
        onValueChange={(next) => (next ? setColor(next) : undefined)}
        aria-label="Колір"
        className="-ms-2"
      >
        {COLORS.map((item) => (
          <ToggleGroupItem
            key={item.name}
            value={item.name}
            swatch={item.hex}
            aria-label={item.name}
            title={item.name}
          />
        ))}
      </ToggleGroup>
    </div>
  );
}

/** Порожнє значення ігнорується: вибраний колір не можна зняти повторним натисканням. */
export const Swatches: Story = { render: () => <ColorPicker /> };

export const SwatchesOnInk: Story = {
  parameters: { surface: "ink" },
  render: () => <ColorPicker onDark />,
};

/** Кілька незалежних перемикачів-іконок. */
export const Icons: Story = {
  parameters: { surface: "page" },
  render: () => (
    <ToggleGroup
      type="multiple"
      variant="icon"
      defaultValue={["wishlist"]}
      aria-label="Дії з товаром"
    >
      <ToggleGroupItem value="wishlist" aria-label="В обраному">
        <Heart aria-hidden="true" strokeWidth={2} />
      </ToggleGroupItem>
      <ToggleGroupItem value="compare" aria-label="У порівнянні">
        <Scale aria-hidden="true" strokeWidth={2} />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
