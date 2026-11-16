import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "~/components/ui/input";

import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "./field";
import { fieldProps } from "./field-props";

const PHONE_ERROR = "У номері має бути 10 цифр, наприклад 068 129 99 00.";

function PhoneField({ error }: { error?: string }) {
  const field = fieldProps("phone", { invalid: Boolean(error), description: true });

  return (
    <Field {...field.field}>
      <FieldLabel {...field.label}>Телефон</FieldLabel>
      <Input type="tel" {...field.control} />
      <FieldDescription {...field.description}>Зателефонуємо, щоб підтвердити.</FieldDescription>
      <FieldError {...field.error}>{error}</FieldError>
    </Field>
  );
}

describe("Field", () => {
  it("зв'язує підпис і підказку з полем", () => {
    render(<PhoneField />);
    const input = screen.getByRole("textbox", { name: "Телефон" });

    expect(input).toHaveAccessibleDescription("Зателефонуємо, щоб підтвердити.");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("group")).not.toHaveAttribute("data-invalid");
  });

  it("з помилкою: aria-invalid, текст помилки в описі поля, колір danger", () => {
    render(<PhoneField error={PHONE_ERROR} />);
    const input = screen.getByRole("textbox", { name: "Телефон" });
    const error = screen.getByRole("alert");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "phone-description phone-error");
    expect(input).toHaveAccessibleDescription(`Зателефонуємо, щоб підтвердити. ${PHONE_ERROR}`);
    expect(error).toHaveTextContent(PHONE_ERROR);
    expect(error).toHaveClass("text-danger");
    expect(error).toHaveAttribute("id", "phone-error");
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "true");
  });
});

describe("fieldProps", () => {
  it("без опису й помилки не додає aria-describedby", () => {
    expect(fieldProps("email").control).toEqual({
      id: "email",
      "aria-invalid": undefined,
      "aria-describedby": undefined,
    });
  });

  it("з помилкою без опису посилається лише на помилку", () => {
    expect(fieldProps("email", { invalid: true }).control["aria-describedby"]).toBe("email-error");
  });
});

describe("FieldError", () => {
  it("показує одне повідомлення з errors і прибирає повтори", () => {
    render(<FieldError errors={[{ message: "Вкажіть email" }, { message: "Вкажіть email" }]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Вкажіть email");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("кілька різних повідомлень показує списком", () => {
    render(
      <FieldError
        errors={[{ message: "Вкажіть email" }, undefined, { message: "Додайте символ @" }]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("без вмісту нічого не рендерить", () => {
    const { container } = render(<FieldError errors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("FieldSet", () => {
  it("легенда називає групу полів", () => {
    render(
      <FieldSet>
        <FieldLegend>Адреса доставки</FieldLegend>
      </FieldSet>,
    );

    expect(screen.getByRole("group", { name: "Адреса доставки" })).toBeInTheDocument();
  });
});
