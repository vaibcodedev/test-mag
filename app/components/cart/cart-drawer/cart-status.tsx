import { useEffect, useState } from "react";

import { useCartTotals } from "~/components/cart/cart-summary";
import { useCart } from "~/lib/cart";

/** Озвучує зміну кошика для екранних читачів: «Оновлюємо…» і «Кошик оновлено». */
export function CartStatus() {
  const { pending } = useCartTotals();
  const networkErrors = useCart((state) => state.errors.network);
  const [sawPending, setSawPending] = useState(false);

  useEffect(() => {
    if (pending) setSawPending(true);
  }, [pending]);

  let message = "";
  if (pending) message = "Оновлюємо кошик";
  else if (sawPending && networkErrors.length === 0) message = "Кошик оновлено";

  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-cart-status>
      {message}
    </span>
  );
}
