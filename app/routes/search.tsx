import { SearchPage } from "~/components/search/search-page";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import { STORE_INFO } from "~/lib/content/site";
import { loadSearchPage } from "~/lib/search";
import { SEARCH_PATH } from "~/lib/search-path";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/search";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION =
  "Пошук техніки Apple в магазині «Сад»: iPhone, Mac, iPad, Watch, AirPods та аксесуари. Шоурум у Вінниці, доставка по Україні завтра.";

/** «Пошук: iphone 17 — Сад», але не довше 60 символів. */
function pageTitle(term: string): string {
  const suffix = ` — ${STORE_INFO.name}`;
  if (!term) return `Пошук товарів${suffix}`;
  const prefix = "Пошук: ";
  const room = TITLE_MAX_LENGTH - prefix.length - suffix.length;
  const shown = term.length > room ? `${term.slice(0, room - 1).trimEnd()}…` : term;
  return `${prefix}${shown}${suffix}`;
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = pageTitle(loaderData?.searchTerm ?? "");
  const url = `${loaderData?.origin ?? ""}${SEARCH_PATH}`;

  return [
    { title },
    { name: "description", content: DESCRIPTION },
    // Результати пошуку не індексуємо: це нескінченна кількість сторінок без власного вмісту.
    { name: "robots", content: "noindex, follow" },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: STORE_INFO.name },
    { property: "og:title", content: title },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: url },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return loadSearchPage({ storefrontClient, request });
}

export default function SearchRoute({ loaderData }: Route.ComponentProps) {
  const { addToCart, addingHandle } = useAddToCart();

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-6 pb-section outline-none">
      <SearchPage data={loaderData} onAddToCart={addToCart} addingHandle={addingHandle} />
    </main>
  );
}
