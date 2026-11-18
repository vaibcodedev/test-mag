import { cva, type VariantProps } from "class-variance-authority";

/**
 * Квадрат прапорця 24px. Один вигляд для двох реалізацій:
 * radix — кнопка Radix (`Checkbox`), стан у data-атрибутах;
 * native — <span> одразу після прихованого `<input type="checkbox" class="peer">`
 * усередині `<label class="group/option">` (фільтри колекції, які працюють без JavaScript).
 */
export const checkboxBoxVariants = cva(
  "flex size-6 shrink-0 items-center justify-center rounded-sm border border-ink-2 bg-surface transition-colors duration-150",
  {
    variants: {
      control: {
        radix:
          "peer relative cursor-pointer outline-none after:absolute after:-inset-2.5 hover:border-blue focus-visible:shadow-focus-offset disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger data-checked:border-blue data-checked:bg-blue data-checked:text-on-accent",
        native:
          "text-on-accent group-hover/option:border-blue peer-checked:border-blue peer-checked:bg-blue peer-focus-visible:shadow-focus-offset [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
      },
    },
    defaultVariants: { control: "radix" },
  },
);

export type CheckboxBoxVariants = VariantProps<typeof checkboxBoxVariants>;
