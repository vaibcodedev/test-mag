import { useCallback, useRef, useState } from "react";

import { toast } from "~/components/ui/sonner";
import { orderReorderPath } from "~/lib/account/order-id";
import {
  reorderFailure,
  reorderOutcome,
  type ReorderOutcome,
  type ReorderPlan,
  type ReorderResult,
} from "~/lib/account/reorder";
import { runExclusiveCartAdd } from "~/lib/cart-add-lock";
import { openCartDrawer } from "~/lib/cart-drawer";
import { useCartStoreStatus, waitForCartStore, type UpdateCart } from "~/lib/cart-ready";

type PlanResponse = { plan: ReorderPlan } | { failure: "signed-out" | "network" };

/** План повторення з сервера: які позиції замовлення зараз можна покласти в кошик. */
async function loadPlan(path: string): Promise<PlanResponse> {
  try {
    const response = await fetch(path, { headers: { Accept: "application/json" } });
    if (response.status === 401) return { failure: "signed-out" };
    if (!response.ok) return { failure: "network" };
    const plan = (await response.json()) as Partial<ReorderPlan>;
    if (!Array.isArray(plan.lines) || !Array.isArray(plan.skipped)) return { failure: "network" };
    return { plan: { lines: plan.lines, skipped: plan.skipped } };
  } catch {
    return { failure: "network" };
  }
}

/** Додає рядки плану одним запитом і зводить відповідь кошика до одного з підсумків. */
async function addPlanToCart(
  plan: ReorderPlan,
  updateCart: UpdateCart,
  getCartStatus: Parameters<typeof waitForCartStore>[1],
): Promise<ReorderResult> {
  try {
    const result = await runExclusiveCartAdd(async () => {
      if (!(await waitForCartStore(updateCart, getCartStatus))) return null;
      // Лише додавання, тож усі рядки йдуть одним викликом (скіл hydrogen-cart-ui).
      return updateCart(
        {
          lines: plan.lines.map(({ merchandiseId, quantity }) => ({ merchandiseId, quantity })),
        },
        { event: { detail: { products: plan.lines.map((line) => line.preview) } } },
      );
    });

    if (!result) return "not-ready";
    if (result.userErrors?.length) return "rejected";
    return result.warnings?.length ? "limited" : "added";
  } catch (error) {
    // CartActionError несе userErrors у cause: це відмова магазину, а не збій мережі.
    const cause = error instanceof Error ? (error.cause as { userErrors?: unknown[] }) : null;
    return cause?.userErrors?.length ? "rejected" : "network";
  }
}

/**
 * «Повторити замовлення»: сервер звіряє позиції з вітриною, після чого доступні товари одним
 * запитом ідуть у поточний кошик і відкривається його панель. Пропущені позиції названо
 * в повідомленні; якщо додати нічого не вдалося, кошик не відкривається.
 *
 * Повторне натискання, доки триває запит, нічого не робить.
 */
export function useReorder() {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<ReorderOutcome | null>(null);
  // Стан оновлюється після рендеру, а другий клік може прийти раніше: замок тримає ref.
  const busy = useRef(false);
  const getCartStatus = useCartStoreStatus();

  const reorder = useCallback(
    async (orderId: string) => {
      if (busy.current) return;
      busy.current = true;
      setPending(true);
      setOutcome(null);

      try {
        const path = orderReorderPath(orderId);
        const updateCart = window.Shopify?.actions?.updateCart;
        let next: ReorderOutcome;

        if (!path || !updateCart) {
          next = reorderFailure(path ? "not-ready" : "network");
        } else {
          const response = await loadPlan(path);
          if ("failure" in response) {
            next = reorderFailure(response.failure);
          } else if (response.plan.lines.length === 0) {
            next = reorderOutcome(response.plan, "added");
          } else {
            next = reorderOutcome(
              response.plan,
              await addPlanToCart(response.plan, updateCart, getCartStatus),
            );
          }
        }

        setOutcome(next);
        if (next.openCart) openCartDrawer();
        // Коли все додано, відкритий кошик і є підтвердженням: тост був би зайвим.
        if (next.message.tone === "warning") {
          toast.warning(next.message.title, { description: next.message.description });
        } else if (next.message.tone === "error") {
          toast.error(next.message.title, { description: next.message.description });
        }
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [getCartStatus],
  );

  return { reorder, pending, outcome };
}
