import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const MODELS = ["iPhone 17 Pro", "iPhone 17", "iPhone Air"];
const SPECS = [
  { name: "Дисплей", values: ["6,3 дюйма, 120 Гц", "6,3 дюйма, 120 Гц", "6,5 дюйма, 120 Гц"] },
  { name: "Чип", values: ["A19 Pro", "A19", "A19 Pro"] },
  { name: "Камера", values: ["48 + 48 + 48 Мп", "48 + 48 Мп", "48 Мп"] },
  { name: "Відео без підзарядки", values: ["до 33 годин", "до 30 годин", "до 27 годин"] },
  { name: "Вага", values: ["206 г", "177 г", "165 г"] },
];
const PRICES = ["64 999 ₴", "44 999 ₴", "54 999 ₴"];

const meta = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
  args: { stickyFirstColumn: false },
  argTypes: { stickyFirstColumn: { control: "boolean" } },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Таблиця порівняння: назви характеристик — заголовки рядків. */
export const Compare: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Ціни дійсні на сьогодні.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Характеристика</TableHead>
          {MODELS.map((model) => (
            <TableHead key={model}>{model}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {SPECS.map((spec) => (
          <TableRow key={spec.name}>
            <TableHead scope="row">{spec.name}</TableHead>
            {spec.values.map((value, index) => (
              <TableCell key={MODELS[index]}>{value}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">Ціна</TableHead>
          {PRICES.map((price, index) => (
            <TableCell key={MODELS[index]} className="tabular-nums">
              {price}
            </TableCell>
          ))}
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/** На вузькому екрані таблиця прокручується, а перша колонка лишається на місці. */
export const StickyFirstColumn: Story = {
  args: { stickyFirstColumn: true, scrollLabel: "Порівняння iPhone" },
  render: (args) => (
    <div className="max-w-sm">
      <Table {...args} className="min-w-xl">
        <TableHeader>
          <TableRow>
            <TableHead>Характеристика</TableHead>
            {MODELS.map((model) => (
              <TableHead key={model}>{model}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {SPECS.map((spec) => (
            <TableRow key={spec.name}>
              <TableHead scope="row">{spec.name}</TableHead>
              {spec.values.map((value, index) => (
                <TableCell key={MODELS[index]}>{value}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
