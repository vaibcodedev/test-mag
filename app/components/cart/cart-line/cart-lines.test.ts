import { describe, expect, it } from "vitest";

import { removedLines, withLeaving } from "./cart-lines";

type Line = Parameters<typeof withLeaving>[0][number];
const line = (id: string) => ({ id }) as Line;
const ids = (lines: readonly Line[]) => lines.map((item) => item.id);

describe("removedLines", () => {
  it("знаходить рядки, що зникли з кошика, разом із місцем, де вони стояли", () => {
    const removed = removedLines([line("a"), line("b"), line("c")], [line("a"), line("c")]);

    expect(removed.map((item) => [item.line.id, item.index])).toEqual([["b", 1]]);
  });

  it("зміна кількості чи порядку без видалення нічого не повертає", () => {
    expect(removedLines([line("a"), line("b")], [line("b"), line("a")])).toEqual([]);
  });
});

describe("withLeaving", () => {
  it("ставить прибраний рядок на його колишнє місце", () => {
    const merged = withLeaving([line("a"), line("c")], [{ line: line("b"), index: 1 }]);

    expect(ids(merged)).toEqual(["a", "b", "c"]);
  });

  it("останній і єдиний рядки теж лишаються до кінця згортання", () => {
    expect(ids(withLeaving([line("a")], [{ line: line("z"), index: 5 }]))).toEqual(["a", "z"]);
    expect(ids(withLeaving([], [{ line: line("only"), index: 0 }]))).toEqual(["only"]);
  });

  it("кілька прибраних рядків зберігають взаємний порядок", () => {
    const merged = withLeaving(
      [line("b")],
      [
        { line: line("c"), index: 2 },
        { line: line("a"), index: 0 },
      ],
    );

    expect(ids(merged)).toEqual(["a", "b", "c"]);
  });

  it("товар, який повернули в кошик, не дублюється", () => {
    const merged = withLeaving([line("a"), line("b")], [{ line: line("b"), index: 1 }]);

    expect(ids(merged)).toEqual(["a", "b"]);
  });
});
