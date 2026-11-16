import { Heart } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

import { Container } from "~/components/layout/container";
import { ClearListDialog } from "~/components/saved/clear-list-dialog";
import { SavedLoadError } from "~/components/saved/saved-load-error";
import { WishlistGrid } from "~/components/saved/wishlist-grid";
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
import { useSavedProducts } from "~/hooks/use-saved-products";
import { useWishlist } from "~/hooks/use-wishlist";
import { plural } from "~/lib/format";
import { wishlistStore } from "~/lib/saved-lists";

/** Товари, яких у магазині вже немає, тихо зникають з обраного. */
function dropMissing(handles: readonly string[]) {
  for (const handle of handles) wishlistStore.remove(handle);
}

/**
 * Сторінка «Обране». Список живе в браузері, тому на сервері це порожній стан,
 * а картки довантажуються після монтування.
 */
export function WishlistView() {
  const { handles, count, clear } = useWishlist();
  // Останні додані — на початку.
  const newestFirst = useMemo(() => [...handles].reverse(), [handles]);
  const { products, pendingCount, failed, retry } = useSavedProducts(newestFirst, {
    onMissing: dropMissing,
  });
  const { addToCart, addingHandle } = useAddToCart();

  if (count === 0) {
    return (
      <Container>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Heart strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h1">Обране</EmptyTitle>
            <EmptyDescription>
              Тут поки порожньо. Натисніть сердечко на картці товару, і він з&apos;явиться на цій
              сторінці — так зручно повернутися до моделей, які сподобались.
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
          <h1 className="text-h2 text-ink">Обране</h1>
          <p className="text-body text-ink-2" aria-live="polite">
            {count} {plural(count, { one: "товар", few: "товари", many: "товарів" })}. Список
            збережено в цьому браузері.
          </p>
        </div>
        <ClearListDialog
          triggerLabel="Очистити обране"
          title="Очистити обране?"
          description="Усі товари зникнуть зі списку. Повернути їх можна буде лише вручну, сердечком на картці."
          confirmLabel="Так, очистити"
          onConfirm={clear}
        />
      </div>

      {failed ? <SavedLoadError onRetry={retry} /> : null}

      <WishlistGrid
        products={products}
        pendingCount={pendingCount}
        onAddToCart={addToCart}
        addingHandle={addingHandle}
      />
    </Container>
  );
}
