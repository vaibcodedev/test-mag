import { cva, type VariantProps } from "class-variance-authority";

/** Одне поле форми: підпис, елемент керування, підказка, помилка. */
export const fieldVariants = cva("group/field flex w-full min-w-0 gap-2", {
  variants: {
    orientation: {
      /** Підпис над полем. */
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      /** Підпис поруч: прапорець, перемикач. Рядок заввишки 44px. */
      horizontal:
        "min-h-11 flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto",
      /** Стовпчик у вузькій FieldGroup і рядок у широкій. */
      responsive:
        "flex-col *:w-full @md/field-group:min-h-11 @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export type FieldVariants = VariantProps<typeof fieldVariants>;
