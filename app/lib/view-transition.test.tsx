import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  TransitionSource,
  transitionTargetOf,
  useTransitionDetail,
  useTransitionSource,
  viewTransitionName,
  viewTransitionStyle,
} from "./view-transition";

function Card({ href, label }: { href: string; label: string }) {
  const transition = useTransitionSource<HTMLDivElement>(href);
  return (
    <div data-testid={label} {...transition}>
      <button type="button">{label}</button>
    </div>
  );
}

function Detail({ handle }: { handle: string }) {
  return <main data-testid={`detail-${handle}`} {...useTransitionDetail("product", handle)} />;
}

describe("viewTransitionName", () => {
  it("складає назву з типу й handle і лишає в ній тільки символи CSS-ідентифікатора", () => {
    expect(viewTransitionName("product", "iphone-17-pro")).toBe("product-iphone-17-pro");
    expect(viewTransitionName("collection", "знижки 2026")).toBe("collection-_______2026");
    expect(viewTransitionStyle("article", "mac")).toEqual({ "--vt-name": "article-mac" });
  });
});

describe("transitionTargetOf", () => {
  it("розпізнає товар, колекцію і статтю за адресою, без параметрів і якоря", () => {
    expect(transitionTargetOf("/products/iphone-17?variant=1")).toEqual({
      kind: "product",
      handle: "iphone-17",
    });
    expect(transitionTargetOf("/collections/mac#top")).toEqual({
      kind: "collection",
      handle: "mac",
    });
    expect(transitionTargetOf("/blogs/blog/yak-obraty")).toEqual({
      kind: "article",
      handle: "yak-obraty",
    });
  });

  it("інші адреси не мають пари для розкриття", () => {
    expect(transitionTargetOf("/pages/trade-in")).toBeNull();
    expect(transitionTargetOf("/collections")).toBeNull();
    expect(transitionTargetOf("/")).toBeNull();
  });
});

describe("useTransitionSource", () => {
  it("клік позначає картку джерелом переходу й знімає позначку з попередньої", () => {
    render(
      <>
        <Card href="/products/a" label="перша" />
        <Card href="/products/a" label="друга" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "перша" }));
    expect(screen.getByTestId("перша")).toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("друга")).not.toHaveAttribute("data-vt-source");

    // Той самий товар у другій секції: джерелом стає саме та картка, по якій клацнули.
    fireEvent.click(screen.getByRole("button", { name: "друга" }));
    expect(screen.getByTestId("перша")).not.toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("друга")).toHaveAttribute("data-vt-source");
  });

  it("після «Назад» позначає картку на тому самому місці серед карток цієї адреси", () => {
    const list = (
      <>
        <Card href="/products/b" label="у знижках" />
        <Card href="/products/c" label="інший товар" />
        <Card href="/products/b" label="у популярному" />
      </>
    );
    const first = render(list);
    fireEvent.click(screen.getByRole("button", { name: "у популярному" }));
    first.unmount();

    // Нова розмітка списку після повернення: позначку отримує друга картка товару, а не перша.
    render(list);

    expect(screen.getByTestId("у популярному")).toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("у знижках")).not.toHaveAttribute("data-vt-source");
    expect(screen.getByTestId("інший товар")).not.toHaveAttribute("data-vt-source");
  });
});

describe("useTransitionDetail", () => {
  it("сторінка бере участь у розкритті лише під час переходу зі своєї картки", () => {
    render(
      <>
        <Card href="/products/x" label="картка x" />
        <Card href="/pages/delivery" label="звичайне посилання" />
        <Detail handle="x" />
        <Detail handle="y" />
      </>,
    );
    const detail = screen.getByTestId("detail-x");

    expect(detail).not.toHaveAttribute("data-vt-active");
    expect(detail).toHaveStyle({ "--vt-name": "product-x" });

    fireEvent.click(screen.getByRole("button", { name: "картка x" }));
    expect(detail).toHaveAttribute("data-vt-active");
    // Сторінка іншого товару лишається частиною звичайного переходу.
    expect(screen.getByTestId("detail-y")).not.toHaveAttribute("data-vt-active");

    // Будь-який інший клік — це вже звичайний перехід: фото не йде окремим шаром.
    fireEvent.click(document.body);
    expect(detail).not.toHaveAttribute("data-vt-active");

    // «Назад» повертає останню пару, щоб сторінка згорнулася в картку.
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(detail).toHaveAttribute("data-vt-active");
  });

  it("картка, що веде не на товар, колекцію чи статтю, розкриття не вмикає", () => {
    render(
      <>
        <Card href="/products/z" label="товар z" />
        <Card href="/pages/trade-in" label="trade-in" />
        <Detail handle="z" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "товар z" }));
    fireEvent.click(screen.getByRole("button", { name: "trade-in" }));

    expect(screen.getByTestId("detail-z")).not.toHaveAttribute("data-vt-active");
  });
});

describe("TransitionSource", () => {
  it("додає дочірньому елементу назву переходу й позначає його по кліку", () => {
    render(
      <TransitionSource href="/collections/mac">
        <article data-testid="tile" className="tile" style={{ color: "red" }}>
          <button type="button">Mac</button>
        </article>
      </TransitionSource>,
    );
    const tile = screen.getByTestId("tile");

    expect(tile).toHaveClass("tile");
    expect(tile).toHaveStyle({ "--vt-name": "collection-mac" });
    expect(tile).toHaveAttribute("data-vt-href", "/collections/mac");

    fireEvent.click(screen.getByRole("button", { name: "Mac" }));
    expect(tile).toHaveAttribute("data-vt-source");
  });

  it("для сторінки без пари назви переходу не задає", () => {
    render(
      <TransitionSource href="/pages/trade-in">
        <article data-testid="tile" />
      </TransitionSource>,
    );

    expect(screen.getByTestId("tile").style.getPropertyValue("--vt-name")).toBe("");
  });
});
