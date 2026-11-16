export type FieldPropsOptions = {
  /** Поле має помилку: вмикає aria-invalid і додає id помилки в aria-describedby. */
  invalid?: boolean;
  /** Під полем є FieldDescription: її id потрапляє в aria-describedby. */
  description?: boolean;
};

/**
 * Зв'язує частини поля за одним id (зазвичай із useId):
 *
 *   const field = fieldProps(id, { invalid: Boolean(error), description: true });
 *   <Field {...field.field}>
 *     <FieldLabel {...field.label}>Телефон</FieldLabel>
 *     <Input {...field.control} />
 *     <FieldDescription {...field.description}>…</FieldDescription>
 *     <FieldError {...field.error}>{error}</FieldError>
 *   </Field>
 */
export function fieldProps(
  id: string,
  { invalid = false, description = false }: FieldPropsOptions = {},
) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, invalid ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return {
    field: { "data-invalid": invalid ? ("true" as const) : undefined },
    label: { htmlFor: id },
    control: {
      id,
      "aria-invalid": invalid ? (true as const) : undefined,
      "aria-describedby": describedBy || undefined,
    },
    description: { id: descriptionId },
    error: { id: errorId },
  };
}
