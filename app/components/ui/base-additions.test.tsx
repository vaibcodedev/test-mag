import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert } from "~/components/ui/alert";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { Command, CommandList, CommandLoading } from "~/components/ui/command";
import { Empty, EmptyTitle } from "~/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Item, ItemMedia } from "~/components/ui/item";
import { PaginationNext, PaginationPrevious } from "~/components/ui/pagination";
import { Toggle } from "~/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

// cmdk міряє список через ResizeObserver, якого в jsdom немає.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

/**
 * Варіанти, які база отримала після міграції на shadcn: раніше їх замінювали класи
 * в компонентах-споживачах.
 */
describe("Toggle і ToggleGroupItem з asChild", () => {
  it("Toggle asChild зі swatch рендерить одну дитину з крапкою всередині", () => {
    render(
      <Toggle asChild variant="swatch" swatch="#e3e4e5">
        <a href="/products/iphone?color=silver" aria-label="Срібний" />
      </Toggle>,
    );
    const link = screen.getByRole("link", { name: "Срібний" });

    expect(link).toHaveAttribute("data-slot", "toggle");
    expect(link).toHaveAttribute("href", "/products/iphone?color=silver");
    expect(link.querySelector('[data-slot="toggle-swatch"]')).not.toBeNull();
  });

  it("ToggleGroupItem asChild: посилання стає радіокнопкою групи й тримає вміст", () => {
    render(
      <ToggleGroup type="single" value="Срібний" aria-label="Колір" rovingFocus={false}>
        <ToggleGroupItem asChild value="Срібний" variant="swatch" swatch="#e3e4e5">
          <a href="?color=silver" aria-label="Срібний" />
        </ToggleGroupItem>
        <ToggleGroupItem asChild value="256 ГБ">
          <a href="?memory=256">256 ГБ</a>
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const swatch = screen.getByRole("radio", { name: "Срібний" });
    const pill = screen.getByRole("radio", { name: "256 ГБ" });

    expect(swatch.tagName).toBe("A");
    expect(swatch).toHaveAttribute("aria-checked", "true");
    expect(swatch.querySelector('[data-slot="toggle-swatch"]')).not.toBeNull();
    expect(pill).toHaveAttribute("href", "?memory=256");
    expect(pill).toHaveTextContent("256 ГБ");
  });

  it("unavailable: закреслений і приглушений, але не вимкнений", async () => {
    render(
      <ToggleGroup type="single" aria-label="Пам'ять">
        <ToggleGroupItem value="512 ГБ" unavailable>
          512 ГБ
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = screen.getByRole("radio", { name: "512 ГБ" });

    expect(item).toHaveAttribute("data-available", "false");
    expect(item).toHaveClass("data-[available=false]:line-through");
    expect(item).toBeEnabled();

    await userEvent.click(item);
    expect(item).toHaveAttribute("aria-checked", "true");
  });

  it("thumbnail: мініатюра 80px із межею у вибраному стані", () => {
    render(
      <Toggle variant="thumbnail" defaultPressed aria-label="Фото 1">
        <img src="/photo.jpg" alt="" />
      </Toggle>,
    );

    expect(screen.getByRole("button", { name: "Фото 1" })).toHaveClass(
      "size-20",
      "rounded-md",
      "data-[state=on]:border-blue",
    );
  });
});

describe("Card", () => {
  it('size="panel": радіус xl і адаптивні поля; padding можна перевизначити', () => {
    render(
      <>
        <Card size="panel" data-testid="panel" />
        <Card size="panel" padding="none" data-testid="bare" />
        <Card padding="panel" data-testid="padded" />
      </>,
    );

    expect(screen.getByTestId("panel")).toHaveClass("rounded-xl", "p-6", "md:p-10");
    expect(screen.getByTestId("panel")).not.toHaveClass("rounded-lg");
    expect(screen.getByTestId("bare")).toHaveClass("rounded-xl");
    expect(screen.getByTestId("bare")).not.toHaveClass("p-6");
    expect(screen.getByTestId("padded")).toHaveClass("rounded-lg", "p-6", "md:p-10");
  });

  it('tone="on-ink": білий 10% і світлий текст, опис приглушений', () => {
    render(
      <Card tone="on-ink" data-testid="card">
        <CardDescription>Опис</CardDescription>
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveClass("bg-on-ink-10", "text-surface");
    expect(screen.getByText("Опис")).toHaveClass("group-data-[tone=on-ink]/card:text-on-ink-muted");
  });

  it("CardTitle має розміри card, h3 і h2-panel", () => {
    render(
      <>
        <CardTitle>типовий</CardTitle>
        <CardTitle size="h3">h3</CardTitle>
        <CardTitle asChild size="h2-panel">
          <h2>панель</h2>
        </CardTitle>
      </>,
    );

    expect(screen.getByText("типовий")).toHaveClass("text-card-title");
    expect(screen.getByText("h3")).toHaveClass("text-h3");
    expect(screen.getByRole("heading", { level: 2, name: "панель" })).toHaveClass("text-h2-panel");
  });
});

describe("Alert, Item, Empty, Pagination", () => {
  it('Alert variant="surface" білий: його видно на сірому тлі сторінки', () => {
    render(<Alert variant="surface">Підказка</Alert>);

    expect(screen.getByRole("status")).toHaveClass("bg-surface");
    expect(screen.getByRole("status")).not.toHaveClass("bg-page");
  });

  it('Item variant="active" помітніший за muted', () => {
    render(
      <Item asChild variant="active">
        <a href="/pages/delivery" aria-current="page">
          Доставка
        </a>
      </Item>,
    );

    expect(screen.getByRole("link", { name: "Доставка" })).toHaveClass("bg-page", "text-blue");
  });

  it("ItemMedia: lime-тон, кругла форма, розмір sm і fit для фото", () => {
    render(
      <>
        <ItemMedia variant="icon" tone="lime" data-testid="lime" />
        <ItemMedia tone="lime" data-testid="plain-lime" />
        <ItemMedia variant="icon" size="sm" shape="round" data-testid="bullet" />
        <ItemMedia variant="icon" data-testid="tile" />
        <ItemMedia variant="image" data-testid="contain" />
        <ItemMedia variant="image" fit="cover" data-testid="cover" />
      </>,
    );

    expect(screen.getByTestId("lime")).toHaveClass("bg-on-ink-10", "text-lime");
    expect(screen.getByTestId("plain-lime")).toHaveClass("text-lime");
    expect(screen.getByTestId("bullet")).toHaveClass("size-6", "rounded-pill");
    expect(screen.getByTestId("bullet")).not.toHaveClass("rounded-md");
    expect(screen.getByTestId("tile")).toHaveClass("size-11", "rounded-md");
    expect(screen.getByTestId("contain")).toHaveClass("[&_img]:object-contain");
    expect(screen.getByTestId("cover")).toHaveClass("[&_img]:object-cover");
    expect(screen.getByTestId("cover")).not.toHaveClass("[&_img]:mix-blend-multiply");
  });

  it("Empty: розмір заголовка не залежить від полів", () => {
    render(
      <>
        <Empty data-testid="page">
          <EmptyTitle>Сторінка</EmptyTitle>
        </Empty>
        <Empty size="sm" data-testid="drawer" />
        <Empty size="panel" titleSize="h3" data-testid="in-page" />
      </>,
    );

    expect(screen.getByTestId("page")).toHaveAttribute("data-title-size", "h2");
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-title-size", "h3");
    expect(screen.getByTestId("in-page")).toHaveAttribute("data-title-size", "h3");
    expect(screen.getByTestId("in-page")).toHaveClass("p-6", "md:p-10");
    expect(screen.getByRole("heading", { name: "Сторінка" })).toHaveClass(
      "group-data-[title-size=h3]/empty:text-h3",
    );
  });

  it('Pagination: showText="always" лишає текст видимим і на телефоні', () => {
    render(
      <>
        <PaginationPrevious href="?page=1" />
        <PaginationNext href="?page=3" showText="always" text="Старіші статті" />
      </>,
    );

    expect(screen.getByText("Попередня")).toHaveClass("hidden", "sm:block");
    expect(screen.getByText("Старіші статті")).not.toHaveClass("hidden");
  });
});

describe("Accordion forceMount", () => {
  it("відповідь лишається в DOM, а закритий блок схований на самому корені", async () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>Чи є гарантія?</AccordionTrigger>
          <AccordionContent forceMount>12 місяців</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const content = screen.getByText("12 місяців").closest('[data-slot="accordion-content"]');

    expect(content).toHaveAttribute("data-state", "closed");
    expect(content).toHaveClass("data-closed:hidden");

    await userEvent.click(screen.getByRole("button", { name: "Чи є гарантія?" }));

    expect(content).toHaveAttribute("data-state", "open");
  });
});

describe("Field та Input на ink", () => {
  it("onDark позначає поле, а частини беруть кольори для темного тла", () => {
    render(
      <Field onDark data-testid="field">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" onDark />
        <FieldError>Помилка</FieldError>
        <FieldDescription>Підказка</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId("field")).toHaveAttribute("data-on-dark", "true");
    expect(screen.getByText("Email")).toHaveClass("group-data-[on-dark=true]/field:text-surface");
    expect(screen.getByRole("alert")).toHaveClass("group-data-[on-dark=true]/field:text-surface");
    expect(screen.getByText("Підказка")).toHaveClass(
      "group-data-[on-dark=true]/field:text-on-ink-muted",
    );
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveClass(
      "border-surface",
      "focus-visible:shadow-focus-on-ink",
    );
  });

  it("без onDark поле лишається звичайним", () => {
    render(<Input aria-label="Телефон" />);

    expect(screen.getByRole("textbox", { name: "Телефон" })).not.toHaveClass("border-surface");
  });
});

describe("Command", () => {
  it("unstyled прибирає вигляд панелі; CommandLoading показує стан завантаження", () => {
    render(
      <>
        <Command data-testid="panel" label="Панель" />
        <Command unstyled data-testid="bare" label="Обгортка">
          <CommandList>
            <CommandLoading>Шукаємо…</CommandLoading>
          </CommandList>
        </Command>
      </>,
    );

    expect(screen.getByTestId("panel")).toHaveClass("overflow-hidden", "bg-surface", "rounded-md");
    expect(screen.getByTestId("bare")).not.toHaveClass("overflow-hidden");
    expect(screen.getByTestId("bare")).not.toHaveClass("bg-surface");
    expect(screen.getByRole("progressbar")).toHaveTextContent("Шукаємо…");
  });
});
