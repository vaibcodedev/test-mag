import assert from "node:assert/strict";
import test from "node:test";

import { describeSuggestions } from "../app/lib/predictive-search.ts";

function resultWith(count: number, term = "iphone") {
  return { term, items: { products: Array.from({ length: count }, () => ({})) } };
}

test("announces nothing until a result has settled", () => {
  assert.equal(describeSuggestions({ status: "idle", result: resultWith(0, "") }), "");
  assert.equal(describeSuggestions({ status: "loading", result: resultWith(0, "") }), "");
  assert.equal(describeSuggestions({ status: "loading", result: resultWith(3) }), "");
  assert.equal(describeSuggestions({ status: "error", result: resultWith(3) }), "");
});

test("announces the settled count with the term that produced it", () => {
  assert.equal(
    describeSuggestions({ status: "success", result: resultWith(0, "zzz") }),
    "Нічого не знайшли за запитом «zzz»",
  );
  assert.equal(
    describeSuggestions({ status: "success", result: resultWith(1) }),
    "1 підказка за запитом «iphone»",
  );
  assert.equal(
    describeSuggestions({ status: "success", result: resultWith(4) }),
    "4 підказки за запитом «iphone»",
  );
  assert.equal(
    describeSuggestions({ status: "success", result: resultWith(5) }),
    "5 підказок за запитом «iphone»",
  );
});

test("counts collections and query suggestions together with products", () => {
  const result = {
    term: "mac",
    items: { products: [{}], collections: [{}], queries: [{}, {}] },
  };
  assert.equal(describeSuggestions({ status: "success", result }), "4 підказки за запитом «mac»");
});
