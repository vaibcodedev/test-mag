import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Switch } from "~/components/ui/switch";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./field";
import { fieldProps } from "./field-props";

const meta = {
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

const name = fieldProps("story-field-name");
const phone = fieldProps("story-field-phone", { description: true });
const phoneInvalid = fieldProps("story-field-phone-invalid", { invalid: true });
const city = fieldProps("story-field-city");

export const Default: Story = {
  render: () => (
    <Field {...phone.field}>
      <FieldLabel {...phone.label}>Телефон</FieldLabel>
      <Input type="tel" placeholder="068 129 99 00" autoComplete="tel" {...phone.control} />
      <FieldDescription {...phone.description}>
        Зателефонуємо лише щоб підтвердити замовлення.
      </FieldDescription>
    </Field>
  ),
};

/** Помилка каже, що не так і як це виправити; поле посилається на неї через aria-describedby. */
export const Invalid: Story = {
  render: () => (
    <Field {...phoneInvalid.field}>
      <FieldLabel {...phoneInvalid.label}>Телефон</FieldLabel>
      <Input type="tel" defaultValue="068 129" {...phoneInvalid.control} />
      <FieldError {...phoneInvalid.error}>
        У номері має бути 10 цифр, наприклад 068 129 99 00.
      </FieldError>
    </Field>
  ),
};

/** Форма доставки: група полів із легендою. */
export const DeliveryForm: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Куди доставити</FieldLegend>
      <FieldGroup>
        <Field {...name.field}>
          <FieldLabel {...name.label}>Ім&apos;я та прізвище</FieldLabel>
          <Input placeholder="Олена Коваль" autoComplete="name" {...name.control} />
        </Field>
        <Field {...city.field}>
          <FieldLabel {...city.label}>Місто</FieldLabel>
          <NativeSelect defaultValue="vinnytsia" {...city.control}>
            <NativeSelectOption value="vinnytsia">Вінниця</NativeSelectOption>
            <NativeSelectOption value="kyiv">Київ</NativeSelectOption>
            <NativeSelectOption value="lviv">Львів</NativeSelectOption>
          </NativeSelect>
        </Field>
        <FieldSeparator>або</FieldSeparator>
        <Field orientation="horizontal">
          <Checkbox id="story-field-pickup" />
          <FieldLabel htmlFor="story-field-pickup">Заберу сам із шоуруму</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

/** Горизонтальне поле: підпис із поясненням ліворуч, перемикач праворуч. */
export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="story-field-news">Знижки тижня на пошту</FieldLabel>
        <FieldDescription>Один лист щоп&apos;ятниці, без спаму.</FieldDescription>
      </FieldContent>
      <Switch id="story-field-news" defaultChecked />
    </Field>
  ),
};
