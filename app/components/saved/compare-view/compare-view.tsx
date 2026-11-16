import { ArrowRight, Info, Scale } from "lucide-react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { ClearListDialog } from "~/components/saved/clear-list-dialog";
import { CompareTable, CompareTableSkeleton } from "~/components/saved/compare-table";
import { SavedLoadError } from "~/components/saved/saved-load-error";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import { useCompare } from "~/hooks/use-compare";
import { useSavedProducts } from "~/hooks/use-saved-products";
import { plural } from "~/lib/format";
import { compareStore } from "~/lib/saved-lists";

/** Товари, яких у магазині вже немає, тихо зникають із порівняння. */
function dropMissing(handles: readonly string[]) {
  for (const handle of handles) compareStore.remove(handle);
}

/**
 * Сторінка «Порівняння». Список живе в браузері, тому на сервері це порожній стан,
 * а таблиця довантажується після монтування.
 */
export function CompareView() {
  const { handles, count, limit, isFull, remove, clear } = useCompare();
  const { products, pendingCount, loading, failed, retry } = useSavedProducts(handles, {
    onMissing: dropMissing,
  });
  const { addToCart, addingHandle } = useAddToCart();

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
              <Link to="/collections" prefetch="intent">
                Перейти до каталогу
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 text-ink">Порівняння</h1>
          <p className="text-body text-ink-2" aria-live="polite">
            {count} з {limit} {plural(limit, { one: "товару", few: "товарів", many: "товарів" })}.
            {isFull ? " Щоб додати інший, приберіть один зі списку." : null}
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

      {count === 1 ? (
        <Alert variant="surface">
          <Info aria-hidden="true" strokeWidth={2} />
          <AlertTitle>Додайте ще один товар</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>Тоді побачите відмінності між моделями поруч.</p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/collections" prefetch="intent">
                Обрати в каталозі
                <ArrowRight strokeWidth={2} aria-hidden="true" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {failed ? <SavedLoadError onRetry={retry} /> : null}
      {loading ? <CompareTableSkeleton columns={pendingCount + products.length} /> : null}
      {!loading && products.length > 0 ? (
        <CompareTable
          products={products}
          onRemove={(product) => remove(product.handle)}
          onAddToCart={addToCart}
          addingHandle={addingHandle}
        />
      ) : null}
    </Container>
  );
}
