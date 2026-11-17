import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_PROFILE, DEMO_PROFILE_NEW } from "~/components/account/account.fixtures";
import { toast } from "~/components/ui/sonner";

import { ProfileView, type ProfileViewProps } from "./profile-view";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

/** <Form> потребує data-роутера, тому MemoryRouter тут не підходить. */
function renderView(props: Partial<ProfileViewProps> = {}) {
  const router = createMemoryRouter(
    [{ path: "/account/profile", element: <ProfileView profile={DEMO_PROFILE} {...props} /> }],
    { initialEntries: ["/account/profile"] },
  );
  return render(<RouterProvider router={router} />);
}

const VALUES = { firstName: "Олена", lastName: "Коваль", phone: "067 123 45 67" };

/** Radix Switch усередині форми вимірює себе через ResizeObserver, якого в jsdom немає. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProfileView", () => {
  it("має один h1, заголовки без пропусків і підпис з ім'ям та поштою", () => {
    const { container } = renderView();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Профіль" })).toBeVisible();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Особисті дані", "Розсилка", "Вхід"]);
    expect(container.querySelector('[data-slot="customer-name"]')).toHaveTextContent(
      "Олена Коваль",
    );
    expect(container.querySelector('[data-slot="avatar"]')).toHaveTextContent("ОК");
    expect(screen.getByRole("link", { name: "Кабінет" })).toHaveAttribute("href", "/account");
  });

  it("аватар і підпис беруться з даних профілю: нове ім'я видно одразу", () => {
    const { container } = renderView({
      profile: { ...DEMO_PROFILE, firstName: "Марія", lastName: "Шевченко" },
    });

    expect(container.querySelector('[data-slot="avatar"]')).toHaveTextContent("МШ");
    expect(container.querySelector('[data-slot="customer-name"]')).toHaveTextContent(
      "Марія Шевченко",
    );
  });

  it("форма профілю — звичайний POST із полями й підказкою формату телефону", () => {
    const { container } = renderView();

    const form = container.querySelector('[data-slot="profile-form"]') as HTMLFormElement;
    expect(form).toHaveAttribute("method", "post");
    expect(form.querySelector('input[name="intent"]')).toHaveValue("profile");
    expect(screen.getByLabelText("Ім'я")).toHaveValue("Олена");
    expect(screen.getByLabelText("Прізвище")).toHaveValue("Коваль");

    const phone = screen.getByLabelText("Телефон для доставки");
    expect(phone).toHaveValue("+380 67 123 45 67");
    expect(phone).toHaveAttribute("type", "tel");
    expect(phone).toHaveAccessibleDescription(/067 123 45 67 або \+380 67 123 45 67/);
    expect(screen.getByRole("button", { name: "Зберегти зміни" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("помилки стоять біля полів, значення лишаються, фокус — на першому полі з помилкою", () => {
    renderView({
      result: {
        intent: "profile",
        ok: false,
        values: { firstName: "", lastName: "www.spam.example", phone: "067 12" },
        errors: {
          lastName: "Прізвище не може містити посилань і символів < >.",
          phone: "Перевірте номер.",
        },
      },
    });

    const firstName = screen.getByLabelText("Ім'я");
    const lastName = screen.getByLabelText("Прізвище");
    const phone = screen.getByLabelText("Телефон для доставки");

    expect(firstName).not.toHaveAttribute("aria-invalid");
    expect(lastName).toHaveValue("www.spam.example");
    expect(lastName).toHaveAttribute("aria-invalid", "true");
    expect(lastName).toHaveAccessibleDescription(
      "Прізвище не може містити посилань і символів < >.",
    );
    expect(phone).toHaveValue("067 12");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(/Перевірте номер\./);
    expect(lastName).toHaveFocus();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("після збереження показує статус біля кнопки й тост", () => {
    const { container } = renderView({ result: { intent: "profile", ok: true, values: VALUES } });

    expect(container.querySelector('[data-slot="profile-form-status"]')).toHaveTextContent(
      "Зміни збережено",
    );
    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Профіль збережено");
  });

  it("під час надсилання кнопка зайнята й не приймає повторних натискань", () => {
    const { container } = renderView({ pending: { intent: "profile" } });

    expect(screen.getByRole("button", { name: /Зберегти зміни/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(container.querySelector('[data-slot="profile-form-status"]')).toHaveTextContent(
      "Зберігаємо…",
    );
  });

  it.each([
    ["failed", /Спробуйте ще раз за хвилину/],
    ["forbidden", /Напишіть нам у Telegram або зателефонуйте/],
  ] as const)("відмова «%s»: спокійне повідомлення, дані у формі", (failure, message) => {
    renderView({
      result: { intent: "profile", ok: false, values: VALUES, errors: {}, failure },
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Не вдалося зберегти");
    expect(alert).toHaveTextContent(message);
    expect(screen.getByLabelText("Телефон для доставки")).toHaveValue("067 123 45 67");
  });

  it("без адреси доставки поле телефону вимкнене й пояснює чому", () => {
    renderView({ profile: DEMO_PROFILE_NEW });

    const phone = screen.getByLabelText("Телефон для доставки");
    expect(phone).toBeDisabled();
    expect(phone).toHaveAccessibleDescription(/після першого замовлення/);
    expect(screen.getByLabelText("Ім'я")).toHaveValue("");
  });

  it("перемикач розсилки показує справжній стан і надсилає протилежний", () => {
    const { container, unmount } = renderView();
    const form = () => container.querySelector('[data-slot="marketing-form"]') as HTMLFormElement;

    const on = screen.getByRole("switch", { name: "Листи про новинки й знижки" });
    expect(on).toHaveAttribute("aria-checked", "true");
    expect(on).toHaveAttribute("type", "submit");
    expect(on).toHaveAccessibleDescription(
      /Погоджуюсь отримувати листи Ionov Store про новинки, знижки й акції на olena\.koval@example\.com\. Відписатися можна будь-коли\./,
    );
    expect(form().querySelector('input[name="intent"]')).toHaveValue("marketing");
    expect(form().querySelector('input[name="marketing"]')).toHaveValue("unsubscribe");
    unmount();

    const off = renderView({ profile: { ...DEMO_PROFILE, marketing: "unsubscribed" } });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(
      off.container.querySelector('[data-slot="marketing-form"] input[name="marketing"]'),
    ).toHaveValue("subscribe");
  });

  it("під час перемикання показує вибір покупця, після — підтвердження й тост", () => {
    const pending = renderView({
      profile: { ...DEMO_PROFILE, marketing: "unsubscribed" },
      pending: { intent: "marketing", target: "subscribe" },
    });
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-busy", "true");
    expect(
      pending.container.querySelector('[data-slot="marketing-form-status"]'),
    ).toHaveTextContent("Зберігаємо…");
    pending.unmount();

    const saved = renderView({
      profile: { ...DEMO_PROFILE, marketing: "unsubscribed" },
      result: { intent: "marketing", ok: true, target: "unsubscribe" },
    });
    expect(saved.container.querySelector('[data-slot="marketing-form-status"]')).toHaveTextContent(
      "Готово: листів більше не надсилатимемо.",
    );
    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Розсилку вимкнено");
  });

  it("підписка, яку ще не підтверджено з листа, виглядає ввімкненою з поясненням", () => {
    const { container } = renderView({ profile: { ...DEMO_PROFILE, marketing: "pending" } });

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(container.querySelector('[data-slot="marketing-form-status"]')).toHaveTextContent(
      /підтвердьте підписку за посиланням у листі/,
    );
  });

  it("коли керувати розсилкою не можна, перемикач вимкнений, а збій — спокійне повідомлення", () => {
    const unavailable = renderView({ profile: { ...DEMO_PROFILE, marketing: "unavailable" } });
    const control = screen.getByRole("switch");
    expect(control).toBeDisabled();
    expect(control).toHaveAccessibleDescription(/Керувати розсилкою в кабінеті зараз не можна/);
    unavailable.unmount();

    renderView({
      profile: { ...DEMO_PROFILE, marketing: "unsubscribed" },
      result: { intent: "marketing", ok: false, target: "subscribe", failure: "forbidden" },
    });
    const section = screen.getByRole("region", { name: "Розсилка" });
    expect(within(section).getByRole("alert")).toHaveTextContent("Не вдалося зберегти");
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
