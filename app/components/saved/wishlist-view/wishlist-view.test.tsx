import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_SAVED_PRODUCTS } from "~/components/saved/saved.fixtures";
import { wishlistStore, type SavedProduct } from "~/lib/saved-lists";

import { WishlistView } from "./wishlist-view";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

const [FIRST, SECOND] = DEMO_SAVED_PRODUCTS as [SavedProduct, SavedProduct];

/** Відповідає як /api/saved-products: повертає лише відомі товари. */
function mockApi(known: SavedProduct[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "https://sad.example");
    const handles = (url.searchParams.get("handles") ?? "").split(",");
    return Response.json({ products: known.filter((item) => handles.includes(item.handle)) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderView() {
  return render(
    <MemoryRouter>
      <WishlistView />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  act(() => wishlistStore.clear());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WishlistView", () => {
  it("порожнє обране запрошує до каталогу й не ходить в API", () => {
    const fetchMock = mockApi([]);
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Обране" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toHaveAttribute(
      "href",
      "/collections",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("показує заглушки, потім картки: останні додані спершу, зниклі товари прибирає", async () => {
    act(() => {
      wishlistStore.add(FIRST.handle);
      wishlistStore.add("gone-product");
      wishlistStore.add(SECOND.handle);
    });
    const fetchMock = mockApi([FIRST, SECOND]);
    renderView();

    expect(screen.getAllByRole("status", { name: "Завантаження товару" })).toHaveLength(3);

    const cards = await screen.findAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading").textContent)).toEqual([
      SECOND.title,
      FIRST.title,
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `/api/saved-products?handles=${SECOND.handle},gone-product,${FIRST.handle}`,
    );

    await waitFor(() => expect(wishlistStore.getSnapshot()).toEqual([FIRST.handle, SECOND.handle]));
    expect(screen.queryByRole("status", { name: "Завантаження товару" })).toBeNull();
    expect(screen.getByText(/2 товари/)).toBeInTheDocument();
    // Після прибирання зниклого товару повторного запиту немає.
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("сердечко на картці прибирає товар зі сторінки без нового запиту", async () => {
    act(() => {
      wishlistStore.add(FIRST.handle);
      wishlistStore.add(SECOND.handle);
    });
    const fetchMock = mockApi([FIRST, SECOND]);
    renderView();

    await userEvent.click(
      await screen.findByRole("button", { name: `Прибрати з обраного: ${FIRST.title}` }),
    );

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(wishlistStore.getSnapshot()).toEqual([SECOND.handle]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("«Очистити обране» питає підтвердження", async () => {
    act(() => {
      wishlistStore.add(FIRST.handle);
    });
    mockApi([FIRST]);
    renderView();
    await screen.findByRole("article");

    await userEvent.click(screen.getByRole("button", { name: "Очистити обране" }));
    const dialog = screen.getByRole("alertdialog", { name: "Очистити обране?" });
    // Фокус спершу на безпечній дії: Enter не очистить список випадково.
    expect(within(dialog).getByRole("button", { name: "Скасувати" })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole("button", { name: "Скасувати" }));
    expect(wishlistStore.getSnapshot()).toEqual([FIRST.handle]);
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Очистити обране" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Так, очистити" }),
    );

    expect(wishlistStore.getSnapshot()).toEqual([]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toBeInTheDocument();
  });

  it("коли запит не вдався, список лишається, а «Спробувати ще раз» повторює його", async () => {
    act(() => {
      wishlistStore.add(FIRST.handle);
    });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    renderView();

    expect(await screen.findByRole("alert")).toHaveTextContent("Не вдалося завантажити товари");
    expect(wishlistStore.getSnapshot()).toEqual([FIRST.handle]);

    mockApi([FIRST]);
    await userEvent.click(screen.getByRole("button", { name: "Спробувати ще раз" }));

    expect(await screen.findByRole("article")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
