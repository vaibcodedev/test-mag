import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Newsletter, validateEmail, type NewsletterProps } from "./newsletter";
import { NEWSLETTER_DEMO_CONTENT as CONTENT } from "./newsletter.demo";

function renderNewsletter(props: Partial<NewsletterProps> = {}) {
  render(<Newsletter content={CONTENT} {...props} />);

  return {
    input: screen.getByRole("textbox", { name: CONTENT.emailLabel }),
    button: screen.getByRole("button", { name: CONTENT.submitLabel }),
  };
}

describe("validateEmail", () => {
  it("розрізняє порожнє поле, неправильну й правильну адресу", () => {
    expect(validateEmail("   ")).toBe("empty");
    expect(validateEmail("olena")).toBe("invalid");
    expect(validateEmail("olena@example")).toBe("invalid");
    expect(validateEmail(" olena@example.com ")).toBeNull();
  });
});

describe("Newsletter", () => {
  it("має заголовок секції, підписане поле пошти з підказкою і кнопку", () => {
    const { input, button } = renderNewsletter();

    expect(screen.getByRole("heading", { level: 2, name: CONTENT.title })).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription(CONTENT.hint);
    expect(button).toHaveAttribute("type", "submit");
  });

  it("для порожнього поля пояснює, що ввести, і не викликає onSubmit", async () => {
    const onSubmit = vi.fn();
    const { input, button } = renderNewsletter({ onSubmit });

    await userEvent.click(button);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(`${CONTENT.errors.empty} ${CONTENT.hint}`);
    expect(input).toHaveFocus();
  });

  it("для неправильної адреси каже, чого бракує, і прибирає помилку після виправлення", async () => {
    const onSubmit = vi.fn();
    const { input } = renderNewsletter({ onSubmit });

    await userEvent.type(input, "olena.example.com{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(CONTENT.errors.invalid)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    await userEvent.clear(input);
    await userEvent.type(input, "olena@example.com");

    expect(screen.queryByText(CONTENT.errors.invalid)).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("передає в onSubmit адресу без пробілів і показує підтвердження на місці форми", async () => {
    const onSubmit = vi.fn();
    const { input, button } = renderNewsletter({ onSubmit });

    await userEvent.type(input, "  olena@example.com ");
    await userEvent.click(button);

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("olena@example.com");
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(CONTENT.successTitle);
    expect(status).toHaveFocus();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("показує підтвердження лише після того, як onSubmit завершився", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { input, button } = renderNewsletter({ onSubmit });

    await userEvent.type(input, "olena@example.com");
    await userEvent.click(button);

    expect(onSubmit).toHaveBeenCalledOnce();
    // Поки сервер не відповів, підтвердження немає: форма ще на місці.
    expect(screen.queryByText(CONTENT.successTitle)).toBeNull();
    expect(screen.getByRole("textbox", { name: CONTENT.emailLabel })).toBeInTheDocument();

    finish();
    expect(await screen.findByText(CONTENT.successTitle)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("без onSubmit не звітує про підписку: показує, що розсилку ще налаштовуємо, і лишає адресу", async () => {
    const { input, button } = renderNewsletter({ telegramUrl: "https://t.me/sad_vinnytsia" });

    await userEvent.type(input, "olena@example.com");
    await userEvent.click(button);

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent(CONTENT.pending);
    expect(screen.queryByText(CONTENT.successTitle)).toBeNull();
    expect(screen.queryByText(CONTENT.successText)).toBeNull();
    expect(screen.getByRole("textbox", { name: CONTENT.emailLabel })).toHaveValue(
      "olena@example.com",
    );
    expect(screen.getByRole("link", { name: CONTENT.pendingLinkLabel })).toHaveAttribute(
      "href",
      "https://t.me/sad_vinnytsia",
    );
  });

  it("без onSubmit і без посилання на Telegram показує лише текст", async () => {
    const { input, button } = renderNewsletter();

    await userEvent.type(input, "olena@example.com");
    await userEvent.click(button);

    expect(await screen.findByRole("status")).toHaveTextContent(CONTENT.pending);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("без onSubmit неправильна адреса так само дає помилку, а не повідомлення", async () => {
    const { input } = renderNewsletter();

    await userEvent.type(input, "olena{Enter}");

    expect(screen.getByText(CONTENT.errors.invalid)).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("якщо onSubmit завершився помилкою, лишає форму й пояснює, що робити", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("мережа"));
    const { input, button } = renderNewsletter({ onSubmit });

    await userEvent.type(input, "olena@example.com");
    await userEvent.click(button);

    expect(await screen.findByText(CONTENT.errors.failed)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: CONTENT.emailLabel })).toHaveValue(
      "olena@example.com",
    );
    expect(screen.queryByRole("status")).toBeNull();
  });
});
