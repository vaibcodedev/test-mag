import { useEffect, useRef, useState } from "react";

import { useCartTotals } from "~/components/cart/cart-summary";
import { useCart } from "~/lib/cart";

/**
 * Озвучує зміну кошика для екранних читачів: «Оновлюємо…», «Кошик оновлено» і окремо
 * «Товар прибрано з кошика» — коли рядок зник (кнопка «Прибрати», «мінус» на останній
 * одиниці або кількість 0 у полі).
 */
export function CartStatus() {
  const { pending } = useCartTotals();
  const networkErrors = useCart((state) => state.errors.network);
  const lineCount = useCart((state) => state.data.lines.nodes.length);
  const [sawPending, setSawPending] = useState(false);
  const [removed, setRemoved] = useState(false);
  const previous = useRef({ pending, lineCount });

  useEffect(() => {
    const before = previous.current;
    previous.current = { pending, lineCount };

    if (lineCount < before.lineCount) setRemoved(true);
    // Рядок повернувся (сервер відхилив видалення) або почалася нова зміна.
    else if (lineCount > before.lineCount || (pending && !before.pending)) setRemoved(false);
    if (pending) setSawPending(true);
  }, [pending, lineCount]);

  let message = "";
  if (pending) message = "Оновлюємо кошик";
  else if (sawPending && networkErrors.length === 0) {
    message = removed ? "Товар прибрано з кошика" : "Кошик оновлено";
  }

  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-cart-status>
      {message}
    </span>
  );
}
