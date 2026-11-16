import { useCart } from "~/lib/cart";

/** Суми кошика зі стору Hydrogen і ознака, що вони ще не підтверджені сервером. */
export function useCartTotals() {
  const cost = useCart((state) => state.data.cost);
  const checkoutUrl = useCart((state) => state.data.checkoutUrl);
  const hasLines = useCart((state) => state.data.lines.nodes.length > 0);
  const pending = useCart((state) => {
    const { cost: costPending, lines, discountCodes } = state.pending;
    const stale = costPending ?? (lines.size > 0 || discountCodes.size > 0);
    return stale || state.revalidating === true;
  });

  return {
    subtotal: cost.subtotalAmount,
    total: cost.totalAmount,
    checkoutUrl: checkoutUrl ?? null,
    pending,
    /** У кошику є товари: можна показувати оформлення та Shop Pay. */
    hasLines,
  };
}
