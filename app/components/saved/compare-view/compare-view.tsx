import { Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { ClearListDialog } from "~/components/saved/clear-list-dialog";
import { CompareTable, CompareTableSkeleton } from "~/components/saved/compare-table";
import { SavedLoadError } from "~/components/saved/saved-load-error";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import { useCompare } from "~/hooks/use-compare";
import { useSavedProducts } from "~/hooks/use-saved-products";
import {
  COMPARE_CATEGORIES,
  type CompareCategory,
  type CompareCategoryKey,
} from "~/lib/compare/spec-schema";
import { compareStore, type SavedProduct } from "~/lib/saved-lists";

/** Товари, яких у магазині вже немає, тихо зникають із порівняння. */
function dropMissing(handles: readonly string[]) {
  for (const handle of handles) compareStore.remove(handle);
}

type CompareGroup = { category: CompareCategory; products: SavedProduct[] };

/** Товари за категоріями в порядку схеми; категорії без товарів не потрапляють у список. */
export function groupByCategory(products: readonly SavedProduct[]): CompareGroup[] {
  return COMPARE_CATEGORIES.map((category) => ({
    category,
    products: products.filter((product) => product.compareCategory === category.key),
  })).filter((group) => group.products.length > 0);
}

/**
 * Сторінка «Порівняння». Список живе в браузері, тому на сервері це порожній стан,
 * а таблиці довантажуються після монтування. Порівнюються товари однієї категорії:
 * кожна категорія — окрема вкладка зі своєю таблицею.
 */
export function CompareView() {
  const { handles, count, remove, clear } = useCompare();
  const { products, pendingCount, loading, failed, retry } = useSavedProducts(handles, {
    onMissing: dropMissing,
  });
  const { addToCart, addingHandle } = useAddToCart();
  const [selected, setSelected] = useState<CompareCategoryKey | null>(null);

  const groups = useMemo(() => groupByCategory(products), [products]);
  // Вибрана вкладка могла спорожніти: тоді показуємо першу з наявних.
  const active = groups.find((group) => group.category.key === selected) ?? groups[0];

  // Аксесуари не порівнюються: якщо такий товар лишився в старому списку, прибираємо його.
  useEffect(() => {
    for (const product of products) {
      if (!product.compareCategory) compareStore.remove(product.handle);
    }
  }, [products]);

  if (count === 0) {
    return (
      <Container>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Scale strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h1">Порівняння</EmptyTitle>
            <EmptyDescription>
              Тут поки порожньо. Додайте дві або більше моделей кнопкою з терезами на картці товару,
              щоб побачити їхні відмінності поруч.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link viewTransition to="/collections" prefetch="intent">
                Перейти до каталогу
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Container>
    );
  }

  const table = (group: CompareGroup) => (
    <CompareTable
      category={group.category}
      products={group.products}
      onRemove={(product) => remove(product.handle)}
      onAddToCart={addToCart}
      addingHandle={addingHandle}
    />
  );

  return (
    <Container className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 text-ink">Порівняння</h1>
          <p className="max-w-2xl text-body text-ink-2">
            Порівнюємо моделі однієї категорії — iPhone з iPhone, Mac із Mac. До чотирьох у кожній.
          </p>
        </div>
        <ClearListDialog
          triggerLabel="Очистити порівняння"
          title="Очистити порівняння?"
          description="Усі товари зникнуть із таблиці. Додати їх знову можна кнопкою з терезами на картці."
          confirmLabel="Так, очистити"
          onConfirm={clear}
        />
      </div>

      {failed ? <SavedLoadError onRetry={retry} /> : null}
      {loading ? <CompareTableSkeleton columns={pendingCount + products.length} /> : null}

      {!loading && active && groups.length === 1 ? table(active) : null}
      {!loading && active && groups.length > 1 ? (
        <Tabs
          value={active.category.key}
          onValueChange={(value) => setSelected(value as CompareCategoryKey)}
        >
          {/* Вкладок до п'яти: на телефоні рядок гортається. Поля лишають місце кільцю фокуса. */}
          <div className="-m-2 overflow-x-auto p-2">
            <TabsList aria-label="Категорії порівняння">
              {groups.map(({ category, products: items }) => (
                <TabsTrigger key={category.key} value={category.key}>
                  {category.title}
                  <Badge variant={category.key === active.category.key ? "count-on-blue" : "count"}>
                    {items.length}
                    <span className="sr-only"> у порівнянні</span>
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {groups.map((group) => (
            <TabsContent key={group.category.key} value={group.category.key}>
              {table(group)}
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </Container>
  );
}
