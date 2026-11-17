import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

import type { ProductCardData } from "~/components/product/product-card";
import { toast } from "~/components/ui/sonner";
import { runExclusiveCartAdd } from "~/lib/cart-add-lock";
import { useCartStoreStatus, waitForCartStore } from "~/lib/cart-ready";

export { CART_READY_TIMEOUT_MS } from "~/lib/cart-ready";

const NETWORK_ERROR = "Перевірте з'єднання й натисніть «Купити» ще раз.";
const NOT_READY_ERROR =
  "Кошик ще завантажується. Зачекайте кілька секунд і натисніть «Купити» ще раз.";
const REJECTED_ERROR =
  "Магазин не прийняв цей товар: можливо, він щойно закінчився. Відкрийте сторінку товару й перевірте наявність.";
const WARNING_ERROR =
  "Кошик повідомив про проблему з цим товаром: можливо, його немає в потрібній кількості. Перевірте кошик.";

/** Рядок кошика, який стор показує одразу, не чекаючи відповіді Shopify. */
function previewOf(product: ProductCardData, merchandiseId: string) {
  return {
    id: merchandiseId,
    price: product.price,
    title: product.title,
    image: product.image,
    selectedOptions: [],
    product: { title: product.title, handle: product.handle },
  };
}

/**
 * «Купити» з картки товару: додає варіант картки в кошик без перезавантаження сторінки.
 *
 * Зміна йде через Shopify Standard Actions, тому стор кошика сам показує її оптимістично
 * та відкочує в разі помилки. Перед запитом хук чекає, доки стор буде готовий, а самі додавання
 * йдуть по одному на всю сторінку (~/lib/cart-add-lock): перший товар устигає створити кошик,
 * перш ніж у нього полетить наступний. «Додано в кошик» показуємо лише тоді, коли Shopify
 * відповів без помилок і попереджень.
 */
export function useAddToCart() {
  const [addingHandle, setAddingHandle] = useState<string | null>(null);
  const navigate = useNavigate();

  const getCartStatus = useCartStoreStatus();

  const addToCart = useCallback(
    async (product: ProductCardData) => {
      if (addingHandle) return;

      const updateCart = window.Shopify?.actions?.updateCart;
      const merchandiseId = product.variantId;
      // Без варіанта чи без скриптів Shopify купити з картки не можна: ведемо на сторінку товару.
      if (!merchandiseId || !updateCart) {
        await navigate(`/products/${product.handle}`, { viewTransition: true });
        return;
      }

      setAddingHandle(product.handle);
      try {
        const result = await runExclusiveCartAdd(async () => {
          if (!(await waitForCartStore(updateCart, getCartStatus))) return null;
          return updateCart(
            { lines: [{ merchandiseId, quantity: 1 }] },
            { event: { detail: { products: [previewOf(product, merchandiseId)] } } },
          );
        });

        if (!result) {
          toast.error("Не вдалося додати товар", { description: NOT_READY_ERROR });
        } else if (result.userErrors?.length) {
          toast.error("Не вдалося додати товар", { description: REJECTED_ERROR });
        } else if (result.warnings?.length) {
          toast.error("Товар додано не повністю", { description: WARNING_ERROR });
        } else {
          toast.success("Додано в кошик", { description: product.title });
        }
      } catch (error) {
        // CartActionError несе userErrors у cause: це відмова магазину, а не збій мережі.
        const cause = error instanceof Error ? (error.cause as { userErrors?: unknown[] }) : null;
        toast.error("Не вдалося додати товар", {
          description: cause?.userErrors?.length ? REJECTED_ERROR : NETWORK_ERROR,
        });
      } finally {
        setAddingHandle(null);
      }
    },
    [addingHandle, getCartStatus, navigate],
  );

  return { addToCart, addingHandle };
}
