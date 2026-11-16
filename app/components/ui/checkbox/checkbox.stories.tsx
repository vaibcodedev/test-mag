import type { Meta, StoryObj } from "@storybook/react-vite";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Slider } from "~/components/ui/slider";

import { Checkbox } from "./checkbox";

const MEMORY = ["128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"];
const CONDITION = ["Новий", "Як новий", "Відмінний", "Хороший"];
const ROW = "flex min-h-11 cursor-pointer items-center gap-3 text-body";

const meta = {
  title: "UI/Checkbox, Radio, Slider",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckboxList: Story = {
  render: () => (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-2 text-small font-semibold">Пам&apos;ять</legend>
      {MEMORY.map((option, index) => (
        <label key={option} className={ROW}>
          <Checkbox defaultChecked={index === 1} disabled={index === 3} />
          {option}
        </label>
      ))}
    </fieldset>
  ),
};

export const Radio: Story = {
  render: () => (
    <RadioGroup defaultValue={CONDITION[0]} aria-label="Стан">
      {CONDITION.map((option) => (
        <label key={option} className={ROW}>
          <RadioGroupItem value={option} />
          {option}
        </label>
      ))}
    </RadioGroup>
  ),
};

export const PriceSlider: Story = {
  render: () => (
    <div className="max-w-sm">
      <Slider
        defaultValue={[20000, 90000]}
        min={0}
        max={150000}
        step={1000}
        thumbLabels={["Ціна від", "Ціна до"]}
      />
    </div>
  ),
};
